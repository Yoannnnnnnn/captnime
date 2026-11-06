import {
  createEmailToken,
  type EmailTokenPurpose,
  type PublicUser,
} from "@/lib/db/accounts";
import {
  RESET_TTL_MS,
  VERIFY_TTL_MS,
  generateEmailToken,
  hashEmailToken,
} from "@/lib/auth-user";
import {
  absoluteUrl,
  resetEmail,
  sendEmail,
  verificationEmail,
  type EmailResult,
} from "@/lib/email";

/**
 * Penerbitan token sekali pakai + pengiriman emailnya.
 *
 * Dipisah dari `auth-actions.ts` supaya aturan "token lama dibatalkan saat
 * tautan baru dibuat" dan isi email hanya ada di satu tempat.
 */

async function issue(input: {
  user: Pick<PublicUser, "id" | "name" | "email">;
  purpose: EmailTokenPurpose;
  ttlMs: number;
  path: string;
}): Promise<EmailResult> {
  const token = generateEmailToken();
  createEmailToken({
    tokenHash: hashEmailToken(token),
    userId: input.user.id,
    purpose: input.purpose,
    email: input.user.email,
    expiresAt: Date.now() + input.ttlMs,
  });

  const url = await absoluteUrl(`${input.path}?token=${token}`);

  if (input.purpose === "verify") {
    const mail = verificationEmail({
      name: input.user.name,
      url,
      hours: Math.round(input.ttlMs / 3_600_000),
    });
    return sendEmail({ to: input.user.email, toName: input.user.name, ...mail });
  }

  const mail = resetEmail({
    name: input.user.name,
    url,
    minutes: Math.round(input.ttlMs / 60_000),
  });
  return sendEmail({ to: input.user.email, toName: input.user.name, ...mail });
}

/** Tautan verifikasi email — berlaku 24 jam. */
export function sendVerificationEmail(
  user: Pick<PublicUser, "id" | "name" | "email">,
): Promise<EmailResult> {
  return issue({ user, purpose: "verify", ttlMs: VERIFY_TTL_MS, path: "/verifikasi" });
}

/** Tautan reset kata sandi — berlaku 60 menit. */
export function sendResetEmail(
  user: Pick<PublicUser, "id" | "name" | "email">,
): Promise<EmailResult> {
  return issue({ user, purpose: "reset", ttlMs: RESET_TTL_MS, path: "/atur-ulang" });
}
