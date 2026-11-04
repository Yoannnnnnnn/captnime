"use client";

import Link from "next/link";
import { Play, X, History } from "lucide-react";
import { Poster } from "@/components/poster";
import { useHistory, removeHistory } from "@/lib/user-store";
import { formatDuration, padEpisode, watchPercent } from "@/lib/utils";

interface ContinueWatchingProps {
  /** "rail" = kartu horizontal, "compact" = daftar ringkas untuk panel. */
  variant?: "rail" | "compact";
}

export function ContinueWatching({ variant = "rail" }: ContinueWatchingProps) {
  const history = useHistory();
  const all = history.filter((h) => h.position > 5);
  const items = all.slice(0, variant === "compact" ? 3 : 8);

  if (items.length === 0) {
    return (
      <p className="py-3 text-[12px] leading-relaxed text-text-3">
        Belum ada tontonan. Pilih judul di{" "}
        <Link href="/browse" className="text-gold hover:underline">
          katalog
        </Link>{" "}
        dan progresmu akan tercatat di sini.
      </p>
    );
  }

  /* ---------------- varian ringkas ---------------- */
  if (variant === "compact") {
    return (
      <ul className="divide-y divide-line">
        {items.map((item) => {
          const percent = watchPercent(item.position, item.duration);
          return (
            <li key={item.slug} className="group relative">
              <Link
                href={`/watch/${item.slug}/${item.episode}`}
                className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
              >
                <span className="relative shrink-0">
                  <Poster
                    anime={{
                      title: item.title,
                      palette: item.palette ?? ["#1b1b2f", "#ff3d68"],
                      motif: item.motif,
                      poster: item.poster,
                    }}
                    hideTitle
                    rounded="rounded"
                    className="h-11 w-8"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] text-text">
                    {item.title}
                  </span>
                  <span className="mt-1 block h-[3px] overflow-hidden rounded-full bg-surface-3">
                    <span className="block h-full bg-gold" style={{ width: `${percent}%` }} />
                  </span>
                  <span className="mt-0.5 block text-[10px] text-text-3">
                    Ep {padEpisode(item.episode)} · {percent}%
                  </span>
                </span>
                <Play className="size-3 shrink-0 text-text-3 transition-colors group-hover:text-gold" />
              </Link>
              <button
                type="button"
                onClick={() => removeHistory(item.slug)}
                aria-label={`Hapus ${item.title} dari riwayat`}
                className="absolute -right-1 top-0.5 hidden size-5 place-items-center rounded-full bg-surface-2 text-text-3 hover:text-coral group-hover:grid"
              >
                <X className="size-2.5" />
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  /* ---------------- varian rail ---------------- */
  return (
    <section>
      <div className="mb-3 flex items-end justify-between border-b border-line pb-2">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-text-2">
          <History className="size-3.5 text-gold" />
          Lanjut tonton
        </h2>
        <Link href="/my-list" className="text-[11px] text-text-3 hover:text-gold">
          Riwayat
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {items.map((item) => {
          const percent = watchPercent(item.position, item.duration);
          return (
            <div
              key={item.slug}
              className="group relative w-[186px] shrink-0 snap-start sm:w-[210px]"
            >
              <Link href={`/watch/${item.slug}/${item.episode}`} className="block">
                <div className="relative overflow-hidden rounded-lg">
                  <Poster
                    anime={{
                      title: item.title,
                      palette: item.palette ?? ["#1b1b2f", "#ff3d68"],
                      motif: item.motif,
                      poster: item.poster,
                    }}
                    hideTitle
                    rounded="rounded-lg"
                    className="aspect-video"
                  />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-9 place-items-center rounded-full bg-gold text-bg opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="size-3.5 translate-x-[1px] fill-current" />
                    </span>
                  </span>
                  <span className="absolute inset-x-1.5 bottom-1.5 block">
                    <span className="mb-1 flex items-center justify-between text-[9.5px] font-medium text-text">
                      <span>Ep {item.episode}</span>
                      <span className="text-text-2">
                        {formatDuration(item.duration - item.position)} sisa
                      </span>
                    </span>
                    <span className="block h-[3px] overflow-hidden rounded-full bg-bg/60">
                      <span className="block h-full bg-gold" style={{ width: `${percent}%` }} />
                    </span>
                  </span>
                </div>
                <p className="mt-2 truncate text-[12.5px] text-text group-hover:text-gold">
                  {item.title}
                </p>
                <p className="text-[10.5px] text-text-3">
                  Ep {padEpisode(item.episode)} dari {item.totalEpisodes} · {percent}%
                </p>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
