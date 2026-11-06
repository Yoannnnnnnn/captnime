import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSession,
  deleteSession,
  findSessionUser,
  findUserByEmail,
  type PublicUser,
} from "@/lib/db/accounts";

/**
 * Autentikasi pengguna dengan scrypt + sesi database.
 *
 * - Password: scrypt (N=16384, r=8, p=1) dengan salt acak 16 byte. Format
 *   tersimpan: `scrypt$N$salt$hash` (base64url) sehingga parameter bisa
 *   dinaikkan tanpa mematahkan hash lama.
 * - Sesi: token acak 32 byte di cookie httpOnly; yang disimpan di tabel
 *   `sessions` hanya SHA-256 token tersebut. Bocornya isi database tidak
 *   langsung memberi token yang bisa dipakai.
 * - Cookie `Secure` hanya saat permintaan lewat HTTPS, supaya login tetap
 *   berfungsi pada `npm start` di http://localhost.
 *
 * Sengaja tanpa dependensi eksternal. Bila nanti butuh login Google/GitHub,
 * OAuth, atau verifikasi email, pasang better-auth/NextAuth lalu petakan
 * ke tabel `users` yang sudah ada.
 */

export const SESSION_COOKIE = "captnime_session";
const SESSION_DAYS = 30;
const SCRYPT_N = 16_384;

/* ------------------------------------------------------------------ */
/* Password                                                            */
/* ------------------------------------------------------------------ */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, { N: SCRYPT_N, r: 8, p: 1 });
  return [
    "scrypt",
    SCRYPT_N,
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, nRaw, saltRaw, hashRaw] = stored.split("$");
  if (scheme !== "scrypt" || !nRaw || !saltRaw || !hashRaw) return false;

  try {
    const expected = Buffer.from(hashRaw, "base64url");
    const actual = crypto.scryptSync(password, Buffer.from(saltRaw, "base64url"), expected.length, {
      N: Number(nRaw),
      r: 8,
      p: 1,
    });
    if (actual.length !== expected.length) return false;
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Validasi masukan                                                    */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type AuthFieldError = "email" | "password" | "name" | "exists" | "invalid";

export function validateRegistration(input: {
  email: string;
  name: string;
  password: string;
}): AuthFieldError | null {
  if (!EMAIL_RE.test(input.email)) return "email";
  if (input.name.trim().length < 2) return "name";
  if (input.password.length < 8) return "password";
  return null;
}

/* ------------------------------------------------------------------ */
/* Sesi                                                               */
/* ------------------------------------------------------------------ */

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Hanya bisa dipanggil dari Server Action atau Route Handler (menulis cookie). */
export async function startSession(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString("base64url");
  createSession({
    tokenHash: hashToken(token),
    userId,
    expiresAt: Date.now() + SESSION_DAYS * 86_400_000,
  });

  const proto = (await headers()).get("x-forwarded-proto");
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(hashToken(token));
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return findSessionUser(hashToken(token));
}

/** Dipakai halaman yang wajib login. */
export async function requireUser(nextPath = "/akun"): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/masuk?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/* ------------------------------------------------------------------ */
/* Pembatasan percobaan masuk (in-memory, per proses)                  */
/* ------------------------------------------------------------------ */

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 6;

export function tooManyAttempts(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function noteFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}

export { findUserByEmail };
