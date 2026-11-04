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
      <div className="relative h-[520px] w-full sm:h-[560px] lg:h-[620px]">
        <Backdrop anime={anime} />

        <div className="container-page relative flex h-full flex-col justify-end pb-10 sm:pb-14 lg:pb-16">
          <div key={anime.slug} className="animate-fade-up max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                Sorotan
              </span>
              <span className="rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-mist-100 backdrop-blur">
                {STATUS_LABEL[anime.status]}
              </span>
              {anime.tags?.slice(0, 2).map((t) => (
                <span key={t} className="text-[11px] font-semibold text-mist-300">
                  #{t.replace(/\s+/g, "")}
                </span>
              ))}
            </div>

            <h1 className="text-balance text-3xl font-black leading-[1.05] tracking-tight text-white text-glow sm:text-5xl lg:text-6xl">
              {anime.title}
            </h1>

            {anime.tagline && (
              <p className="mt-2 text-sm font-medium text-brand-200/90 sm:text-base">
                {anime.tagline}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] font-semibold text-mist-300">
              {anime.score > 0 && (
                <span className="flex items-center gap-1 text-gold">
                  <Star className="size-3.5 fill-current" />
                  {anime.score.toFixed(1)}
                </span>
              )}
              <span className="size-1 rounded-full bg-mist-500" />
              <span>{anime.type}</span>
              <span className="size-1 rounded-full bg-mist-500" />
              <span>{anime.year}</span>
              <span className="size-1 rounded-full bg-mist-500" />
              <span>{anime.rating}</span>
              <span className="size-1 rounded-full bg-mist-500" />
              <span>{anime.genres.slice(0, 3).join(" • ")}</span>
              <span className="size-1 rounded-full bg-mist-500" />
              <span>
                {anime.episodes.length > 0
                  ? `Ep ${padEpisode(latest?.number ?? 1)} tersedia`
                  : "Segera tayang"}
              </span>
            </div>

            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-mist-300 sm:text-sm">
              {truncate(anime.synopsis, 190)}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link
                href={watchHref}
                className="group flex h-11 items-center gap-2 rounded-full bg-brand-500 px-6 text-sm font-bold text-white shadow-[0_14px_34px_-14px_rgba(255,61,104,1)] transition hover:bg-brand-600 active:scale-[0.98]"
              >
                <Play className="size-4 fill-current" />
                {latest ? `Tonton Ep ${latest.number}` : "Lihat Detail"}
              </Link>
              <Link
                href={`/anime/${anime.slug}`}
                className="flex h-11 items-center gap-2 rounded-full border border-white/15 bg-white/8 px-5 text-sm font-bold text-mist-100 backdrop-blur transition hover:border-white/30 hover:bg-white/12"
              >
                <Info className="size-4" />
                Detail
              </Link>

              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Aktifkan suara" : "Matikan suara"}
                className="grid size-11 place-items-center rounded-full border border-white/12 bg-black/30 text-mist-200 backdrop-blur transition hover:text-white"
              >
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
            </div>
          </div>

          {/* Kontrol carousel */}
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
                    "h-1 rounded-full transition-all duration-500",
                    i === index
                      ? "w-8 bg-brand-500"
                      : "w-3 bg-white/25 hover:bg-white/45",
                  )}
                />
              ))}
            </div>
            <div className="ml-auto hidden gap-1 sm:flex">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Sebelumnya"
                className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/5 text-mist-200 transition hover:bg-white/12"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Berikutnya"
                className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/5 text-mist-200 transition hover:bg-white/12"
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
