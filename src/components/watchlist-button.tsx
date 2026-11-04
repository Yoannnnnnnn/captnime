"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Check } from "lucide-react";
import { useWatchlist } from "@/lib/user-store";
import type { Anime } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WatchlistButton({
  anime,
  variant = "solid",
}: {
  anime: Anime;
  variant?: "solid" | "ghost";
}) {
  const { has, toggle } = useWatchlist();
  const [mounted, setMounted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => setMounted(true), []);
  const saved = mounted && has(anime.slug);

  const onClick = () => {
    const added = toggle({
      slug: anime.slug,
      title: anime.title,
      palette: anime.palette,
      motif: anime.motif,
      poster: anime.poster,
    });
    if (added) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1600);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      className={cn(
        "btn-sticker h-11 px-4 text-sm",
        variant === "solid"
          ? saved
            ? "bg-mint text-ink"
            : "bg-card text-ink"
          : "bg-card text-ink",
      )}
    >
      {justAdded ? (
        <Check className="size-4 text-ink" />
      ) : saved ? (
        <BookmarkCheck className="size-4 text-ink" />
      ) : (
        <Bookmark className="size-4" />
      )}
      {justAdded ? "Ditambahkan" : saved ? "Tersimpan" : "Daftar Saya"}
    </button>
  );
}
