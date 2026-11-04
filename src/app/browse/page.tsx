import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { AnimeCard } from "@/components/anime-card";
import { FilterBar } from "@/components/filter-bar";
import { getProvider } from "@/lib/provider";
import type { AnimeStatus, AnimeType, SortKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Jelajah Katalog",
  description:
    "Telusuri seluruh katalog anime Captnime: filter berdasarkan genre, status tayang, tipe, dan urutkan sesuai selera.",
};

type SearchParams = Record<string, string | string[] | undefined>;

const PER_PAGE = 12;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const one = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const q = one("q") ?? "";
  const genre = one("genre") ?? "";
  const status = (one("status") ?? "semua") as AnimeStatus | "semua";
  const type = (one("type") ?? "semua") as AnimeType | "semua";
  const sort = (one("sort") ?? "populer") as SortKey;
  const page = Math.max(1, Number(one("page") ?? 1) || 1);

  const provider = getProvider();
  const [result, genres] = await Promise.all([
    provider.list({ q, genre, status, type, sort, page, perPage: PER_PAGE }),
    provider.genres(),
  ]);

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (genre) params.set("genre", genre);
    if (status !== "semua") params.set("status", status);
    if (type !== "semua") params.set("type", type);
    if (sort !== "populer") params.set("sort", sort);
    if (nextPage > 1) params.set("page", String(nextPage));
    const s = params.toString();
    return s ? `/browse?${s}` : "/browse";
  };

  const heading = q
    ? `Hasil untuk “${q}”`
    : genre
      ? `Genre ${genre}`
      : status === "ongoing"
        ? "Sedang Tayang"
        : status === "completed"
          ? "Sudah Tamat"
          : status === "upcoming"
            ? "Segera Tayang"
            : "Semua Anime";

  return (
    <div className="container-page pt-20 sm:pt-24">
      <header className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-400">
          Katalog
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
          {heading}
        </h1>
        <p className="mt-1 text-[13px] text-mist-400">
          {result.total} judul ditemukan
          {result.totalPages > 1 && ` • halaman ${result.page} dari ${result.totalPages}`}
        </p>
      </header>

      <FilterBar genres={genres} />

      <div className="mt-6">
        {result.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-ink-850/60 px-6 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-white/5 text-mist-400">
              <SearchX className="size-6" />
            </span>
            <h2 className="mt-3 text-base font-bold text-white">
              Tidak ada anime yang cocok
            </h2>
            <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-mist-400">
              Coba kata kunci lain, atau longgarkan filter genre dan status yang
              sedang aktif.
            </p>
            <Link
              href="/browse"
              className="mt-4 rounded-full bg-brand-500 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-brand-600"
            >
              Reset filter
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {result.items.map((anime) => (
              <AnimeCard key={anime.slug} anime={anime} />
            ))}
          </div>
        )}
      </div>

      {result.totalPages > 1 && (
        <nav
          aria-label="Navigasi halaman"
          className="mt-10 flex items-center justify-center gap-1.5"
        >
          <PageLink
            href={buildHref(result.page - 1)}
            disabled={result.page <= 1}
            label="Sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </PageLink>

          {Array.from({ length: result.totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === result.totalPages ||
                Math.abs(p - result.page) <= 1,
            )
            .map((p, idx, arr) => {
              const gap = idx > 0 && p - arr[idx - 1] > 1;
              return (
                <span key={p} className="flex items-center gap-1.5">
                  {gap && <span className="px-1 text-mist-500">…</span>}
                  <Link
                    href={buildHref(p)}
                    aria-current={p === result.page ? "page" : undefined}
                    className={cn(
                      "grid size-9 place-items-center rounded-lg text-[13px] font-bold transition",
                      p === result.page
                        ? "bg-brand-500 text-white"
                        : "border border-white/10 bg-white/5 text-mist-200 hover:bg-white/10",
                    )}
                  >
                    {p}
                  </Link>
                </span>
              );
            })}

          <PageLink
            href={buildHref(result.page + 1)}
            disabled={result.page >= result.totalPages}
            label="Berikutnya"
          >
            <ChevronRight className="size-4" />
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled
        aria-label={label}
        className="grid size-9 place-items-center rounded-lg border border-white/8 text-mist-500 opacity-40"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-mist-200 transition hover:bg-white/10"
    >
      {children}
    </Link>
  );
}
