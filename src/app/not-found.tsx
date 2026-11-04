import Link from "next/link";
import { Compass, House, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center pt-16 lg:pt-7 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-gold/12 text-gold">
        <SearchX className="size-7" />
      </span>
      <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
        Error 404
      </p>
      <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-text-2">
        Judul atau episode yang kamu cari mungkin sudah dipindahkan, atau tautannya
        salah ketik.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/"
          className="flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-bold text-bg transition hover:bg-gold-2"
        >
          <House className="size-4" /> Ke beranda
        </Link>
        <Link
          href="/browse"
          className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-5 text-sm font-bold text-text transition hover:bg-surface-2"
        >
          <Compass className="size-4" /> Jelajahi katalog
        </Link>
      </div>
    </div>
  );
}
