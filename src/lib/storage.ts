import "server-only";

import crypto from "node:crypto";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  deleteObject,
  isS3Configured,
  presignObjectUrl,
  publicObjectUrl,
  putObject,
} from "@/lib/s3";

/**
 * Penyimpanan berkas unggahan + tautan bertanda tangan (signed URL).
 *
 * Berkas disimpan **di luar `public/`** sehingga tidak bisa diakses langsung:
 * satu-satunya jalan adalah `/media/<id>?exp=<ms>&sig=<hmac>` yang kedaluwarsa.
 * Itu membuat tautan hasil salin-tempel mati setelah beberapa jam (anti-hotlink
 * sederhana) dan bisa diganti CDN/referer bila nanti pindah ke R2/Bunny.
 *
 * URL tersimpan di database memakai skema `local:<id>` (disk aplikasi) atau
 * `r2:<key>` (penyimpanan objek S3-compatible); tanda tangan dibuat saat
 * render (lihat `src/lib/media.ts`), jadi tautan selalu segar.
 *
 * Driver dipilih otomatis: bila `CAPTNIME_S3_*` lengkap → `r2`, kalau tidak →
 * `local`. `CAPTNIME_STORAGE_DRIVER` bisa memaksa salah satunya.
 */

export const LOCAL_PREFIX = "local:";
export const REMOTE_PREFIX = "r2:";

export type StorageDriver = "local" | "r2";

/** Umur maksimum tautan yang dibuat saat halaman dirender (6 jam). */
export const SIGNED_TTL_MS = 6 * 60 * 60 * 1000;

const VIDEO_MIME = new Map([
  [".mp4", "video/mp4"],
  [".m4v", "video/mp4"],
  [".webm", "video/webm"],
  [".ogv", "video/ogg"],
  [".mov", "video/quicktime"],
]);

const SUBTITLE_MIME = new Map([
  [".vtt", "text/vtt; charset=utf-8"],
  [".srt", "text/plain; charset=utf-8"],
  [".ass", "text/plain; charset=utf-8"],
]);

export type UploadKind = "video" | "subtitle";

/** `1a2b3c-<uuid>.mp4` — huruf/angka kecil, tanpa garis miring. */
const SAFE_ID = /^[a-z0-9]{4,20}-[a-z0-9-]{8,48}\.[a-z0-9]{2,5}$/;

export function uploadDir(): string {
  const custom = process.env.CAPTNIME_UPLOAD_DIR?.trim();
  return custom ? custom : path.join(process.cwd(), "data", "uploads");
}

export function maxUploadMb(): number {
  const value = Number(process.env.CAPTNIME_UPLOAD_MAX_MB);
  return Number.isFinite(value) && value > 0 ? value : 512;
}

export function mimeForUpload(name: string, kind: UploadKind): string | null {
  const ext = path.extname(name).toLowerCase();
  const table = kind === "video" ? VIDEO_MIME : SUBTITLE_MIME;
  return table.get(ext) ?? null;
}

/** Jenis berkas dari ekstensinya; `null` bila tidak didukung. */
export function uploadKindOf(name: string): UploadKind | null {
  if (mimeForUpload(name, "video")) return "video";
  if (mimeForUpload(name, "subtitle")) return "subtitle";
  return null;
}

export function storageDriver(): StorageDriver {
  const explicit = process.env.CAPTNIME_STORAGE_DRIVER?.trim().toLowerCase();
  if (explicit === "local" || explicit === "r2") return explicit;
  return isS3Configured() ? "r2" : "local";
}

export function storageDriverLabel(): string {
  return storageDriver() === "r2" ? "Penyimpanan objek (S3/R2)" : "Disk server";
}

export function isLocalMedia(url: string): boolean {
  return url.startsWith(LOCAL_PREFIX);
}

export function isRemoteMedia(url: string): boolean {
  return url.startsWith(REMOTE_PREFIX);
}

/** True untuk kedua bentuk simpanan kita (local: maupun r2:). */
export function isStoredMedia(url: string): boolean {
  return isLocalMedia(url) || isRemoteMedia(url);
}

export function remoteMediaKey(url: string): string | null {
  if (!isRemoteMedia(url)) return null;
  const key = url.slice(REMOTE_PREFIX.length);
  return key && !key.startsWith("/") && !key.includes("..") ? key : null;
}

export function localMediaId(url: string): string | null {
  if (!isLocalMedia(url)) return null;
  const id = url.slice(LOCAL_PREFIX.length);
  return SAFE_ID.test(id) ? id : null;
}

export class UploadError extends Error {
  constructor(readonly code: "berkas-jenis" | "berkas-kosong" | "berkas-terlalu-besar" | "berkas-gagal") {
    super(code);
  }
}

/** Simpan berkas unggahan; kembalikan URL `local:<id>` yang disimpan di database. */
export async function saveUpload(
  file: File,
  options: { kind?: UploadKind } = {},
): Promise<{ url: string; id: string; size: number; mime: string; filename: string }> {
  const filename = path.basename(file.name || "berkas");
  const kind = options.kind ?? uploadKindOf(filename);

  if (!kind) throw new UploadError("berkas-jenis");
  const mime = mimeForUpload(filename, kind);
  if (!mime) throw new UploadError("berkas-jenis");

  if (!file.size) throw new UploadError("berkas-kosong");
  if (file.size > maxUploadMb() * 1024 * 1024) throw new UploadError("berkas-terlalu-besar");

  const ext = path.extname(filename).toLowerCase();
  const id = `${Date.now().toString(36)}-${crypto.randomUUID()}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (storageDriver() === "r2") {
    const key = `${kind === "video" ? "video" : "subtitle"}/${id}`;
    try {
      await putObject(key, new Uint8Array(bytes), mime);
      return { url: `${REMOTE_PREFIX}${key}`, id, size: bytes.length, mime, filename };
    } catch {
      throw new UploadError("berkas-gagal");
    }
  }

  const dir = uploadDir();
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, id), bytes, { flag: "wx" });
    return { url: `${LOCAL_PREFIX}${id}`, id, size: bytes.length, mime, filename };
  } catch {
    throw new UploadError("berkas-gagal");
  }
}

export async function mediaFile(
  id: string,
): Promise<{ path: string; size: number; mime: string } | null> {
  if (!SAFE_ID.test(id)) return null;
  const full = path.join(uploadDir(), id);
  try {
    const info = await stat(full);
    if (!info.isFile()) return null;
    const ext = path.extname(id).toLowerCase();
    const mime = VIDEO_MIME.get(ext) ?? SUBTITLE_MIME.get(ext) ?? "application/octet-stream";
    return { path: full, size: info.size, mime };
  } catch {
    return null;
  }
}

/**
 * Hapus media simpanan berdasarkan URL database (`local:<id>` / `r2:<key>`).
 * Kegagalan diabaikan: pemanggil hanya ingin barisnya hilang.
 */
export async function deleteStoredMedia(url: string): Promise<void> {
  const key = remoteMediaKey(url);
  if (key) {
    try {
      await deleteObject(key);
    } catch {
      // Objek sudah tidak ada / penyimpanan sedang tak terjangkau.
    }
    return;
  }

  const id = localMediaId(url);
  if (!id) return;
  try {
    await unlink(path.join(uploadDir(), id));
  } catch {
    // Berkas sudah tidak ada — tidak apa-apa.
  }
}

export async function deleteUpload(id: string): Promise<void> {
  if (!SAFE_ID.test(id)) return;
  try {
    await unlink(path.join(uploadDir(), id));
  } catch {
    // Berkas sudah tidak ada — tidak apa-apa.
  }
}

function mediaSecret(): string {
  const value =
    process.env.CAPTNIME_MEDIA_SECRET ??
    process.env.CAPTNIME_ADMIN_SECRET ??
    process.env.CAPTNIME_ADMIN_PASSWORD ??
    "captnime-dev-secret";
  // Dipisah dari secret sesi admin supaya tanda tangan berbeda ranah.
  return crypto.createHash("sha256").update(`media:${value}`).digest("hex");
}

function signature(id: string, exp: number): string {
  return crypto.createHmac("sha256", mediaSecret()).update(`${id}:${exp}`).digest("hex");
}

/**
 * Tautan putar untuk media simpanan.
 *
 * - `local:<id>` → `/media/<id>?exp=…&sig=…` (route kita sendiri).
 * - `r2:<key>`   → URL publik CDN bila disetel, kalau tidak presigned GET S3
 *                  yang kedaluwarsa sama lamanya.
 */
export function signMediaUrl(url: string, ttlMs = SIGNED_TTL_MS): string {
  const key = remoteMediaKey(url);
  if (key) {
    const ttlSeconds = Math.max(30, Math.round(ttlMs / 1000));
    try {
      return publicObjectUrl(key) ?? presignObjectUrl(key, { expiresIn: ttlSeconds });
    } catch {
      return url;
    }
  }

  const id = localMediaId(url);
  if (!id) return url;
  const exp = Date.now() + ttlMs;
  return `/media/${id}?exp=${exp}&sig=${signature(id, exp)}`;
}

export function verifyMediaSignature(id: string, exp: number, sig: string): boolean {
  if (!SAFE_ID.test(id)) return false;
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;
  const expected = signature(id, exp);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(sig, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
