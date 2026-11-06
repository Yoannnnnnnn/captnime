import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { resetPasswordAction } from "@/app/auth-actions";
import { btnPrimary, inputClass, labelClass } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi",
  description: "Atur ulang kata sandi Captnime memakai kode pemulihan.",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  kosong: "Email dan kode pemulihan wajib diisi.",
  salah: "Email atau kode pemulihan tidak cocok.",
  batas: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.",
  pendek: "Kata sandi baru minimal 8 karakter.",
  beda: "Konfirmasi kata sandi tidak cocok.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const error = one("error");
  const email = one("email") ?? "";

  return (
    <div className="container-page flex min-h-[80dvh] items-center justify-center py-12 pt-24 lg:pt-12">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
          Akun Captnime
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text">
          Atur ulang kata sandi
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-text-2">
          Masukkan kode pemulihan yang Anda simpan dari halaman akun. Kode berlaku
          sekali pakai.
        </p>

        <form action={resetPasswordAction} className="sticker mt-6 space-y-4 p-5">
          <label className="block space-y-1.5">
            <span className={labelClass}>Email</span>
            <input
              type="email"
              name="email"
              required
              defaultValue={email}
              autoComplete="email"
              className={inputClass}
              placeholder="nama@email.com"
            />
          </label>

          <label className="block space-y-1.5">
            <span className={labelClass}>Kode pemulihan</span>
            <input
              name="code"
              required
              autoComplete="one-time-code"
              spellCheck={false}
              className={`${inputClass} font-mono tracking-wider`}
              placeholder="CPT-XXXX-XXXX-XXXX"
            />
          </label>

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

          {error && ERRORS[error] ? (
            <p
              role="alert"
              className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[12.5px] text-coral"
            >
              {ERRORS[error]}
            </p>
          ) : null}

          <button type="submit" className={`${btnPrimary} w-full`}>
            <KeyRound className="size-4" aria-hidden />
            Simpan kata sandi baru
          </button>

          <p className="text-center text-[12.5px] text-text-3">
            <Link
              href="/masuk"
              className="text-text-2 underline-offset-4 hover:text-gold hover:underline"
            >
              Kembali ke halaman masuk
            </Link>
          </p>
        </form>

        <p className="mt-4 px-1 text-center text-[11.5px] leading-relaxed text-text-3">
          Tidak punya kode pemulihan? Belum ada pemulihan lewat email di versi ini —
          hubungi operator situs, atau buat akun baru.
        </p>
      </div>
    </div>
  );
}
