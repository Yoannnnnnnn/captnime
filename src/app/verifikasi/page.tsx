import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck, ShieldAlert } from "lucide-react";
import { resendVerificationAction, verifyEmailAction } from "@/app/auth-actions";
import { getCurrentUser, normalizeEmailToken } from "@/lib/auth-user";
import { btnGhost, btnPrimary } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Verifikasi Email",
  description: "Konfirmasi alamat email akun Captnime Anda.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  kosong: "Tautan tidak memuat token verifikasi.",
  kedaluwarsa:
    "Tautan ini sudah dipakai atau kedaluwarsa. Minta tautan baru dari halaman akun.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const token = normalizeEmailToken(one("token") ?? "");
  const error = one("error");
  const user = await getCurrentUser();
  const problem = token ? null : (error && ERRORS[error]) || ERRORS.kosong;

  return (
    <div className="container-page flex min-h-[80dvh] items-center justify-center py-12 pt-24 lg:pt-12">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
          Akun Captnime
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text">
          Verifikasi email
        </h1>

        {problem ? (
          <div className="sticker mt-6 space-y-4 p-5">
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[12.5px] leading-relaxed text-coral"
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {problem}
            </p>

            {user && !user.emailVerified ? (
              <form action={resendVerificationAction}>
                <button type="submit" className={`${btnPrimary} w-full`}>
                  Kirim tautan verifikasi baru
                </button>
              </form>
            ) : user?.emailVerified ? (
              <p className="text-[12.5px] leading-relaxed text-text-2">
                Email <span className="text-text">{user.email}</span> sudah terverifikasi.
              </p>
            ) : (
              <p className="text-[12.5px] leading-relaxed text-text-2">
                Masuk dulu, lalu minta tautan baru dari halaman akun.
              </p>
            )}

            <p className="text-center text-[12.5px] text-text-3">
              <Link
                href={user ? "/akun" : "/masuk"}
                className="text-text-2 underline-offset-4 hover:text-gold hover:underline"
              >
                {user ? "Ke halaman akun" : "Ke halaman masuk"}
              </Link>
            </p>
          </div>
        ) : (
          <form action={verifyEmailAction} className="sticker mt-6 space-y-4 p-5">
            <p className="text-[13px] leading-relaxed text-text-2">
              Tekan tombol di bawah untuk mengonfirmasi bahwa alamat email ini benar
              milik Anda. Setelah terverifikasi, daftar tonton dan riwayat tontonan
              ikut tersinkron antar perangkat.
            </p>

            <input type="hidden" name="token" value={token} />

            <button type="submit" className={`${btnPrimary} w-full`}>
              <MailCheck className="size-4" aria-hidden />
              Verifikasi email saya
            </button>

            <p className="text-[11.5px] leading-relaxed text-text-3">
              Tautan hanya bisa dipakai sekali. Kalau sudah kedaluwarsa, minta tautan
              baru dari halaman akun.
            </p>
          </form>
        )}

        {!problem ? null : (
          <p className="mt-4 px-1 text-center text-[11.5px] leading-relaxed text-text-3">
            Tidak merasa membuat akun? Abaikan saja — tidak ada yang berubah.
          </p>
        )}
      </div>
    </div>
  );
}
