import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Autentikasi admin: satu password dari environment, sesi berupa cookie
 * httpOnly bertanda tangan HMAC (password tidak pernah disimpan di cookie).
 *
 * Cocok untuk satu-dua operator. Untuk banyak editor, ganti dengan tabel
 * `admins` + hashing argon2 atau pasang better-auth / NextAuth — fungsi di
 * sini sengaja dibuat kecil agar mudah ditukar.
 */

export const ADMIN_COOKIE = "captnime_admin";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 jam

function secret(): string {
  const value =
    process.env.CAPTNIME_ADMIN_SECRET ??
    process.env.CAPTNIME_ADMIN_PASSWORD ??
    "captnime-dev-secret";
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function adminPassword(): string {
  return process.env.CAPTNIME_ADMIN_PASSWORD ?? "admin";
}

/** True bila password masih default — ditampilkan sebagai peringatan di panel. */
export function isDefaultPassword(): boolean {
  return !process.env.CAPTNIME_ADMIN_PASSWORD;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionValue(): string {
  const payload = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionValue(value: string | undefined): boolean {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;

  const expires = Number(payload);
  return Number.isFinite(expires) && expires > Date.now();
}

export function checkPassword(input: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(adminPassword());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Dipakai layout panel: mengalihkan ke halaman masuk bila sesi tidak sah. */
export async function requireAdmin(): Promise<void> {
  const store = await cookies();
  if (!verifySessionValue(store.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin/login");
  }
}
