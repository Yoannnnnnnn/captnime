import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, MailCheck, ShieldAlert } from "lucide-react";
import { requestResetAction, resetPasswordAction } from "@/app/auth-actions";
import { btnGhost, btnPrimary, inputClass, labelClass } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi",
  description: "Minta tautan reset kata sandi Captnime lewat email, atau pakai kode pemulihan.",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  kosong: "Email wajib diisi.",
  salah: "Email atau kode pemulihan tidak cocok.",
  batas: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.",
  pendek: "Kata sandi baru minimal 8 karakter.",
  beda: "Konfirmasi kata sandi tidak cocok.",
  "email-off":
    "Pengiriman email belum diaktifkan di server ini. Pakai kode pemulihan di bawah, atau hubungi operator.",
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
  const sent = one("terkirim") === "1";

  return (
    <div className="container-page flex min-h-[80dvh] items-center justify-center py-12 pt-24 lg:pt-12">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
          Akun Captnime
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text">
          Lupa kata sandi
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-text-2">
          Masukkan email akun Anda — kami kirim tautan untuk membuat kata sandi baru.
        </p>

        <form action={requestResetAction} className="sticker mt-6 space-y-4 p-5">
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

          {sent ? (
            <p
              role="status"
              className="rounded-md border border-mint/40 bg-mint/10 px-3 py-2 text-[12.5px] leading-relaxed text-mint"
            >
              Kalau email itu terdaftar, tautan reset sudah dikirim. Tautan berlaku 60
              menit dan hanya bisa dipakai sekali. Periksa folder spam bila tidak
              terlihat.
            </p>
          ) : null}

          {error && ERRORS[error] ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[12.5px] leading-relaxed text-coral"
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              {ERRORS[error]}
            </p>
          ) : null}

          <button type="submit" className={`${btnPrimary} w-full`}>
            <MailCheck className="size-4" aria-hidden />
            Kirim tautan reset
          </button>
        </form>

        <details className="sticker mt-4 p-5">
          <summary className="cursor-pointer text-[12.5px] font-semibold text-text-2 [&::marker]:text-gold">
            Punya kode pemulihan? Pakai di sini
          </summary>
          <p className="mt-2 text-[11.5px] leading-relaxed text-text-3">
            Kode pemulihan dibuat dari halaman akun dan tidak bergantung pada email —
            berguna bila Anda tidak bisa membuka kotak masuk.
          </p>

          <form action={resetPasswordAction} className="mt-3 space-y-3">
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

            <button type="submit" className={btnGhost}>
              <KeyRound className="size-3.5" aria-hidden />
              Simpan dengan kode pemulihan
            </button>
          </form>
        </details>

        <p className="mt-4 px-1 text-center text-[11.5px] leading-relaxed text-text-3">
          Tidak punya akses ke email maupun kode pemulihan? Hubungi operator situs —
          belum ada jalur pemulihan lain di versi ini.
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
