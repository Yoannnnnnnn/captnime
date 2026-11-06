import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAllGenres } from "@/lib/db/repository";
import { AnimeForm } from "@/components/admin/anime-form";

export const metadata: Metadata = {
  title: "Judul Baru",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminNewAnimePage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-[12.5px] text-text-3 hover:text-gold"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Daftar judul
        </Link>
        <span className="font-mono text-[11px] text-text-3">judul baru</span>
      </div>

      <p className="rounded-lg border border-line bg-surface px-4 py-3 text-[12.5px] leading-relaxed text-text-2">
        Simpan metadata judul lebih dulu. Setelah tersimpan, Anda diarahkan ke halaman
        pengelolaan untuk menambah episode, server streaming, dan subtitle.
      </p>

      <AnimeForm genres={getAllGenres()} published />
    </div>
  );
}
