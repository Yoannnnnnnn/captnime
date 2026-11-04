import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Info, ListVideo, Star } from "lucide-react";
import { VideoPlayer } from "@/components/player/video-player";
import { EpisodeListConnected } from "@/components/episode-list-connected";
import { Poster } from "@/components/poster";
import { WatchlistButton } from "@/components/watchlist-button";
import { getProvider } from "@/lib/provider";
import { formatDate, formatMinutes, padEpisode } from "@/lib/utils";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string; episode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, episode } = await params;
  const data = await getProvider().getEpisode(slug, Number(episode));
  if (!data) return { title: "Episode tidak ditemukan" };
  return {
    title: `${data.anime.title} Episode ${data.episode.number} Sub Indo`,
    description: `Nonton ${data.anime.title} episode ${data.episode.number} — ${data.episode.title} dengan subtitle Indonesia di Captnime.`,
  };
}

export default async function WatchPage({ params }: PageProps) {
  const { slug, episode: episodeParam } = await params;
  const episodeNumber = Number(episodeParam);

  if (!Number.isFinite(episodeNumber)) notFound();

  const provider = getProvider();
  const data = await provider.getEpisode(slug, episodeNumber);
  if (!data) notFound();

  const { anime, episode } = data;
  const index = anime.episodes.findIndex((e) => e.number === episode.number);
  const prev = index > 0 ? anime.episodes[index - 1] : undefined;
  const next = index < anime.episodes.length - 1 ? anime.episodes[index + 1] : undefined;

  return (
    <div className="container-page pt-16 sm:pt-20">
      <nav className="flex flex-wrap items-center gap-1.5 py-3 text-[11px] font-semibold text-mist-400">
        <Link href="/" className="hover:text-brand-400">Beranda</Link>
        <span>/</span>
        <Link href={`/anime/${anime.slug}`} className="hover:text-brand-400">
          {anime.title}
        </Link>
        <span>/</span>
        <span className="text-mist-300">Episode {episode.number}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0">
          <VideoPlayer
            anime={anime}
            episode={episode}
            nextEpisode={next}
            nextHref={next ? `/watch/${anime.slug}/${next.number}` : undefined}
          />

          {/* Judul episode */}
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-brand-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-brand-400">
                Episode {episode.number}
              </span>
              <span className="text-[11px] font-semibold text-mist-400">
                {formatDate(episode.releasedAt)} • {formatMinutes(episode.duration)}
              </span>
            </div>
            <h1 className="mt-1.5 text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
              {anime.title} — {episode.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[12px] font-semibold text-mist-400">
              <Link
                href={`/anime/${anime.slug}`}
                className="text-mist-300 underline decoration-white/20 underline-offset-2 hover:text-brand-400"
              >
                Lihat semua {anime.episodes.length} episode
              </Link>
              {anime.score > 0 && (
                <span className="flex items-center gap-1 text-gold">
                  <Star className="size-3 fill-current" /> {anime.score.toFixed(1)}
                </span>
              )}
              <span>{anime.studio}</span>
            </div>
          </div>

          {/* Navigasi episode */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {prev ? (
              <Link
                href={`/watch/${anime.slug}/${prev.number}`}
                className="group flex items-center gap-2 rounded-xl border border-white/8 bg-ink-850/70 p-3 transition hover:border-white/20 hover:bg-ink-800"
              >
                <ChevronLeft className="size-4 shrink-0 text-mist-400 transition group-hover:-translate-x-0.5" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-mist-500">
                    Sebelumnya
                  </span>
                  <span className="block truncate text-[12.5px] font-semibold text-mist-100">
                    Ep {prev.number} — {prev.title}
                  </span>
                </span>
              </Link>
            ) : (
              <span className="rounded-xl border border-white/5 bg-ink-900/40 p-3 text-[11px] text-mist-500">
                Ini episode pertama
              </span>
            )}

            {next ? (
              <Link
                href={`/watch/${anime.slug}/${next.number}`}
                className="group flex items-center justify-end gap-2 rounded-xl border border-brand-500/30 bg-brand-500/8 p-3 text-right transition hover:border-brand-500/60 hover:bg-brand-500/14"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-400/80">
                    Berikutnya
                  </span>
                  <span className="block truncate text-[12.5px] font-semibold text-mist-100">
                    Ep {next.number} — {next.title}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-brand-400 transition group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <span className="rounded-xl border border-white/5 bg-ink-900/40 p-3 text-right text-[11px] text-mist-500">
                Episode terakhir yang tersedia
              </span>
            )}
          </div>

          {/* Info anime ringkas (mobile) */}
          <div className="mt-5 rounded-xl border border-white/8 bg-ink-850/70 p-4 lg:hidden">
            <div className="flex gap-3">
              <Poster
                anime={anime}
                hideTitle
                className="w-[70px] shrink-0"
                rounded="rounded-lg"
              />
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold text-white">{anime.title}</h2>
                <p className="mt-0.5 line-clamp-3 text-[11.5px] leading-relaxed text-mist-400">
                  {anime.synopsis}
                </p>
                <div className="mt-2 flex gap-2">
                  <Link
                    href={`/anime/${anime.slug}`}
                    className="flex items-center gap-1 rounded-full border border-white/12 px-3 py-1.5 text-[11px] font-bold text-mist-200"
                  >
                    <Info className="size-3" /> Detail
                  </Link>
                  <WatchlistButton anime={anime} variant="ghost" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar episode */}
        <aside className="min-w-0">
          <div className="sticky top-20">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-white">
                <ListVideo className="size-4 text-brand-400" />
                Daftar Episode
              </h2>
              <span className="text-[11px] font-semibold text-mist-500">
                {padEpisode(episode.number)}/{padEpisode(anime.episodes.length)}
              </span>
            </div>
            <div className="max-h-[70vh] overflow-y-auto pr-1 scroll-thin">
              <EpisodeListConnected anime={anime} variant="sidebar" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
