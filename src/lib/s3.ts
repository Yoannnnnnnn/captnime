import "server-only";

import crypto from "node:crypto";

/**
 * Klien S3-compatible minimal (Cloudflare R2, Backblaze B2, MinIO, AWS S3).
 *
 * Tanpa dependensi: yang dibutuhkan hanya **presigned URL** (SigV4 query
 * authentication) untuk GET/PUT/DELETE, jadi cukup `node:crypto` + `fetch`.
 * Dengan begitu unggahan tidak melewati disk aplikasi dan pemutaran berkas
 * besar dilayani langsung oleh penyimpanan/CDN.
 *
 * Catatan implementasi:
 * - Gaya path (`/<bucket>/<key>`), bukan virtual-host, supaya satu endpoint
 *   berlaku untuk R2 (`<account>.r2.cloudflarestorage.com`) maupun MinIO lokal.
 * - Payload hash `UNSIGNED-PAYLOAD` (khas presigned URL) — isi berkas tidak
 *   ikut ditandatangani, hanya metode, path, dan waktu kedaluwarsa.
 * - Header yang ditandatangani hanya `host`.
 */

export interface S3Config {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string | null;
}

export const S3_ENV_HINT =
  "CAPTNIME_S3_ENDPOINT, CAPTNIME_S3_BUCKET, CAPTNIME_S3_ACCESS_KEY_ID, dan CAPTNIME_S3_SECRET_ACCESS_KEY";

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function s3Config(): S3Config | null {
  const endpoint = env("CAPTNIME_S3_ENDPOINT");
  const bucket = env("CAPTNIME_S3_BUCKET");
  const accessKeyId = env("CAPTNIME_S3_ACCESS_KEY_ID");
  const secretAccessKey = env("CAPTNIME_S3_SECRET_ACCESS_KEY");
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;

  return {
    endpoint: endpoint.replace(/\/+$/, ""),
    bucket,
    region: env("CAPTNIME_S3_REGION") || "auto",
    accessKeyId,
    secretAccessKey,
    publicBaseUrl: env("CAPTNIME_S3_PUBLIC_BASE_URL").replace(/\/+$/, "") || null,
  };
}

export function isS3Configured(): boolean {
  return s3Config() !== null;
}

/** Encode RFC3986 (encodeURIComponent masih membiarkan !'()*). */
function rfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/** Encode tiap segmen key, garis miring dibiarkan. */
function encodeKey(key: string): string {
  return key
    .split("/")
    .map((segment) => rfc3986(segment))
    .join("/");
}

function hmac(key: crypto.BinaryLike, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function amzDateStamp(now: Date): { amzDate: string; dateStamp: string } {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

export type S3Method = "GET" | "PUT" | "DELETE";

export interface PresignOptions {
  method?: S3Method;
  /** Detik; maksimum 7 hari (batas S3/R2). */
  expiresIn?: number;
  config?: S3Config;
  now?: Date;
}

/**
 * Presigned URL untuk satu objek. Mengembalikan URL bertanda tangan ke
 * endpoint S3 (bukan CDN publik).
 */
export function presignObjectUrl(key: string, options: PresignOptions = {}): string {
  const config = options.config ?? s3Config();
  if (!config) throw new Error(`Penyimpanan objek belum dikonfigurasi: ${S3_ENV_HINT}`);
  if (!key || key.startsWith("/")) throw new Error("Key objek tidak valid.");

  const method = options.method ?? "GET";
  const expiresIn = Math.min(Math.max(1, Math.round(options.expiresIn ?? 3600)), 604800);
  const { amzDate, dateStamp } = amzDateStamp(options.now ?? new Date());

  const host = new URL(config.endpoint).host;
  const canonicalUri = `/${rfc3986(config.bucket)}/${encodeKey(key)}`;
  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;

  const params: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${config.accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
  };

  const canonicalQuery = Object.keys(params)
    .sort()
    .map((name) => `${rfc3986(name)}=${rfc3986(params[name])}`)
    .join("&");

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${config.secretAccessKey}`, dateStamp), config.region), "s3"),
    "aws4_request",
  );
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

  return `${config.endpoint}/${rfc3986(config.bucket)}/${encodeKey(key)}?${canonicalQuery}` +
    `&X-Amz-Signature=${signature}`;
}

/** URL publik (CDN/domain kustom) bila disetel — tanpa tanda tangan & tanpa kedaluwarsa. */
export function publicObjectUrl(key: string, config = s3Config()): string | null {
  if (!config?.publicBaseUrl) return null;
  return `${config.publicBaseUrl}/${encodeKey(key)}`;
}

/** Unggah objek; isi berkas dikirim ke S3, bukan ditulis ke disk aplikasi. */
export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
  const url = presignObjectUrl(key, { method: "PUT", expiresIn: 900 });
  const response = await fetch(url, {
    method: "PUT",
    body: body as unknown as BodyInit,
    headers: { "Content-Type": contentType },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`S3 PUT gagal (${response.status}) ${detail.slice(0, 200)}`.trim());
  }
}

export async function deleteObject(key: string): Promise<void> {
  const url = presignObjectUrl(key, { method: "DELETE", expiresIn: 300 });
  const response = await fetch(url, { method: "DELETE" });
  // 404 berarti sudah tidak ada — itu hasil yang diinginkan.
  if (!response.ok && response.status !== 404) {
    throw new Error(`S3 DELETE gagal (${response.status})`);
  }
}
