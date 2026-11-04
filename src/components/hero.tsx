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

const ROTATE_MS = 8000;

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
      className="relative isolate overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Sorotan utama"
    >
      <div className="relative h-[500px] w-full border-b-2 border-ink sm:h-[540px] lg:h-[590px]">
        <Backdrop anime={anime} />

        <div className="container-page relative flex h-full flex-col justify-end pb-8 sm:pb-12">
          <div key={anime.slug} className="animate-fade-up max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="tag-sticker bg-mustard">★ Sorotan</span>
              <span className="tag-sticker bg-sky text-ink">{STATUS_LABEL[anime.status]}</span>
              {anime.score > 0 && (
                <span className="tag-sticker">
                  <Star className="size-3 fill-ink" />
                  {anime.score.toFixed(1)}
                </span>
              )}
            </div>

            <h1 className="text-balance text-4xl font-black leading-[0.95] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              {anime.title}
            </h1>

            {anime.tagline && (
              <p className="mt-2 max-w-lg text-sm font-bold text-ink-soft sm:text-base">
                {anime.tagline}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="tag-sticker bg-card">{anime.type}</span>
              <span className="tag-sticker bg-card">{anime.year}</span>
              <span className="tag-sticker bg-card">{anime.rating}</span>
              <span className="tag-sticker bg-card">{anime.genres[0]}</span>
              <span className="tag-sticker bg-card">
                {anime.episodes.length > 0
                  ? `Ep ${padEpisode(latest?.number ?? 1)} tersedia`
                  : "Segera tayang"}
              </span>
            </div>

            <p className="mt-3 max-w-xl text-[13px] font-semibold leading-relaxed text-ink-soft sm:text-sm">
              {truncate(anime.synopsis, 175)}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Link
                href={watchHref}
                className="btn-sticker h-11 bg-coral px-6 text-sm text-ink"
              >
                <Play className="size-4 fill-current" />
                {latest ? `Tonton Ep ${latest.number}` : "Lihat Detail"}
              </Link>
              <Link
                href={`/anime/${anime.slug}`}
                className="btn-sticker h-11 bg-card px-5 text-sm text-ink"
              >
                <Info className="size-4" />
                Detail
              </Link>

              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Aktifkan suara" : "Matikan suara"}
                className="btn-sticker size-11 shrink-0 bg-card text-ink"
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
            </div>
          </div>

          {/* Kontrol carousel */}
          <div className="mt-7 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {items.map((item, i) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Tampilkan ${item.title}`}
                  aria-current={i === index}
                  className={cn(
                    "h-2.5 rounded-full border-2 border-ink transition-all",
                    i === index ? "w-10 bg-coral" : "w-2.5 bg-card hover:bg-paper-3",
                  )}
                />
              ))}
            </div>
            <div className="ml-auto hidden gap-1.5 sm:flex">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Sebelumnya"
                className="btn-sticker size-9 bg-card text-ink"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Berikutnya"
                className="btn-sticker size-9 bg-card text-ink"
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
