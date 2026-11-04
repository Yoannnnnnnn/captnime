import Link from "next/link";
import { ArrowRight, Clock, Flame, Sparkles, Star, TrendingUp } from "lucide-react";
import { Hero } from "@/components/hero";
import { AnimeCard } from "@/components/anime-card";
import { Poster } from "@/components/poster";
import { SectionRail } from "@/components/section-rail";
import { ContinueWatching } from "@/components/continue-watching";
import { getProvider } from "@/lib/provider";
import { GENRE_ICONS } from "@/lib/data/catalog";
import { padEpisode, truncate } from "@/lib/utils";

export const revalidate = 300;

export default async function HomePage() {
  const provider = getProvider();

  const [spotlight, trending, ongoing, latest, topRated, genres] = await Promise.all([
    provider.spotlight(4),
    provider.trending(10),
    provider.ongoing(12),
    provider.list({ sort: "terbaru", perPage: 12 }),
    provider.list({ sort: "rating", status: "completed", perPage: 12 }),
    provider.genres(),
  ]);

  const baru = latest.items.filter((a) => a.episodes.length > 0);

  return (
    <>
      <Hero items={spotlight} />

      <div className="container-page space-y-10 pb-4 pt-6 sm:space-y-12 sm:pt-8">
        <ContinueWatching />

        {/* Genre chips */}
        <section aria-label="Jelajahi genre">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {genres.slice(0, 12).map((g) => (
              <Link
                key={g.slug}
                href={`/browse?genre=${encodeURIComponent(g.name)}`}
                className="card-hover flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[12px] font-semibold text-mist-200 hover:text-white"
              >
                <span aria-hidden className="text-[13px]">
                  {GENRE_ICONS[g.name] ?? "✧"}
                </span>
                {g.name}
                <span className="text-[10px] text-mist-500">{g.total}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Trending dengan peringkat */}
        <SectionRail
          title="Trending Minggu Ini"
          subtitle="Paling banyak ditonton 7 hari terakhir"
          accent="🔥"
          href="/browse?sort=populer"
        >
          {trending.map((anime, i) => (
            <div
              key={anime.slug}
              className="relative w-[136px] shrink-0 snap-start sm:w-[150px]"
            >
              <span
                aria-hidden
                className="absolute -left-1 -top-3 z-10 select-none text-5xl font-black leading-none text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,0.35)]"
              >
                {i + 1}
              </span>
              <AnimeCard anime={anime} className="mt-3" />
            </div>
          ))}
        </SectionRail>

        {/* Highlight banner */}
        {baru[0] && (
          <section className="relative overflow-hidden rounded-2xl border border-white/8">
            <div className="grid gap-4 p-4 sm:grid-cols-[200px_1fr] sm:gap-6 sm:p-6">
              <Poster anime={baru[0]} className="aspect-[2/3] w-full max-w-[200px]" />
              <div className="flex flex-col justify-center">
                <span className="mb-2 flex w-fit items-center gap-1.5 rounded-full bg-cyan-glow/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-glow">
                  <Sparkles className="size-3" /> Rilis Terbaru
                </span>
                <h2 className="text-balance text-xl font-black tracking-tight text-white sm:text-2xl">
                  {baru[0].title}
                </h2>
                <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-mist-300">
                  {truncate(baru[0].synopsis, 210)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-mist-400">
                  <span className="flex items-center gap-1 text-gold">
                    <Star className="size-3 fill-current" /> {baru[0].score.toFixed(1)}
                  </span>
                  <span>{baru[0].studio}</span>
                  <span>•</span>
                  <span>Episode {padEpisode(baru[0].episodes.length)} baru rilis</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/watch/${baru[0].slug}/${baru[0].episodes.at(-1)?.number ?? 1}`}
                    className="flex h-10 items-center gap-2 rounded-full bg-brand-500 px-5 text-[13px] font-bold text-white transition hover:bg-brand-600"
                  >
                    Tonton Episode Terbaru
                  </Link>
                  <Link
                    href={`/anime/${baru[0].slug}`}
                    className="flex h-10 items-center gap-1.5 rounded-full border border-white/15 px-4 text-[13px] font-bold text-mist-200 transition hover:bg-white/8"
                  >
                    Detail <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <SectionRail
          title="Sedang Tayang"
          subtitle="Jadwal rilis baru setiap minggu"
          accent="📺"
          href="/browse?status=ongoing"
        >
          {ongoing.map((anime) => (
            <div key={anime.slug} className="w-[136px] shrink-0 snap-start sm:w-[150px]">
              <AnimeCard
                anime={anime}
                caption={
                  anime.broadcastDay
                    ? `${anime.broadcastDay} • ${anime.broadcastTime ?? ""}`
                    : undefined
                }
              />
            </div>
          ))}
        </SectionRail>

        <SectionRail
          title="Baru Ditambahkan"
          subtitle="Episode terbaru dari katalog"
          accent="✨"
          href="/browse?sort=terbaru"
        >
          {baru.map((anime) => (
            <div key={anime.slug} className="w-[136px] shrink-0 snap-start sm:w-[150px]">
              <AnimeCard
                anime={anime}
                caption={`Ep ${anime.episodes.length} • ${anime.type}`}
              />
            </div>
          ))}
        </SectionRail>

        <SectionRail
          title="Rating Tertinggi"
          subtitle="Pilihan dengan skor komunitas terbaik"
          accent="⭐"
          href="/browse?sort=rating"
        >
          {topRated.items.map((anime) => (
            <div key={anime.slug} className="w-[136px] shrink-0 snap-start sm:w-[150px]">
              <AnimeCard anime={anime} />
            </div>
          ))}
        </SectionRail>

        {/* Value props */}
        <section className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: TrendingUp,
              title: "Pemutar cepat",
              body: "Dukungan HLS & MP4, resume otomatis, dan pindah server tanpa kehilangan posisi.",
            },
            {
              icon: Clock,
              title: "Lanjut tonton",
              body: "Riwayat dan progres tersimpan di perangkat, langsung lanjut saat kembali.",
            },
            {
              icon: Flame,
              title: "Sub Indo",
              body: "Setiap episode memiliki track subtitle Indonesia yang bisa dinyalakan/dimatikan.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-white/8 bg-ink-850/60 p-4 transition hover:border-white/16"
            >
              <span className="mb-2 grid size-9 place-items-center rounded-lg bg-brand-500/15 text-brand-400">
                <Icon className="size-4" />
              </span>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-mist-400">{body}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
