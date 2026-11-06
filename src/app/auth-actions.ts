"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  createUser,
  findUserByEmail,
  type PublicUser,
} from "@/lib/db/accounts";
import {
  clearAttempts,
  endSession,
  hashPassword,
  noteFailedAttempt,
  startSession,
  tooManyAttempts,
  validateRegistration,
  verifyPassword,
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
