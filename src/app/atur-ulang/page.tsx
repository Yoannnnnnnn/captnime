import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, ShieldAlert } from "lucide-react";
import { completeResetAction, requestResetAction } from "@/app/auth-actions";
import { normalizeEmailToken } from "@/lib/auth-user";
import { btnPrimary, inputClass, labelClass } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Buat Kata Sandi Baru",
  description: "Atur ulang kata sandi Captnime lewat tautan yang dikirim ke email Anda.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  invalid:
    "Tautan reset tidak berlaku lagi. Tautan hanya bisa dipakai sekali dan berlaku 60 menit — minta tautan baru.",
  pendek: "Kata sandi baru minimal 8 karakter.",
  beda: "Konfirmasi kata sandi tidak cocok.",
};

export default async function ResetPasswordPage({
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
  const message = error ? ERRORS[error] : null;

  return (
    <div className="container-page flex min-h-[80dvh] items-center justify-center py-12 pt-24 lg:pt-12">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
          Akun Captnime
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text">
          Buat kata sandi baru
        </h1>

        {token ? (
          <form action={completeResetAction} className="sticker mt-6 space-y-4 p-5">
            <p className="text-[13px] leading-relaxed text-text-2">
              Masukkan kata sandi baru untuk akun Anda. Setelah tersimpan, semua sesi
              di perangkat lain otomatis dikeluarkan.
            </p>

            <input type="hidden" name="token" value={token} />

            <label className="block space-y-1.5">
              <span className={labelClass}>Kata sandi baru</span>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
                placeholder="Minimal 8 karakter"
              />
            </label>

            <label className="block space-y-1.5">
              <span className={labelClass}>Ulangi kata sandi baru</span>
              <input
                type="password"
                name="confirm"
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </label>

            {message ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[12.5px] leading-relaxed text-coral"
              >
                <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {message}
              </p>
            ) : null}

            <button type="submit" className={`${btnPrimary} w-full`}>
              <KeyRound className="size-4" aria-hidden />
              Simpan kata sandi baru
            </button>
          </form>
        ) : (
          <form action={requestResetAction} className="sticker mt-6 space-y-4 p-5">
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[12.5px] leading-relaxed text-coral"
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {message ?? ERRORS.invalid}
            </p>

            <p className="text-[13px] leading-relaxed text-text-2">
              Masukkan email akun Anda untuk menerima tautan baru.
            </p>

            <label className="block space-y-1.5">
              <span className={labelClass}>Email</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className={inputClass}
                placeholder="nama@email.com"
              />
            </label>

            <button type="submit" className={`${btnPrimary} w-full`}>
              Kirim tautan reset
            </button>
          </form>
        )}

        <p className="mt-4 px-1 text-center text-[11.5px] leading-relaxed text-text-3">
          Punya kode pemulihan?{" "}
          <Link
            href="/lupa-sandi"
            className="text-text-2 underline-offset-4 hover:text-gold hover:underline"
          >
            Pakai kode pemulihan
          </Link>
        </p>

        <p className="mt-2 text-center text-[12.5px] text-text-3">
          <Link
            href="/masuk"
            className="text-text-2 underline-offset-4 hover:text-gold hover:underline"
          >
            Kembali ke halaman masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
