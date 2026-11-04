import Link from "next/link";
import { Play, Star } from "lucide-react";
import { Poster } from "@/components/poster";
import { STATUS_LABEL } from "@/lib/data/catalog";
import type { Anime } from "@/lib/types";
import { cn, padEpisode, watchPercent } from "@/lib/utils";

interface AnimeCardProps {
  anime: Anime;
  className?: string;
  progress?: number;
  caption?: string;
  size?: "sm" | "md" | "lg";
}

const STATUS_TEXT: Record<Anime["status"], string> = {
  ongoing: "Ongoing",
  completed: "Tamat",
  upcoming: "Segera",
};

export function AnimeCard({
  anime,
  className,
  progress,
  caption,
  size = "md",
}: AnimeCardProps) {
  return (
    <Link
      href={`/anime/${anime.slug}`}
      className={cn("group block", className)}
      aria-label={`${anime.title} — ${STATUS_LABEL[anime.status]}`}
    >
      <div className="relative overflow-hidden rounded-lg ring-1 ring-line transition-all duration-300 group-hover:ring-line-2">
        <Poster
          anime={anime}
          titleSize={size === "lg" ? "lg" : "md"}
          className="aspect-[2/3] transition-transform duration-500 group-hover:scale-[1.04]"
        />

        {/* skor */}
        {anime.score > 0 && (
          <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-bg/75 px-1.5 py-0.5 text-[10px] font-semibold text-gold backdrop-blur-sm">
            <Star className="size-2.5 fill-current" />
            {anime.score.toFixed(1)}
          </span>
        )}

        {/* status tayang */}
        {anime.status === "ongoing" && (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded bg-bg/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-text backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-mint" />
            {STATUS_TEXT.ongoing}
          </span>
        )}
        {anime.status === "upcoming" && (
          <span className="absolute right-1.5 top-1.5 rounded bg-bg/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-text-2 backdrop-blur-sm">
            Segera
          </span>
        )}

        {/* hover: putar */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/85 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="grid size-11 place-items-center rounded-full bg-gold text-bg shadow-lg">
            <Play className="size-4 translate-x-[1px] fill-current" />
          </span>
        </span>

        {typeof progress === "number" && progress > 0 && (
          <span className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-text-3/40">
            <span
              className="block h-full rounded-full bg-gold"
              style={{ width: `${watchPercent(progress, 100)}%` }}
            />
          </span>
        )}
      </div>

      <div className="mt-2">
        <p className="truncate text-[13px] font-medium leading-snug text-text transition-colors group-hover:text-gold">
          {anime.title}
        </p>
        <p className="truncate text-[11px] text-text-3">
          {caption ??
            (anime.status === "upcoming"
              ? `${anime.season ?? anime.year} • Segera`
              : `Ep ${padEpisode(anime.totalEpisodes)} • ${anime.genres[0] ?? anime.type}`)}
        </p>
      </div>
    </Link>
  );
}
