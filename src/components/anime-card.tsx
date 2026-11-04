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

const STATUS_STYLE: Record<Anime["status"], string> = {
  ongoing: "bg-coral text-ink",
  completed: "bg-mint text-ink",
  upcoming: "bg-lilac text-ink",
};

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
      className={cn("group block focus:outline-none", className)}
      aria-label={`${anime.title} — ${STATUS_LABEL[anime.status]}`}
    >
      <div className="relative transition-transform duration-150 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:[&>div:first-child]:shadow-[7px_7px_0_0_var(--color-ink)]">
        <Poster
          anime={anime}
          titleSize={size === "lg" ? "lg" : "md"}
          className="aspect-[2/3]"
        />

        {anime.score > 0 && (
          <span className="absolute -left-1 -top-1 flex items-center gap-1 rounded-full border-2 border-ink bg-mustard px-1.5 py-[1px] text-[10px] font-black text-ink shadow-[2px_2px_0_0_var(--color-ink)]">
            <Star className="size-2.5 fill-ink" />
            {anime.score.toFixed(1)}
          </span>
        )}

        <span
          className={cn(
            "absolute -right-1 -top-1 rounded-full border-2 border-ink px-1.5 py-[1px] text-[9px] font-black uppercase tracking-wide shadow-[2px_2px_0_0_var(--color-ink)]",
            STATUS_STYLE[anime.status],
          )}
        >
          {STATUS_TEXT[anime.status]}
        </span>

        <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid size-11 place-items-center rounded-full border-2 border-ink bg-coral shadow-[3px_3px_0_0_var(--color-ink)]">
            <Play className="size-4 translate-x-[1px] fill-ink text-ink" />
          </span>
        </span>

        {typeof progress === "number" && progress > 0 && (
          <span className="absolute inset-x-2 bottom-2 h-2 overflow-hidden rounded-full border-2 border-ink bg-card">
            <span
              className="block h-full rounded-full bg-coral"
              style={{ width: `${watchPercent(progress, 100)}%` }}
            />
          </span>
        )}
      </div>

      <div className="mt-2">
        <p className="truncate text-[13px] font-black leading-snug text-ink group-hover:text-coral-dark">
          {anime.title}
        </p>
        <p className="truncate text-[11px] font-semibold text-ink-mute">
          {caption ??
            (anime.status === "upcoming"
              ? `${anime.season ?? anime.year} • Segera`
              : `Ep ${padEpisode(anime.totalEpisodes)} • ${anime.genres[0] ?? anime.type}`)}
        </p>
      </div>
    </Link>
  );
}
