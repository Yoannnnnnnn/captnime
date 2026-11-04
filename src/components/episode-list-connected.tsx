"use client";

import { useMemo } from "react";
import { EpisodeList } from "@/components/episode-list";
import { useHistory } from "@/lib/user-store";
import type { Anime } from "@/lib/types";
import { watchPercent } from "@/lib/utils";

/**
 * Membungkus EpisodeList dengan data progres tontonan dari perangkat.
 * Dipisah agar halaman detail tetap bisa dirender di server.
 */
export function EpisodeListConnected({
  anime,
  variant = "page",
}: {
  anime: Anime;
  variant?: "page" | "sidebar";
}) {
  const history = useHistory();

  const watched = useMemo(() => {
    const entry = history.find((h) => h.slug === anime.slug);
    if (!entry) return {};
    // Hanya episode terakhir yang punya persentase pasti; sisanya dianggap selesai.
    const map: Record<number, number> = {};
    for (const ep of anime.episodes) {
      if (ep.number < entry.episode) map[ep.number] = 100;
    }
    map[entry.episode] = watchPercent(entry.position, entry.duration);
    return map;
  }, [history, anime.slug, anime.episodes]);

  const resume = history.find((h) => h.slug === anime.slug);

  return (
    <div className="space-y-3">
      {resume && resume.position > 10 && (
        <p className="rounded-lg border border-ink/30 bg-coral/8 px-3 py-2 text-[12px] text-ink-soft">
          Terakhir ditonton: Episode {resume.episode} (
          {watchPercent(resume.position, resume.duration)}%)
        </p>
      )}
      <EpisodeList anime={anime} variant={variant} watched={watched} />
    </div>
  );
}
