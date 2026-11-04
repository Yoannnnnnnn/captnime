"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Play, PlayCircle, Search } from "lucide-react";
import type { Anime, Episode } from "@/lib/types";
import { cn, formatDateShort, formatMinutes, padEpisode } from "@/lib/utils";

interface EpisodeListProps {
  anime: Anime;
  currentEpisode?: number;
  /** "page" = daftar panjang di halaman detail, "sidebar" = panel player. */
  variant?: "page" | "sidebar";
  /** Nomor episode yang sudah ditonton (progress > 0). */
  watched?: Record<number, number>;
}

export function EpisodeList({
  anime,
  currentEpisode,
  variant = "page",
  watched = {},
}: EpisodeListProps) {
  const [reversed, setReversed] = useState(variant === "sidebar");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const episodes = useMemo(() => {
    const list = [...anime.episodes];
    const ordered = reversed ? list.reverse() : list;
    const q = query.trim();
    if (!q) return ordered;
    return ordered.filter(
      (ep) =>
        ep.title.toLowerCase().includes(q.toLowerCase()) ||
        String(ep.number).includes(q),
    );
  }, [anime.episodes, reversed, query]);

  const limit = variant === "sidebar" ? episodes.length : 12;
  const visible = expanded ? episodes : episodes.slice(0, limit);

  if (anime.episodes.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-ink-850/60 p-5 text-center text-sm text-mist-400">
        Episode belum tersedia — anime ini belum mulai tayang.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {variant === "page" && (
          <label className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5">
            <Search className="size-3.5 shrink-0 text-mist-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari episode…"
              aria-label="Cari episode"
              className="h-full w-full bg-transparent text-[13px] text-mist-100 placeholder:text-mist-400/80 focus:outline-none"
            />
          </label>
        )}
        <button
          type="button"
          onClick={() => setReversed((r) => !r)}
          className="ml-auto shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-mist-300 transition hover:bg-white/10"
        >
          {reversed ? "Terlama → Terbaru" : "Terbaru → Terlama"}
        </button>
      </div>

      <ul
        className={cn(
          "grid gap-2",
          variant === "page" ? "sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {visible.map((ep) => (
          <EpisodeRow
            key={ep.number}
            anime={anime}
            episode={ep}
            active={currentEpisode === ep.number}
            progress={watched[ep.number] ?? 0}
            compact={variant === "sidebar"}
          />
        ))}
      </ul>

      {!expanded && episodes.length > limit && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-mist-200 transition hover:bg-white/10"
        >
          Lihat semua {episodes.length} episode
        </button>
      )}

      {episodes.length === 0 && query && (
        <p className="py-4 text-center text-sm text-mist-400">
          Tidak ada episode yang cocok dengan “{query}”.
        </p>
      )}
    </div>
  );
}

function EpisodeRow({
  anime,
  episode,
  active,
  progress,
  compact,
}: {
  anime: Anime;
  episode: Episode;
  active: boolean;
  progress: number;
  compact: boolean;
}) {
  const done = progress >= 92;

  return (
    <li>
      <Link
        href={`/watch/${anime.slug}/${episode.number}`}
        className={cn(
          "group flex items-center gap-3 rounded-xl border p-2.5 transition",
          active
            ? "border-brand-500/60 bg-brand-500/10"
            : "border-white/8 bg-ink-850/70 hover:border-white/20 hover:bg-ink-800",
        )}
      >
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-lg text-[11px] font-black",
            compact ? "size-9" : "size-11",
            active
              ? "bg-brand-500 text-white"
              : "bg-white/8 text-mist-200 group-hover:bg-white/14",
          )}
        >
          {done ? (
            <Check className="size-4 text-cyan-glow" />
          ) : active ? (
            <Play className="size-4 fill-current" />
          ) : (
            padEpisode(episode.number)
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-mist-100">
              Ep {episode.number}
              {!compact && ` — ${episode.title}`}
            </span>
            {episode.filler && (
              <span className="shrink-0 rounded bg-white/10 px-1 py-0.5 text-[9px] font-bold text-mist-300">
                FILLER
              </span>
            )}
            {active && (
              <span className="shrink-0 rounded bg-brand-500 px-1 py-0.5 text-[9px] font-bold text-white">
                SEDANG DITONTON
              </span>
            )}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-mist-400">
            {formatDateShort(episode.releasedAt)}
            <span className="size-0.5 rounded-full bg-mist-500" />
            {formatMinutes(episode.duration)}
            {progress > 0 && !done && (
              <>
                <span className="size-0.5 rounded-full bg-mist-500" />
                <span className="text-brand-400">{progress}%</span>
              </>
            )}
          </span>
          {progress > 0 && !done && (
            <span className="mt-1.5 block h-0.5 overflow-hidden rounded-full bg-white/15">
              <span
                className="block h-full rounded-full bg-brand-500"
                style={{ width: `${progress}%` }}
              />
            </span>
          )}
        </span>

        {compact && active ? (
          <PlayCircle className="size-4 shrink-0 text-brand-400" />
        ) : (
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-mist-400 opacity-0 transition group-hover:opacity-100">
            Tonton
          </span>
        )}
      </Link>
    </li>
  );
}
