import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock,
  Clapperboard,
  Layers,
  Play,
  Star,
  Tag,
} from "lucide-react";
import { Backdrop, Poster } from "@/components/poster";
import { AnimeCard } from "@/components/anime-card";
import { EpisodeListConnected } from "@/components/episode-list-connected";
import { WatchlistButton } from "@/components/watchlist-button";
import { getProvider } from "@/lib/provider";
import { STATUS_LABEL } from "@/lib/data/catalog";
import { formatDate, formatMinutes, padEpisode, timeAgo } from "@/lib/utils";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const provider = getProvider();
  const slugs = await provider.allSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const anime = await getProvider().getBySlug(slug);
  if (!anime) return { title: "Anime tidak ditemukan" };

  return {
    title: `${anime.title} Sub Indo`,
    description: anime.synopsis.slice(0, 160),
    openGraph: {
      title: `${anime.title} • Captnime`,
      description: anime.synopsis.slice(0, 160),
      type: "video.tv_show",
    },
  };
}

export default async function AnimeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const provider = getProvider();
  const anime = await provider.getBySlug(slug);

  if (!anime) notFound();

  const related = await provider.related(slug, 6);
  const firstEpisode = anime.episodes[0];
  const latestEpisode = anime.episodes.at(-1);
  const watchHref = latestEpisode
    ? `/watch/${anime.slug}/${latestEpisode.number}`
    : null;

  const info = [
    { icon: Clapperboard, label: "Studio", value: anime.studio },
    { icon: Layers, label: "Tipe", value: anime.type },
    { icon: CalendarDays, label: "Musim", value: `${anime.season ?? "-"} ${anime.year}` },
    {
      icon: Clock,
      label: "Durasi",
      value: formatMinutes(anime.durationMinutes * 60),
    },
    {
      icon: Tag,
      label: "Broadcast",
      value:
        anime.status === "upcoming"
          ? "Belum tayang"
          : anime.broadcastDay
            ? `Setiap ${anime.broadcastDay}, ${anime.broadcastTime ?? ""}`
            : "—",
    },
  ];

  return (
    <article>
      {/* ===== Header ===== */}
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 h-[420px] sm:h-[460px]">
          <Backdrop anime={anime} />
        </div>

        <div className="container-page pt-16 lg:pt-7">
          <nav className="mb-4 flex items-center gap-1.5 text-[11px] font-semibold text-text-2">
            <Link href="/" className="hover:text-gold">Beranda</Link>
            <span>/</span>
            <Link href="/browse" className="hover:text-gold">Katalog</Link>
            <span>/</span>
            <span className="truncate text-text-2">{anime.title}</span>
          </nav>

          <div className="grid gap-5 pb-6 sm:grid-cols-[200px_1fr] sm:gap-7 lg:grid-cols-[240px_1fr]">
            <Poster
              anime={anime}
              titleSize="lg"
              className="mx-auto w-[170px] shadow-2xl ring-1 ring-ink/20 sm:mx-0 sm:w-full"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    anime.status === "ongoing"
                      ? "rounded-full bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-bg"
                      : "rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-text"
                  }
                >
                  {STATUS_LABEL[anime.status]}
                </span>
                <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-text-2">
                  {anime.rating}
                </span>
                {anime.score > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-gold/12 px-2.5 py-1 text-[11px] font-bold text-gold">
                    <Star className="size-3 fill-current" />
                    {anime.score.toFixed(1)}
                  </span>
                )}
              </div>

              <h1 className="mt-2.5 text-balance text-2xl font-semibold leading-tight tracking-tight text-text sm:text-4xl">
                {anime.title}
              </h1>
              {anime.titleAlt && (
                <p className="mt-1 text-[13px] font-medium text-text-2">
                  {anime.titleAlt}
                </p>
              )}
              {anime.tagline && (
                <p className="mt-2 text-sm font-semibold italic text-text-2/90">
                  “{anime.tagline}”
                </p>
              )}

              <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-text-2 sm:text-sm">
                {anime.synopsis}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {anime.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/browse?genre=${encodeURIComponent(g)}`}
                    className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-text transition hover:border-line hover:text-gold"
                  >
                    {g}
                  </Link>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {watchHref ? (
                  <Link
                    href={watchHref}
                    className="group flex h-11 items-center gap-2 rounded-md bg-gold px-6 text-sm font-bold text-bg transition hover:bg-gold-2 active:scale-[0.98]"
                  >
                    <Play className="size-4 fill-current" />
                    Tonton Ep {latestEpisode?.number}
                  </Link>
                ) : (
                  <span className="flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-bold text-text-2">
                    <Clock className="size-4" /> Segera tayang
                  </span>
                )}
                {firstEpisode && latestEpisode && latestEpisode.number !== 1 && (
                  <Link
                    href={`/watch/${anime.slug}/${firstEpisode.number}`}
                    className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-5 text-sm font-bold text-text transition hover:bg-surface-2"
                  >
                    Mulai dari Ep 1
                  </Link>
                )}
                <WatchlistButton anime={anime} />
              </div>

              {latestEpisode && (
                <p className="mt-3 text-[11px] text-text-3">
                  Episode terbaru: Ep {padEpisode(latestEpisode.number)} ·{" "}
                  {timeAgo(latestEpisode.releasedAt)} · rilis{" "}
                  {formatDate(latestEpisode.releasedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Body ===== */}
      <div className="container-page grid gap-8 pb-4 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="daftar-episode">
          <h2
            id="daftar-episode"
            className="mb-3 flex items-center gap-2 text-lg font-extrabold tracking-tight text-text"
          >
            Daftar Episode
            <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-text-2">
              {anime.episodes.length}
            </span>
          </h2>
          <EpisodeListConnected anime={anime} />
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-surface p-4">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-2">
              Informasi
            </h2>
            <dl className="space-y-2.5">
              {info.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 size-3.5 shrink-0 text-text-3" />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-text-3">
                      {label}
                    </dt>
                    <dd className="text-[12.5px] font-semibold text-text">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {anime.tags && anime.tags.length > 0 && (
            <div className="rounded-xl border border-line bg-surface p-4">
              <h2 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-text-2">
                Penanda
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {anime.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-surface px-2 py-1 text-[10.5px] font-semibold text-text-2"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-cyan-glow/20 bg-cyan-glow/[0.06] p-4">
            <h2 className="text-[12px] font-bold text-cyan-glow">Subtitle Indonesia</h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-text-2">
              Track subtitle Indonesia tersedia di setiap episode dan bisa
              dinyalakan atau dimatikan langsung dari pemutar.
            </p>
          </div>
        </aside>
      </div>

      {/* ===== Rekomendasi ===== */}
      {related.length > 0 && (
        <section className="container-page pt-8">
          <h2 className="mb-3 text-lg font-extrabold tracking-tight text-text">
            Mirip dengan {anime.title}
          </h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {related.map((item) => (
              <AnimeCard key={item.slug} anime={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
