"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createUser,
  deleteOtherSessions,
  deleteUser,
  deleteUserSessions,
  findUserByEmail,
  setPasswordHash,
  setRecoveryHash,
  type PublicUser,
} from "@/lib/db/accounts";
import {
  SESSION_COOKIE,
  clearAttempts,
  endSession,
  generateRecoveryCode,
  getCurrentUser,
  hashPassword,
  hashRecoveryCode,
  hashToken,
  noteFailedAttempt,
  requireUser,
  startSession,
  tooManyAttempts,
  validateRegistration,
  verifyPassword,
  verifyRecoveryCode,
} from "@/lib/auth-user";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

/** Hanya izinkan tujuan internal, cegah open redirect. */
function safeNext(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/akun";
  return value;
}

async function clientKey(email: string): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "lokal";
  return `${ip}:${email.toLowerCase()}`;
}

export async function registerAction(formData: FormData) {
  const email = str(formData, "email").toLowerCase();
  const name = str(formData, "name");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const next = safeNext(str(formData, "next") || "/akun");

  const query = (code: string) =>
    `/daftar?error=${code}${next !== "/akun" ? `&next=${encodeURIComponent(next)}` : ""}`;

  const invalid = validateRegistration({ email, name, password });
  if (invalid) redirect(query(invalid));
  if (password !== confirm) redirect(query("password"));
  if (findUserByEmail(email)) redirect(query("exists"));

  let user: PublicUser;
  try {
    user = createUser({ email, name, passwordHash: hashPassword(password) });
  } catch {
    redirect(query("exists"));
  }

  await startSession(user.id);
  redirect(next);
}

export async function loginAction(formData: FormData) {
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(str(formData, "next") || "/akun");
  const key = await clientKey(email);

  const back = (code: string) =>
    `/masuk?error=${code}${next !== "/akun" ? `&next=${encodeURIComponent(next)}` : ""}`;

  if (!email || !password) redirect(back("kosong"));
  if (tooManyAttempts(key)) redirect(back("batas"));

  const row = findUserByEmail(email);
  if (!row || !verifyPassword(password, row.password_hash)) {
    noteFailedAttempt(key);
    redirect(back("salah"));
  }

  clearAttempts(key);
  await startSession(row.id);
  redirect(next);
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}


/* ------------------------------------------------------------------ */
/* Keamanan akun                                                      */
/* ------------------------------------------------------------------ */

/** Ganti kata sandi: wajib tahu sandi lama, sesi lain tidak dikeluarkan. */
export async function changePasswordAction(formData: FormData) {
  const user = await requireUser("/akun");
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const row = findUserByEmail(user.email);
  if (!row || !verifyPassword(current, row.password_hash)) {
    redirect("/akun?error=sandi-lama");
  }
  if (next.length < 8) redirect("/akun?error=sandi-pendek");
  if (next !== confirm) redirect("/akun?error=sandi-beda");

  setPasswordHash(user.id, hashPassword(next));
  redirect("/akun?sandi=1");
}

/** Cookie sementara agar kode baru bisa ditampilkan sekali di /akun. */
const RECOVERY_COOKIE = "captnime_recovery_code";

/**
 * Buat kode pemulihan baru; kode lama otomatis tidak berlaku.
 *
 * Kode disimpan sebagai hash. Plaintext-nya hanya dikirim balik lewat cookie
 * httpOnly berumur 2 menit agar bisa tampil sekali di /akun — tidak pernah
 * masuk URL, log, atau database.
 */
export async function createRecoveryCodeAction(_formData: FormData) {
  const user = await requireUser("/akun");

  const code = generateRecoveryCode();
  setRecoveryHash(user.id, hashRecoveryCode(code));

  const store = await cookies();
  const proto = (await headers()).get("x-forwarded-proto");
  store.set(RECOVERY_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    path: "/akun",
    maxAge: 120,
  });

  redirect("/akun?pemulihan=1");
}

/** Sembunyikan kode setelah pengguna menyimpannya. */
export async function dismissRecoveryCodeAction(_formData: FormData) {
  const store = await cookies();
  // Path harus sama dengan saat cookie dibuat ("/akun"), kalau tidak
  // penghapusan tidak berpengaruh dan kode terus tampil.
  store.set(RECOVERY_COOKIE, "", { path: "/akun", maxAge: 0 });
  redirect("/akun");
}

/** Keluarkan semua perangkat lain, sesi di peramban ini tetap aktif. */
export async function logoutOthersAction() {
  const user = await requireUser("/akun");
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteOtherSessions(user.id, hashToken(token));
  redirect("/akun?keluar=1");
}

/** Hapus akun permanen: perlu sandi + mengetik HAPUS. */
export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser("/akun");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase();

  const row = findUserByEmail(user.email);
  if (!row || !verifyPassword(password, row.password_hash)) {
    redirect("/akun?error=hapus-sandi");
  }
  if (confirmation !== "HAPUS") redirect("/akun?error=hapus-teks");

  deleteUser(user.id);
  await endSession();
  redirect("/?akun=dihapus");
}

/* ------------------------------------------------------------------ */
/* Lupa kata sandi (kode pemulihan, tanpa email)                      */
/* ------------------------------------------------------------------ */

export async function resetPasswordAction(formData: FormData) {
  const email = str(formData, "email").toLowerCase();
  const code = String(formData.get("code") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const key = await clientKey(email);

  const back = (error: string) =>
    `/lupa-sandi?error=${error}${email ? `&email=${encodeURIComponent(email)}` : ""}`;

  if (!email || !code) redirect(back("kosong"));
  if (tooManyAttempts(key)) redirect(back("batas"));
  if (password.length < 8) redirect(back("pendek"));
  if (password !== confirm) redirect(back("beda"));

  const row = findUserByEmail(email);
  if (!row || !verifyRecoveryCode(code, row.recovery_hash)) {
    noteFailedAttempt(key);
    redirect(back("salah"));
  }

  clearAttempts(key);
  setPasswordHash(row.id, hashPassword(password));
  setRecoveryHash(row.id, null); // kode sekali pakai
  deleteUserSessions(row.id); // semua sesi lama tidak berlaku
  redirect("/masuk?reset=1");
}
