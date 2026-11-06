import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth-user";
import {
  addWatchlist,
  getProgress,
  upsertProgress,
} from "@/lib/db/accounts";

export const dynamic = "force-dynamic";

interface LocalHistory {
  slug?: unknown;
  episode?: unknown;
  position?: unknown;
  duration?: unknown;
  updatedAt?: unknown;
}

interface LocalWatchlist {
  slug?: unknown;
  addedAt?: unknown;
}

const toInt = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

/**
 * Menyalin data tamu (localStorage) ke akun saat pengguna pertama masuk.
 *
 * Aturan: data server yang lebih baru menang. Ini mencegah riwayat perangkat
 * lama menimpa progres yang sudah disinkronkan dari perangkat lain.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });
  if (!user.emailVerified) {
    return NextResponse.json(
      {
        error: "verifikasi",
        message: "Verifikasi email dulu agar data perangkat ini bisa disalin ke akun.",
      },
      { status: 403 },
    );
  }

  let body: { history?: LocalHistory[]; watchlist?: LocalWatchlist[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  let importedProgress = 0;
  let importedWatchlist = 0;

  for (const item of Array.isArray(body.history) ? body.history.slice(0, 200) : []) {
    const slug = typeof item.slug === "string" ? item.slug.trim() : "";
    if (!slug) continue;

    const localUpdated = toInt(item.updatedAt, 0);
    const existing = getProgress(user.id, slug);
    const serverUpdated = existing ? Date.parse(existing.updatedAt) || 0 : 0;
    if (existing && serverUpdated > localUpdated) continue;

    upsertProgress({
      userId: user.id,
      slug,
      episodeNumber: toInt(item.episode, 1),
      position: toInt(item.position, 0),
      duration: toInt(item.duration, 0),
    });
    importedProgress += 1;
  }

  for (const item of Array.isArray(body.watchlist) ? body.watchlist.slice(0, 200) : []) {
    const slug = typeof item.slug === "string" ? item.slug.trim() : "";
    if (!slug) continue;
    addWatchlist(user.id, slug);
    importedWatchlist += 1;
  }

  return NextResponse.json({ ok: true, importedProgress, importedWatchlist });
}
