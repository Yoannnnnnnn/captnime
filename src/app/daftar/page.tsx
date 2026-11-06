import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { registerAction } from "@/app/auth-actions";
import { getCurrentUser } from "@/lib/auth-user";
import { btnPrimary, inputClass, labelClass } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun Captnime untuk menyinkronkan daftar tonton dan riwayat antar perangkat.",
};

const ERRORS: Record<string, string> = {
  email: "Alamat email tidak valid.",
  name: "Nama minimal 2 karakter.",
  password: "Kata sandi minimal 8 karakter.",
  exists: "Email ini sudah terdaftar. Coba masuk.",
  invalid: "Data tidak valid. Periksa kembali.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const next = one("next") ?? "/akun";
  const error = one("error");

  if (await getCurrentUser()) redirect(next);

  return (
    <div className="container-page flex min-h-[80dvh] items-center justify-center py-12 pt-24 lg:pt-12">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
          Akun Captnime
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text">
          Daftar gratis
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-text-2">
          Cukup nama, email, dan kata sandi. Tidak ada verifikasi email atau kartu kredit.
        </p>

        <form action={registerAction} className="sticker mt-6 space-y-4 p-5">
          <input type="hidden" name="next" value={next} />

          <label className="block space-y-1.5">
            <span className={labelClass}>Nama panggilan</span>
            <input
              name="name"
              required
              minLength={2}
              autoComplete="nickname"
              className={inputClass}
              placeholder="Ardan"
            />
          </label>

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

          <label className="block space-y-1.5">
            <span className={labelClass}>Kata sandi</span>
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
            <span className={labelClass}>Ulangi kata sandi</span>
            <input
              type="password"
              name="confirm"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
              placeholder="••••••••"
            />
          </label>

          {error && ERRORS[error] ? (
            <p role="alert" className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[12.5px] text-coral">
              {ERRORS[error]}
            </p>
          ) : null}

          <button type="submit" className={`${btnPrimary} w-full`}>
            <UserPlus className="size-4" aria-hidden />
            Buat akun
          </button>

          <p className="text-center text-[12.5px] text-text-3">
            Sudah punya akun?{" "}
            <Link
              href={`/masuk?next=${encodeURIComponent(next)}`}
              className="text-text-2 underline-offset-4 hover:text-gold hover:underline"
            >
              Masuk
            </Link>
          </p>
        </form>

        <p className="mt-4 px-1 text-center text-[11.5px] leading-relaxed text-text-3">
          Kata sandi disimpan sebagai hash scrypt. Kami tidak mengirim email dan tidak
          meminta data pembayaran di tahap ini.
        </p>
      </div>
    </div>
  );
}
