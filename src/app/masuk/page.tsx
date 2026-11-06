import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LogIn } from "lucide-react";
import { loginAction } from "@/app/auth-actions";
import { getCurrentUser } from "@/lib/auth-user";
import { btnPrimary, inputClass, labelClass } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun Captnime untuk menyinkronkan daftar tonton dan riwayat.",
};

const ERRORS: Record<string, string> = {
  salah: "Email atau kata sandi tidak cocok.",
  kosong: "Email dan kata sandi wajib diisi.",
  batas: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.",
};

export default async function LoginPage({
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
  const justReset = one("reset") === "1";

  if (await getCurrentUser()) redirect(next);

  return (
    <div className="container-page flex min-h-[80dvh] items-center justify-center py-12 pt-24 lg:pt-12">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
          Akun Captnime
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text">Masuk</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-text-2">
          Daftar tonton dan riwayat menonton tersimpan di akun, bukan di satu perangkat.
        </p>

        <form action={loginAction} className="sticker mt-6 space-y-4 p-5">
          <input type="hidden" name="next" value={next} />

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
            <span className="flex items-baseline justify-between">
              <span className={labelClass}>Kata sandi</span>
              <Link
                href="/lupa-sandi"
                className="text-[11px] text-text-3 underline-offset-4 hover:text-gold hover:underline"
              >
                Lupa kata sandi?
              </Link>
            </span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className={inputClass}
              placeholder="••••••••"
            />
          </label>

          {justReset ? (
            <p
              role="status"
              className="rounded-md border border-mint/40 bg-mint/10 px-3 py-2 text-[12.5px] text-mint"
            >
              Kata sandi berhasil diperbarui. Silakan masuk dengan sandi baru.
            </p>
          ) : null}

          {error && ERRORS[error] ? (
            <p role="alert" className="rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-[12.5px] text-coral">
              {ERRORS[error]}
            </p>
          ) : null}

          <button type="submit" className={`${btnPrimary} w-full`}>
            <LogIn className="size-4" aria-hidden />
            Masuk
          </button>

          <p className="text-center text-[12.5px] text-text-3">
            Belum punya akun?{" "}
            <Link
              href={`/daftar?next=${encodeURIComponent(next)}`}
              className="text-text-2 underline-offset-4 hover:text-gold hover:underline"
            >
              Daftar gratis
            </Link>
          </p>
        </form>

        <p className="mt-4 text-center text-[12px] text-text-3">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-gold">
            Lanjut tanpa akun
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </p>
      </div>
    </div>
  );
}
