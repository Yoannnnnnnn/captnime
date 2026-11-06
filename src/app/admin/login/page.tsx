import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { loginAction } from "@/app/admin/actions";
import {
  ADMIN_COOKIE,
  isDefaultPassword,
  verifySessionValue,
} from "@/lib/auth";
import { Notice, btnPrimary, inputClass, labelClass } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Masuk Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const failed = (Array.isArray(sp.error) ? sp.error[0] : sp.error) === "1";

  const store = await cookies();
  if (verifySessionValue(store.get(ADMIN_COOKIE)?.value)) redirect("/admin");

  return (
    <div className="container-page flex min-h-dvh items-center justify-center py-16 pt-24">
      <div className="w-full max-w-sm">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
          Panel pengelola
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-text">
          Masuk ke Captnime
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-text-2">
          Kelola judul, episode, server streaming, dan subtitle.
        </p>

        <form action={loginAction} className="sticker mt-6 space-y-4 p-5">
          <label className="block space-y-1.5">
            <span className={labelClass}>Kata sandi admin</span>
            <input
              type="password"
              name="password"
              required
              autoFocus
              autoComplete="current-password"
              className={inputClass}
              placeholder="••••••••"
            />
          </label>

          {failed ? <Notice tone="error">Kata sandi salah. Coba lagi.</Notice> : null}

          <button type="submit" className={`${btnPrimary} w-full`}>
            <LockKeyhole className="size-4" aria-hidden />
            Masuk
          </button>

          {isDefaultPassword() ? (
            <p className="rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-[11.5px] leading-relaxed text-gold">
              Kata sandi masih bawaan: <code className="font-mono">admin</code>. Set
              variabel <code className="font-mono">CAPTNIME_ADMIN_PASSWORD</code> sebelum
              dipakai di server publik.
            </p>
          ) : null}
        </form>

        <p className="mt-4 text-center text-[12.5px] text-text-3">
          <Link href="/" className="text-text-2 underline-offset-4 hover:text-gold hover:underline">
            Kembali ke situs
          </Link>
        </p>
      </div>
    </div>
  );
}
