import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import { isDefaultPassword, requireAdmin } from "@/lib/auth";
import { dbLocation } from "@/lib/db/client";
import { Badge, btnGhost } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Panel Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="container-page pb-16 pt-16 lg:pt-7">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
            Captnime CMS
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text">
            Panel pengelola katalog
          </h1>
          <p className="mt-1 text-[12px] text-text-3">
            Basis data: <span className="font-mono">{dbLocation()}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin" className={btnGhost}>
            Daftar judul
          </Link>
          <Link href="/" target="_blank" className={btnGhost}>
            <ExternalLink className="size-3.5" aria-hidden />
            Lihat situs
          </Link>
          <form action={logoutAction}>
            <button type="submit" className={btnGhost}>
              <LogOut className="size-3.5" aria-hidden />
              Keluar
            </button>
          </form>
        </div>
      </header>

      {isDefaultPassword() ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3">
          <Badge tone="gold">Perhatian</Badge>
          <p className="text-[12.5px] text-gold">
            Kata sandi admin masih bawaan (<code className="font-mono">admin</code>). Set{" "}
            <code className="font-mono">CAPTNIME_ADMIN_PASSWORD</code> di environment
            sebelum dipasang di server publik.
          </p>
        </div>
      ) : null}

      {children}
    </div>
  );
}
