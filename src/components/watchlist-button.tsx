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
        "flex h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition active:scale-[0.98]",
        variant === "solid"
          ? saved
            ? "bg-white/12 text-mist-100 ring-1 ring-white/20"
            : "border border-white/15 bg-white/8 text-mist-100 hover:bg-white/14"
          : "text-mist-300 hover:text-white",
      )}
    >
      {justAdded ? (
        <Check className="size-4 text-cyan-glow" />
      ) : saved ? (
        <BookmarkCheck className="size-4 text-brand-400" />
      ) : (
        <Bookmark className="size-4" />
      )}
      {justAdded ? "Ditambahkan" : saved ? "Tersimpan" : "Daftar Saya"}
    </button>
  );
}
