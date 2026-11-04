import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { AnimeCard } from "@/components/anime-card";
import { Poster } from "@/components/poster";
import { FilterBar } from "@/components/filter-bar";
import { getProvider } from "@/lib/provider";
import type { AnimeStatus, AnimeType, SortKey } from "@/lib/types";
import { cn, padEpisode } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Jelajah Katalog",
  description:
    "Telusuri seluruh katalog anime Captnime: filter berdasarkan genre, status tayang, tipe, dan urutkan sesuai selera.",
};

type SearchParams = Record<string, string | string[] | undefined>;

const PER_PAGE = 18;

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
        ? "Sedang tayang"
        : status === "completed"
          ? "Sudah tamat"
          : status === "upcoming"
            ? "Segera tayang"
            : "Semua anime";

  // Di halaman pertama tanpa filter, judul teratas ditampilkan sebagai tile besar.
  const isLanding = page === 1 && !q && !genre && status === "semua" && type === "semua";
  const spotlight = isLanding ? result.items[0] : undefined;
  const rest = spotlight ? result.items.slice(1) : result.items;

  return (
    <div className="px-4 pb-10 sm:px-6 lg:px-8">
      <header className="border-b border-line pb-4 pt-16 lg:pt-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
          02 / Jelajah
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-text sm:text-3xl">
            {heading}
          </h1>
          <p className="text-[11.5px] text-text-3">
            {result.total} judul
            {result.totalPages > 1 && ` · halaman ${result.page}/${result.totalPages}`}
          </p>
        </div>
      </header>

      <div className="mt-5 grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Panel filter menempel di kiri */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <FilterBar genres={genres} />
        </aside>

        <div className="min-w-0">
          {result.items.length === 0 ? (
            <div className="flex flex-col items-start rounded-lg border border-line bg-surface px-6 py-14">
              <span className="grid size-11 place-items-center rounded-full bg-surface-2 text-text-3">
                <SearchX className="size-5" />
              </span>
              <h2 className="mt-3 text-base font-semibold text-text">
                Tidak ada anime yang cocok
              </h2>
              <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-text-2">
                Coba kata kunci lain, atau longgarkan filter genre dan status yang
                sedang aktif.
              </p>
              <Link
                href="/browse"
                className="btn-sticker mt-4 h-9 bg-gold px-4 text-[12.5px] font-semibold text-bg hover:bg-gold-2"
              >
                Reset filter
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {spotlight && (
                <article className="col-span-2 row-span-2 overflow-hidden rounded-lg border border-line sm:col-span-2">
                  <Link href={`/anime/${spotlight.slug}`} className="group block h-full">
                    <div className="relative h-full min-h-[280px] w-full">
                      <Poster
                        anime={spotlight}
                        hideTitle
                        className="absolute inset-0 h-full w-full rounded-none"
                      />
                      <div className="scrim-b absolute inset-0" />
                      <div className="absolute inset-x-0 bottom-0 p-3.5">
                        <p className="mb-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-gold">
                          Paling relevan
                        </p>
                        <h2 className="text-lg font-semibold leading-tight text-text group-hover:text-gold">
                          {spotlight.title}
                        </h2>
                        <p className="mt-1 text-[11px] text-text-2">
                          {spotlight.studio} · Ep {padEpisode(spotlight.totalEpisodes)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </article>
              )}

              {rest.map((anime) => (
                <AnimeCard key={anime.slug} anime={anime} />
              ))}
            </div>
          )}

          {result.totalPages > 1 && (
            <nav
              aria-label="Navigasi halaman"
              className="mt-10 flex items-center justify-between border-t border-line pt-4"
            >
              <PageLink
                href={buildHref(result.page - 1)}
                disabled={result.page <= 1}
                label="Sebelumnya"
              >
                <ChevronLeft className="size-4" />
                <span className="text-[12px]">Sebelumnya</span>
              </PageLink>

              <div className="flex items-center gap-1">
                {Array.from({ length: result.totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) => p === 1 || p === result.totalPages || Math.abs(p - result.page) <= 1,
                  )
                  .map((p, idx, arr) => {
                    const gap = idx > 0 && p - arr[idx - 1] > 1;
                    return (
                      <span key={p} className="flex items-center gap-1">
                        {gap && <span className="px-1 text-text-3">…</span>}
                        <Link
                          href={buildHref(p)}
                          aria-current={p === result.page ? "page" : undefined}
                          className={cn(
                            "grid size-8 place-items-center rounded text-[12px] tabular-nums transition-colors",
                            p === result.page
                              ? "bg-gold font-semibold text-bg"
                              : "text-text-2 hover:bg-surface-2 hover:text-text",
                          )}
                        >
                          {p}
                        </Link>
                      </span>
                    );
                  })}
              </div>

              <PageLink
                href={buildHref(result.page + 1)}
                disabled={result.page >= result.totalPages}
                label="Berikutnya"
                align="right"
              >
                <span className="text-[12px]">Berikutnya</span>
                <ChevronRight className="size-4" />
              </PageLink>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  align = "left",
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  const base = cn(
    "flex items-center gap-1 transition-colors",
    align === "right" ? "justify-end" : "justify-start",
  );

  if (disabled) {
    return (
      <span aria-disabled aria-label={label} className={cn(base, "text-text-3 opacity-40")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={cn(base, "text-text-2 hover:text-gold")}>
      {children}
    </Link>
  );
}
