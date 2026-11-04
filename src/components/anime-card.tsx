import Link from "next/link";
import { Play, Star } from "lucide-react";
import { Poster } from "@/components/poster";
import { STATUS_LABEL } from "@/lib/data/catalog";
import type { Anime } from "@/lib/types";
import { cn, padEpisode, watchPercent } from "@/lib/utils";

interface AnimeCardProps {
  anime: Anime;
  className?: string;
  /** Progres tontonan 0..100 → menampilkan progress bar di bawah kartu. */
  progress?: number;
  /** Label kecil di bawah judul, mis. "Episode 5 • 40% ditonton". */
  caption?: string;
  size?: "sm" | "md" | "lg";
}

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
      className={cn("group block focus:outline-none", className)}
      aria-label={`${anime.title} — ${STATUS_LABEL[anime.status]}`}
    >
      <div className="relative">
        <Poster
          anime={anime}
          titleSize={size === "sm" ? "sm" : size === "lg" ? "lg" : "md"}
          className={cn(
            "card-hover ring-1 ring-white/5 group-focus-visible:ring-2 group-focus-visible:ring-brand-400",
            size === "sm" ? "aspect-[2/3]" : "aspect-[2/3]",
          )}
        />

        {/* rating */}
        {anime.score > 0 && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-gold backdrop-blur-sm">
            <Star className="size-3 fill-current" />
            {anime.score.toFixed(1)}
          </span>
        )}

        {/* status */}
        <span
          className={cn(
            "absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm",
            anime.status === "ongoing" && "bg-brand-500/90 text-white",
            anime.status === "completed" && "bg-white/12 text-mist-100",
            anime.status === "upcoming" && "bg-violet-glow/80 text-white",
          )}
        >
          {anime.status === "ongoing"
            ? "Ongoing"
            : anime.status === "completed"
              ? "Tamat"
              : "Segera"}
        </span>

        {/* overlay play saat hover */}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-500/95 shadow-[0_0_30px_rgba(255,61,104,0.6)]">
            <Play className="size-5 translate-x-[1px] fill-white text-white" />
          </span>
        </span>

        {typeof progress === "number" && progress > 0 && (
          <span className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-white/25">
            <span
              className="block h-full rounded-full bg-brand-500"
              style={{ width: `${watchPercent(progress, 100)}%` }}
            />
          </span>
        )}
      </div>

      <div className="mt-2 space-y-0.5">
        <p className="truncate text-[13px] font-semibold text-mist-100 transition-colors group-hover:text-brand-400">
          {anime.title}
        </p>
        <p className="truncate text-[11px] text-mist-400">
          {caption ??
            (anime.status === "upcoming"
              ? `${anime.season ?? anime.year} • Segera`
              : `Ep ${padEpisode(anime.totalEpisodes)} • ${anime.genres[0] ?? anime.type}`)}
        </p>
      </div>
    </Link>
  );
}
