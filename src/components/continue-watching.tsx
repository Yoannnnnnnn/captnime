"use client";

import Link from "next/link";
import { Play, X, History } from "lucide-react";
import { Poster } from "@/components/poster";
import { useHistory, removeHistory } from "@/lib/user-store";
import { formatDuration, padEpisode, watchPercent } from "@/lib/utils";

export function ContinueWatching() {
  const history = useHistory();
  const items = history.filter((h) => h.position > 5).slice(0, 8);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white sm:text-xl">
            <History className="size-4 text-brand-400" />
            Lanjut Tonton
          </h2>
          <p className="mt-0.5 text-xs text-mist-400 sm:text-[13px]">
            Tersimpan otomatis di perangkat ini
          </p>
        </div>
        <Link
          href="/my-list"
          className="text-xs font-semibold text-mist-300 transition-colors hover:text-brand-400"
        >
          Riwayat
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {items.map((item) => {
          const percent = watchPercent(item.position, item.duration);
          return (
            <div
              key={item.slug}
              className="group relative w-[190px] shrink-0 snap-start sm:w-[220px]"
            >
              <Link href={`/watch/${item.slug}/${item.episode}`} className="block">
                <div className="relative overflow-hidden rounded-xl ring-1 ring-white/8">
                  <Poster
                    anime={{
                      title: item.title,
                      palette: item.palette ?? ["#1b1b2f", "#ff3d68"],
                      motif: item.motif,
                      poster: item.poster,
                    }}
                    hideTitle
                    rounded="rounded-xl"
                    className="aspect-video"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-10 place-items-center rounded-full bg-brand-500/95 shadow-lg transition group-hover:scale-110">
                      <Play className="size-4 translate-x-[1px] fill-white text-white" />
                    </span>
                  </span>
                  <span className="absolute inset-x-0 bottom-0 p-2">
                    <span className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-mist-200">
                      <span>Episode {item.episode}</span>
                      <span>{formatDuration(item.duration - item.position)} tersisa</span>
                    </span>
                    <span className="block h-1 overflow-hidden rounded-full bg-white/25">
                      <span
                        className="block h-full rounded-full bg-brand-500"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                  </span>
                </div>
                <p className="mt-2 truncate text-[13px] font-semibold text-mist-100 group-hover:text-brand-400">
                  {item.title}
                </p>
                <p className="text-[11px] text-mist-400">
                  Ep {padEpisode(item.episode)} dari {item.totalEpisodes} • {percent}%
                </p>
              </Link>

              <button
                type="button"
                onClick={() => removeHistory(item.slug)}
                aria-label={`Hapus ${item.title} dari riwayat`}
                className="absolute -right-1.5 -top-1.5 z-10 grid size-6 place-items-center rounded-full bg-ink-800/95 text-mist-300 opacity-0 ring-1 ring-white/10 transition hover:text-white group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
