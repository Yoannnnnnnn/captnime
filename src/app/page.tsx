import Link from "next/link";
import { ArrowUpRight, Clock, Star, TrendingUp } from "lucide-react";
import { AnimeCard } from "@/components/anime-card";
import { Poster } from "@/components/poster";
import { ContinueWatching } from "@/components/continue-watching";
import { getProvider } from "@/lib/provider";
import { DAYS } from "@/lib/data/catalog";
import { padEpisode, truncate } from "@/lib/utils";

export const revalidate = 300;

export default async function HomePage() {
  const provider = getProvider();

  const [spotlight, trending, ongoing, latest, topRated, genres, schedule] =
    await Promise.all([
      provider.spotlight(3),
      provider.trending(10),
      provider.ongoing(12),
      provider.list({ sort: "terbaru", perPage: 12 }),
      provider.list({ sort: "rating", status: "completed", perPage: 6 }),
      provider.genres(),
      provider.schedule(),
    ]);

  const feature = spotlight[0] ?? trending[0];
  const secondary = spotlight.slice(1, 3);
  const featureLatest = feature?.episodes.at(-1);

  const todayName = DAYS[(new Date().getDay() + 6) % 7];
  const todaySchedule = schedule[todayName] ?? [];

  const baru = latest.items.filter((a) => a.episodes.length > 0).slice(0, 6);
  const mosaic = ongoing.slice(0, 10);

  return (
    <div className="pb-10">
      {/* ================= Masthead ================= */}
      <header className="border-b border-line px-4 pb-4 pt-16 sm:px-6 lg:px-8 lg:pt-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
              Katalog mingguan
            </p>
            <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-text sm:text-3xl">
              Yang layak ditonton pekan ini
            </h1>
          </div>
          <p className="text-[11.5px] leading-relaxed text-text-3">
            {ongoing.length} judul tayang berjalan
            <span className="mx-1.5 text-line-2">/</span>
            {genres.length} genre
            <span className="mx-1.5 text-line-2">/</span>
            sub Indo
          </p>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8">
        {/* ================= Bento atas ================= */}
        <section className="grid gap-3 pt-5 lg:grid-cols-12">
          {/* Feature besar */}
          {feature && (
            <article className="group relative overflow-hidden rounded-xl border border-line lg:col-span-8">
              <Link href={`/anime/${feature.slug}`} className="block">
                <div className="relative aspect-[16/10] w-full sm:aspect-[16/8]">
                  <Poster anime={feature} hideTitle className="absolute inset-0 h-full w-full rounded-none" />
                  <div className="scrim-b absolute inset-0" />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                      Pilihan editor
                    </p>
                    <h2 className="max-w-lg text-balance text-2xl font-semibold leading-tight tracking-tight text-text sm:text-3xl">
                      {feature.title}
                    </h2>
                    <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-text-2">
                      {truncate(feature.synopsis, 130)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="btn-sticker h-9 bg-gold px-4 text-[12.5px] font-semibold text-bg hover:bg-gold-2">
                        {featureLatest ? `Tonton Ep ${featureLatest.number}` : "Lihat detail"}
                      </span>
                      <span className="text-[11.5px] text-text-3">
                        {feature.studio} · {feature.episodes.length} episode
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          )}

          {/* Kolom kanan: lanjut tonton + rilis hari ini */}
          <div className="flex flex-col gap-3 lg:col-span-4">
            <section className="rounded-xl border border-line bg-surface p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-2">
                  Lanjut tonton
                </h2>
                <Link href="/my-list" className="text-[11px] text-text-3 hover:text-gold">
                  Riwayat
                </Link>
              </div>
              <ContinueWatching variant="compact" />
            </section>

            <section className="flex-1 rounded-xl border border-line bg-surface p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-2">
                  Rilis hari ini
                </h2>
                <span className="text-[11px] text-text-3">{todayName}</span>
              </div>
              {todaySchedule.length === 0 ? (
                <p className="py-4 text-[12px] leading-relaxed text-text-3">
                  Tidak ada rilis hari ini. Lihat{" "}
                  <Link href="/schedule" className="text-gold hover:underline">
                    jadwal pekan ini
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {todaySchedule.slice(0, 3).map((a) => (
                    <li key={a.slug}>
                      <Link
                        href={`/anime/${a.slug}`}
                        className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
                      >
                        <Poster
                          anime={a}
                          hideTitle
                          rounded="rounded"
                          className="h-11 w-8 shrink-0"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] text-text">
                            {a.title}
                          </span>
                          <span className="flex items-center gap-1 text-[10.5px] text-text-3">
                            <Clock className="size-2.5" />
                            {a.broadcastTime ?? "—"}
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-text-3">
                          Ep {padEpisode(a.episodes.length)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </section>

        {/* ================= Dua pilihan + panel angka ================= */}
        <section className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {secondary.map((a, i) => (
            <article
              key={a.slug}
              className="group overflow-hidden rounded-xl border border-line bg-surface lg:col-span-3"
            >
              <Link href={`/anime/${a.slug}`} className="flex h-full">
                <Poster anime={a} hideTitle rounded="rounded-none" className="w-[42%] shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-3">
                    0{i + 2} · Sorotan
                  </span>
                  <span className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-text group-hover:text-gold">
                    {a.title}
                  </span>
                  <span className="text-[11px] text-text-3">
                    {a.genres.slice(0, 2).join(" · ")}
                  </span>
                </div>
              </Link>
            </article>
          ))}

          {/* Panel "paling banyak ditonton" — daftar berangka, bukan rail */}
          <section className="rounded-xl border border-line bg-surface p-3.5 sm:col-span-2 lg:col-span-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-text-2">
                <TrendingUp className="size-3.5 text-gold" />
                Paling ditonton
              </h2>
              <Link
                href="/browse?sort=populer"
                className="flex items-center gap-0.5 text-[11px] text-text-3 hover:text-gold"
              >
                Semua <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <ol className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
              {trending.slice(0, 6).map((a, i) => (
                <li key={a.slug} className="border-b border-line last:border-0">
                  <Link href={`/anime/${a.slug}`} className="flex items-center gap-2.5 py-1.5">
                    <span className="w-4 shrink-0 text-[13px] font-semibold tabular-nums text-text-3">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-text">
                      {a.title}
                    </span>
                    <span className="shrink-0 text-[10.5px] text-text-3">{a.type}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </section>

        {/* ================= Mosaik sedang tayang ================= */}
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between border-b border-line pb-2">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-text-2">
              Sedang tayang
            </h2>
            <Link href="/browse?status=ongoing" className="text-[11px] text-text-3 hover:text-gold">
              Lihat semua
            </Link>
          </div>

          {/* grid asimetris: satu tile besar + sisanya kecil */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {mosaic.map((a, i) => (
              <div
                key={a.slug}
                className={
                  i === 0
                    ? "col-span-2 row-span-2 sm:col-span-2 lg:col-span-2"
                    : undefined
                }
              >
                <AnimeCard
                  anime={a}
                  size={i === 0 ? "lg" : "md"}
                  caption={a.broadcastDay ? `${a.broadcastDay} · ${a.broadcastTime ?? ""}` : undefined}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ================= Episode terbaru + rating ================= */}
        <section className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="mb-3 flex items-end justify-between border-b border-line pb-2">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-text-2">
                Episode baru
              </h2>
              <Link href="/browse?sort=terbaru" className="text-[11px] text-text-3 hover:text-gold">
                Arsip
              </Link>
            </div>
            <ul className="divide-y divide-line">
              {baru.slice(0, 5).map((a) => {
                const ep = a.episodes.at(-1);
                return (
                  <li key={a.slug}>
                    <Link
                      href={ep ? `/watch/${a.slug}/${ep.number}` : `/anime/${a.slug}`}
                      className="group flex items-center gap-3 py-2.5"
                    >
                      <span className="w-9 shrink-0 text-[15px] font-semibold tabular-nums text-text-3 transition-colors group-hover:text-gold">
                        {padEpisode(ep?.number ?? 1)}
                      </span>
                      <Poster anime={a} hideTitle rounded="rounded" className="h-12 w-9 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-text group-hover:text-gold">
                          {a.title}
                        </span>
                        <span className="block truncate text-[11px] text-text-3">
                          {ep?.title}
                        </span>
                      </span>
                      <span className="hidden shrink-0 text-[10.5px] text-text-3 sm:block">
                        {a.type}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="lg:col-span-5">
            <div className="mb-3 border-b border-line pb-2">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-text-2">
                Rating tertinggi
              </h2>
            </div>
            <ol className="space-y-2">
              {topRated.items.slice(0, 4).map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/anime/${a.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-transparent px-1 py-1.5 transition-colors hover:border-line hover:bg-surface"
                  >
                    <Poster anime={a} hideTitle rounded="rounded" className="h-14 w-10 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] text-text">{a.title}</span>
                      <span className="block truncate text-[10.5px] text-text-3">
                        {a.studio}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-0.5 text-[11.5px] text-gold">
                      <Star className="size-3 fill-current" />
                      {a.score.toFixed(1)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ================= Genre ================= */}
        <section className="mt-8 border-t border-line pt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-3">
              Telusuri
            </span>
            {genres.slice(0, 12).map((g) => (
              <Link
                key={g.slug}
                href={`/browse?genre=${encodeURIComponent(g.name)}`}
                className="text-[12.5px] text-text-2 transition-colors hover:text-gold"
              >
                {g.name}
                <span className="ml-1 text-[10px] text-text-3">{g.total}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
