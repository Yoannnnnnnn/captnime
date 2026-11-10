import { createReadStream } from "node:fs";
import { Readable } from "node:stream";

import { mediaFile, verifyMediaSignature } from "@/lib/storage";

/**
 * Penyaji berkas unggahan.
 *
 * Hanya melayani tautan bertanda tangan yang belum kedaluwarsa; berkasnya
 * sendiri ada di luar `public/`, jadi tanpa tanda tangan isinya tidak bisa
 * diambil. Dukungan `Range` diperlukan agar pemutar bisa melompat ke tengah
 * video tanpa mengunduh seluruh berkas.
 */

export const dynamic = "force-dynamic";

const DENIED = "Tautan media tidak sah atau sudah kedaluwarsa. Muat ulang halaman tonton.";

function textResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ file: string }> },
): Promise<Response> {
  const { file } = await context.params;
  const url = new URL(request.url);
  const exp = Number(url.searchParams.get("exp") ?? "");
  const sig = url.searchParams.get("sig") ?? "";

  if (!verifyMediaSignature(file, exp, sig)) return textResponse(DENIED, 403);

  const info = await mediaFile(file);
  if (!info) return textResponse("Berkas tidak ditemukan.", 404);

  const headers = new Headers({
    "Content-Type": info.mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=600",
    "Content-Disposition": `inline; filename="${file}"`,
    "X-Content-Type-Options": "nosniff",
  });

  const range = request.headers.get("range")?.trim();
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return textResponse("Permintaan rentang tidak valid.", 416);

    const [, rawStart, rawEnd] = match;
    let start: number;
    let end: number;

    if (!rawStart && rawEnd) {
      // "bytes=-500" → 500 bita terakhir.
      const tail = Number(rawEnd);
      start = Math.max(0, info.size - tail);
      end = info.size - 1;
    } else {
      start = Number(rawStart || 0);
      end = rawEnd ? Number(rawEnd) : info.size - 1;
    }

    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= info.size) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${info.size}` },
      });
    }

    end = Math.min(end, info.size - 1);
    headers.set("Content-Range", `bytes ${start}-${end}/${info.size}`);
    headers.set("Content-Length", String(end - start + 1));

    const stream = Readable.toWeb(createReadStream(info.path, { start, end })) as ReadableStream;
    return new Response(stream, { status: 206, headers });
  }

  headers.set("Content-Length", String(info.size));
  const stream = Readable.toWeb(createReadStream(info.path)) as ReadableStream;
  return new Response(stream, { status: 200, headers });
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ file: string }> },
): Promise<Response> {
  const response = await GET(request, context);
  return new Response(null, { status: response.status, headers: response.headers });
}
