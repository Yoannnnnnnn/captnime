"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Info, Play, Star, Volume2, VolumeX, ChevronLeft, ChevronRight } from "lucide-react";
import { Backdrop } from "@/components/poster";
import { STATUS_LABEL } from "@/lib/data/catalog";
import type { Anime } from "@/lib/types";
import { cn, padEpisode, truncate } from "@/lib/utils";

interface HeroProps {
  items: Anime[];
}

const ROTATE_MS = 9000;

export function Hero({ items }: HeroProps) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = items.length;
  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, count, index]);

  if (count === 0) return null;
  const anime = items[index];
  const latest = anime.episodes.at(-1);
  const watchHref = latest
    ? `/watch/${anime.slug}/${latest.number}`
    : `/anime/${anime.slug}`;

  return (
    <section
      className="relative isolate"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Sorotan utama"
    >
      <div className="relative h-[74vh] max-h-[680px] min-h-[480px] w-full">
        <Backdrop anime={anime} />

        <div className="container-page relative flex h-full flex-col justify-end pb-10 sm:pb-12">
          <div key={anime.slug} className="animate-fade-up max-w-xl">
            <div className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              <span>Sedang populer</span>
              <span className="text-text-3">#{index + 1}</span>
            </div>

            <h1 className="text-balance text-3xl font-bold leading-[1.08] tracking-tight text-text sm:text-5xl">
              {anime.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] font-medium text-text-2">
              {anime.score > 0 && (
                <span className="flex items-center gap-1 text-gold">
                  <Star className="size-3.5 fill-current" />
                  {anime.score.toFixed(1)}
                </span>
              )}
              <span className="text-text-3">•</span>
              <span>{anime.year}</span>
              <span className="text-text-3">•</span>
              <span>{anime.type}</span>
              <span className="text-text-3">•</span>
              <span className="rounded border border-line px-1.5 py-0.5 text-[10.5px]">
                {anime.rating}
              </span>
              <span className="text-text-3">•</span>
              <span>{anime.genres.slice(0, 2).join(", ")}</span>
              <span className="text-text-3">•</span>
              <span>
                {anime.episodes.length > 0
                  ? `Ep ${padEpisode(latest?.number ?? 1)}`
                  : "Segera"}
              </span>
            </div>

            <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-text-2">
              {truncate(anime.synopsis, 165)}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href={watchHref}
                className="btn-sticker h-11 bg-gold px-6 text-sm font-semibold text-bg hover:bg-gold-2"
              >
                <Play className="size-4 fill-current" />
                {latest ? "Tonton Sekarang" : "Lihat Detail"}
              </Link>
              <Link
                href={`/anime/${anime.slug}`}
                className="btn-sticker h-11 border border-line-2 bg-surface/70 px-5 text-sm font-semibold text-text hover:bg-surface-2"
              >
                <Info className="size-4" />
                Detail
              </Link>

              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Aktifkan suara" : "Matikan suara"}
                className="grid size-11 place-items-center rounded-full border border-line-2 text-text-2 transition hover:border-text-3 hover:text-text"
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
            </div>
          </div>

          {/* Indikator: garis tipis bergaya aplikasi streaming */}
          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {items.map((item, i) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Tampilkan ${item.title}`}
                  aria-current={i === index}
                  className={cn(
                    "h-[3px] rounded-full transition-all duration-300",
                    i === index ? "w-9 bg-gold" : "w-4 bg-text-3/40 hover:bg-text-3/70",
                  )}
                />
              ))}
            </div>
            <span className="ml-1 text-[11px] font-medium text-text-3">
              {STATUS_LABEL[anime.status]}
            </span>
            <div className="ml-auto hidden gap-1.5 sm:flex">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Sebelumnya"
                className="grid size-8 place-items-center rounded-full border border-line text-text-2 transition hover:border-line-2 hover:text-text"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Berikutnya"
                className="grid size-8 place-items-center rounded-full border border-line text-text-2 transition hover:border-line-2 hover:text-text"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
