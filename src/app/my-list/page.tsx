"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, History, Play, Trash2, X } from "lucide-react";
import { Poster } from "@/components/poster";
import {
  clearHistory,
  removeHistory,
  useHistory,
  useWatchlist,
} from "@/lib/user-store";
import { cn, formatDuration, padEpisode, timeAgo, watchPercent } from "@/lib/utils";
import { useSession } from "@/components/session-provider";

type Tab = "daftar" | "riwayat";

export default function MyListPage() {
  const watchlist = useWatchlist();
  const history = useHistory();
  const { user, loading: sessionLoading } = useSession();
  const [tab, setTab] = useState<Tab>("daftar");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const listItems = watchlist.items;
  const historyItems = history;

  return (
    <div className="container-page pt-16 lg:pt-7">
      <header className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
          Perpustakaan
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          Daftar Saya
        </h1>
        <p className="mt-1 text-[13px] text-text-2">
          {sessionLoading ? (
            "Memeriksa akun…"
          ) : user && user.emailVerified ? (
            <>
              Tersinkron dengan akun{" "}
              <span className="text-text">{user.name}</span> — ikut ke perangkat lain.
            </>
          ) : user ? (
            <>
              Tersimpan di peramban ini.{" "}
              <Link
                href="/akun"
                className="text-gold underline-offset-4 hover:underline"
              >
                Verifikasi email
              </Link>{" "}
              agar ikut ke perangkat lain.
            </>
          ) : (
            <>
              Tersimpan di perangkat ini.{" "}
              <Link
                href="/masuk?next=%2Fmy-list"
                className="text-gold underline-offset-4 hover:underline"
              >
                Masuk
              </Link>{" "}
              agar ikut ke perangkat lain.
            </>
          )}
        </p>
      </header>

      <div className="mb-5 flex gap-1.5 rounded-xl border border-line bg-surface p-1">
        <TabButton
          active={tab === "daftar"}
          onClick={() => setTab("daftar")}
          icon={<Bookmark className="size-3.5" />}
          count={mounted ? listItems.length : undefined}
        >
          Daftar Tonton
        </TabButton>
        <TabButton
          active={tab === "riwayat"}
          onClick={() => setTab("riwayat")}
          icon={<History className="size-3.5" />}
          count={mounted ? historyItems.length : undefined}
        >
          Riwayat
        </TabButton>
      </div>

      {!mounted ? (
        <SkeletonGrid />
      ) : tab === "daftar" ? (
        listItems.length === 0 ? (
          <EmptyState
            title="Daftar tonton masih kosong"
            body="Tekan tombol “Daftar Saya” di halaman anime untuk menyimpannya di sini."
            cta={{ href: "/browse", label: "Jelajahi katalog" }}
          />
        ) : (
          <ul className="grid gap-2">
            {listItems.map((item) => (
              <li
                key={item.slug}
                className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 transition hover:border-line"
              >
                <Link href={`/anime/${item.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Poster
                    anime={{
                      title: item.title,
                      palette: item.palette ?? ["#1b1b2f", "#ff3d68"],
                      motif: item.motif,
                      poster: item.poster,
                    }}
                    hideTitle
                    rounded="rounded-lg"
                    className="w-12 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-semibold text-text group-hover:text-gold">
                      {item.title}
                    </span>
                    <span className="block text-[11px] text-text-2">
                      Ditambahkan {timeAgo(new Date(item.addedAt).toISOString())}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => watchlist.remove(item.slug)}
                  aria-label={`Hapus ${item.title}`}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-text-3 transition hover:bg-surface hover:text-gold"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )
      ) : historyItems.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat tontonan"
          body="Episode yang kamu buka akan tercatat di sini beserta posisi terakhirnya."
          cta={{ href: "/browse", label: "Mulai menonton" }}
        />
      ) : (
        <div>
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => clearHistory()}
              className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[11px] font-semibold text-text-2 transition hover:border-line-2 hover:text-gold"
            >
              <Trash2 className="size-3" /> Bersihkan riwayat
            </button>
          </div>
          <ul className="grid gap-2">
            {historyItems.map((item) => {
              const percent = watchPercent(item.position, item.duration);
              const done = percent >= 92;
              return (
                <li
                  key={item.slug}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5 transition hover:border-line"
                >
                  <Link
                    href={`/watch/${item.slug}/${item.episode}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <span className="relative w-[76px] shrink-0 overflow-hidden rounded-lg">
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
                      <span className="absolute inset-0 grid place-items-center bg-ink/85">
                        <Play className="size-4 fill-white text-white" />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-text group-hover:text-gold">
                        {item.title}
                      </span>
                      <span className="block text-[11px] text-text-2">
                        Episode {padEpisode(item.episode)} •{" "}
                        {done ? (
                          <span className="text-cyan-glow">Selesai</span>
                        ) : (
                          `${formatDuration(item.duration - item.position)} tersisa`
                        )}
                      </span>
                      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-surface-2">
                        <span
                          className={cn(
                            "block h-full rounded-full",
                            done ? "bg-cyan-glow" : "bg-gold",
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeHistory(item.slug)}
                    aria-label={`Hapus ${item.title} dari riwayat`}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-text-3 transition hover:bg-surface hover:text-gold"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-bold transition",
        active ? "bg-gold text-bg" : "text-text-2 hover:bg-surface",
      )}
    >
      {icon}
      {children}
      {count !== undefined && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
            active ? "bg-white/20" : "bg-surface",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-surface text-text-2">
        <Bookmark className="size-5" />
      </span>
      <h2 className="mt-3 text-base font-bold text-text">{title}</h2>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-text-2">{body}</p>
      <Link
        href={cta.href}
        className="mt-4 rounded-md bg-gold px-5 py-2.5 text-[13px] font-bold text-bg transition hover:bg-gold-2"
      >
        {cta.label}
      </Link>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid gap-2" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="h-[74px] animate-pulse rounded-xl border border-line bg-surface"
        />
      ))}
    </ul>
  );
}
