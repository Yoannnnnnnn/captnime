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
          <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-text sm:text-xl">
            <History className="size-4 text-gold" />
            Lanjut Tonton
          </h2>
          <p className="mt-0.5 text-xs text-text-2 sm:text-[13px]">
            Tersimpan otomatis di perangkat ini
          </p>
        </div>
        <Link
          href="/my-list"
          className="text-xs font-semibold text-text-2 transition-colors hover:text-gold"
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
                <div className="relative">
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
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-10 place-items-center rounded-full border border-line bg-gold transition group-hover:scale-110">
                      <Play className="size-4 translate-x-[1px] fill-white text-white" />
                    </span>
                  </span>

                  {/* strip progres, gaya label komik */}
                  <span className="absolute inset-x-1.5 bottom-1.5 block rounded-lg border border-line bg-bg px-1.5 py-1">
                    <span className="mb-1 flex items-center justify-between text-[9.5px] font-semibold text-text">
                      <span>Ep {item.episode}</span>
                      <span>{formatDuration(item.duration - item.position)}</span>
                    </span>
                    <span className="block h-1.5 overflow-hidden rounded-full border border-line bg-surface">
                      <span
                        className="block h-full rounded-full bg-gold"
                        style={{ width: `${percent}%` }}
                      />
                    </span>
                  </span>
                </div>
                <p className="mt-2 truncate text-[13px] font-semibold text-text group-hover:text-gold">
                  {item.title}
                </p>
                <p className="text-[11px] font-semibold text-text-3">
                  Ep {padEpisode(item.episode)} dari {item.totalEpisodes} • {percent}%
                </p>
              </Link>

              <button
                type="button"
                onClick={() => removeHistory(item.slug)}
                aria-label={`Hapus ${item.title} dari riwayat`}
                className="absolute -right-1.5 -top-1.5 z-10 grid size-6 place-items-center rounded-full border border-line bg-surface text-bg opacity-0 transition hover:bg-gold group-hover:opacity-100"
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
