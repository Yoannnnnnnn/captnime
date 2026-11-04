import type { Metadata } from "next";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { Poster } from "@/components/poster";
import { getProvider } from "@/lib/provider";
import { DAYS } from "@/lib/data/catalog";
import { cn, padEpisode } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Jadwal Rilis",
  description:
    "Jadwal rilis anime yang sedang tayang di Captnime, lengkap dengan jam tayang dan jumlah episode.",
};

export default async function SchedulePage() {
  const provider = getProvider();
  const schedule = await provider.schedule();

  // Hari ini dihitung dari tanggal server (WIB).
  const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Senin
  const todayName = DAYS[todayIndex];

  const totalOngoing = Object.values(schedule).reduce((acc, list) => acc + list.length, 0);

  return (
    <div className="container-page pt-20 sm:pt-24">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
          Jadwal
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          Jadwal Rilis Mingguan
        </h1>
        <p className="mt-1 text-[13px] text-text-2">
          {totalOngoing} judul sedang tayang • jadwal mengikuti WIB
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        {DAYS.map((day) => {
          const items = schedule[day] ?? [];
          const isToday = day === todayName;
          return (
            <section
              key={day}
              className={cn(
                "rounded-2xl border p-4",
                isToday
                  ? "border-line-2 bg-gold/[0.06]"
                  : "border-line bg-surface",
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-text">
                  {day}
                  {isToday && (
                    <span className="rounded-full bg-gold px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-bg">
                      Hari ini
                    </span>
                  )}
                </h2>
                <span className="text-[11px] font-semibold text-text-3">
                  {items.length} judul
                </span>
              </div>

              {items.length === 0 ? (
                <p className="rounded-lg bg-surface px-3 py-6 text-center text-[12px] text-text-3">
                  Tidak ada rilis hari ini.
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.map((anime) => (
                    <li key={anime.slug}>
                      <Link
                        href={`/anime/${anime.slug}`}
                        className="group flex items-center gap-3 rounded-xl border border-transparent p-1.5 transition hover:border-line hover:bg-surface"
                      >
                        <Poster
                          anime={anime}
                          hideTitle
                          rounded="rounded-lg"
                          className="w-10 shrink-0"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-text group-hover:text-gold">
                            {anime.title}
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px] text-text-2">
                            <Clock3 className="size-3" />
                            {anime.broadcastTime ?? "—"}
                            <span className="size-0.5 rounded-full bg-text-3" />
                            Ep {padEpisode(anime.episodes.length)} rilis
                          </span>
                        </span>
                        <span className="shrink-0 rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-bold text-text-2">
                          {anime.episodes.length}/{anime.totalEpisodes}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
