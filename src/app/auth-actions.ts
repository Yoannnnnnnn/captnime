"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  consumeEmailToken,
  createUser,
  deleteOtherSessions,
  deleteUser,
  deleteUserSessions,
  findUserByEmail,
  markEmailVerified,
  updateUserEmail,
  setPasswordHash,
  setRecoveryHash,
  type PublicUser,
} from "@/lib/db/accounts";
import { sendResetEmail, sendVerificationEmail } from "@/lib/auth-email";
import { isEmailConfigured } from "@/lib/email";
import {
  SESSION_COOKIE,
  clearAttempts,
  endSession,
  generateRecoveryCode,
  getCurrentUser,
  hashEmailToken,
  hashPassword,
  hashRecoveryCode,
  hashToken,
  isValidEmail,
  normalizeEmailToken,
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
  // Kirim tautan verifikasi. Kegagalan email tidak boleh menggagalkan
  // pendaftaran — pengguna tetap masuk dan bisa meminta kirim ulang.
  const mail = await sendVerificationEmail(user);
  const notice = mail.ok ? "dikirim" : mail.skipped ? "belum-aktif" : "gagal";

  redirect(next === "/akun" ? `/akun?verifikasi=${notice}` : next);
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
/* Verifikasi email                                                   */
/* ------------------------------------------------------------------ */

/** Kirim ulang tautan verifikasi. Dibatasi 6 kali / 15 menit per pengguna. */
export async function resendVerificationAction(_formData: FormData) {
  const user = await requireUser("/akun");
  if (user.emailVerified) redirect("/akun?verifikasi=sudah");

  const key = `verifikasi-kirim:${user.id}`;
  if (tooManyAttempts(key)) redirect("/akun?verifikasi=batas");
  noteFailedAttempt(key);

  const result = await sendVerificationEmail(user);
  if (result.ok) redirect("/akun?verifikasi=dikirim");
  redirect(result.skipped ? "/akun?verifikasi=belum-aktif" : "/akun?verifikasi=gagal");
}

/**
 * Konfirmasi token dari tautan email.
 *
 * Sengaja lewat POST, bukan GET: pemindai tautan di klien email sering
 * membuka URL lebih dulu, dan verifikasi tidak boleh terjadi karena mesin.
 */
export async function verifyEmailAction(formData: FormData) {
  const token = normalizeEmailToken(String(formData.get("token") ?? ""));
  if (!token) redirect("/verifikasi?error=kosong");

  const row = consumeEmailToken(hashEmailToken(token), "verify");
  if (!row) redirect("/verifikasi?error=kedaluwarsa");

  markEmailVerified(row.user_id);

  const current = await getCurrentUser();
  if (current?.id === row.user_id) redirect("/akun?verifikasi=berhasil");

  redirect("/masuk?verifikasi=1");
}

/**
 * Ganti alamat email akun.
 *
 * Alamat baru belum terbukti milik pengguna, jadi verifikasi dikosongkan dan
 * tautan verifikasi dikirim ulang ke alamat baru. Sesi tetap aktif supaya
 * pengguna tidak terkunci di luar akunnya sendiri — cukup kehilangan
 * sinkronisasi sampai email baru diverifikasi.
 */
export async function changeEmailAction(formData: FormData) {
  const user = await requireUser("/akun");
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  const row = findUserByEmail(user.email);
  if (!row || !verifyPassword(password, row.password_hash)) {
    redirect("/akun?error=email-sandi");
  }
  if (!isValidEmail(email)) redirect("/akun?error=email-format");
  if (email === user.email) redirect("/akun?error=email-sama");

  const existing = findUserByEmail(email);
  if (existing && existing.id !== user.id) redirect("/akun?error=email-dipakai");

  updateUserEmail(user.id, email);

  const mail = await sendVerificationEmail({ id: user.id, name: user.name, email });
  const notice = mail.ok ? "dikirim" : mail.skipped ? "belum-aktif" : "gagal";
  redirect(`/akun?email=${notice}`);
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
/* Lupa kata sandi                                                     */
/* ------------------------------------------------------------------ */

/**
 * Minta tautan reset lewat email.
 *
 * Respons selalu sama, terdaftar atau tidak — supaya halaman ini tidak bisa
 * dipakai menebak email mana yang punya akun. Yang berbeda hanya isi kotak
 * masuk orang yang memang punya akun.
 */
export async function requestResetAction(formData: FormData) {
  const email = str(formData, "email").toLowerCase();
  if (!email) redirect("/lupa-sandi?error=kosong");

  // Kalau email belum dikonfigurasi, katakan terus terang alih-alih
  // menjanjikan tautan yang tidak akan pernah datang.
  if (!isEmailConfigured()) redirect("/lupa-sandi?error=email-off");

  const key = `reset-kirim:${await clientKey(email)}`;
  if (tooManyAttempts(key)) redirect("/lupa-sandi?error=batas");
  noteFailedAttempt(key);

  const row = findUserByEmail(email);
  if (row) await sendResetEmail(row);

  redirect("/lupa-sandi?terkirim=1");
}

/** Selesaikan reset dengan token dari email. */
export async function completeResetAction(formData: FormData) {
  const token = normalizeEmailToken(String(formData.get("token") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const back = (error: string) =>
    `/atur-ulang?error=${error}${token ? `&token=${encodeURIComponent(token)}` : ""}`;

  if (!token) redirect("/atur-ulang?error=invalid");
  if (password.length < 8) redirect(back("pendek"));
  if (password !== confirm) redirect(back("beda"));

  const row = consumeEmailToken(hashEmailToken(token), "reset");
  if (!row) redirect("/atur-ulang?error=invalid");

  setPasswordHash(row.user_id, hashPassword(password));
  // Setelah reset: kode pemulihan lama tidak berlaku lagi dan semua sesi
  // lama dikeluarkan, termasuk sesi penyerang yang mungkin masih hidup.
  setRecoveryHash(row.user_id, null);
  deleteUserSessions(row.user_id);

  redirect("/masuk?reset=1");
}

/* ------------------------------------------------------------------ */
/* Reset dengan kode pemulihan (tanpa email)                          */
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
