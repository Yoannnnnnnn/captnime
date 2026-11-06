import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, Clock3, LogOut, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth-user";
import {
  accountStats,
  listProgress,
  listWatchlist,
} from "@/lib/db/accounts";
import { getProvider } from "@/lib/provider";
import { formatDate, padEpisode, timeAgo } from "@/lib/utils";
import { Badge, btnGhost, btnPrimary } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Akun Saya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser("/akun");
  const stats = accountStats(user.id);
  const [progress, watchlist] = [
    listProgress(user.id, 5),
    listWatchlist(user.id, 5),
  ];

  const provider = getProvider();
  const slugs = Array.from(
    new Set([...progress.map((p) => p.animeSlug), ...watchlist.map((w) => w.animeSlug)]),
  );
  const found = await Promise.all(slugs.map((slug) => provider.getBySlug(slug)));
  const titles = new Map(found.filter(Boolean).map((a) => [a!.slug, a!.title]));

  return (
    <div className="container-page pb-16 pt-16 lg:pt-7">
      <header className="mb-6 border-b border-line pb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
          Akun
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text">
          Halo, {user.name}
        </h1>
        <p className="mt-1 text-[13px] text-text-2">
          Riwayat dan daftar tonton Anda tersimpan di akun ini dan ikut ke perangkat lain
          yang memakai akun yang sama.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* --- profil --- */}
        <section className="sticker p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-gold/15 font-mono text-lg font-semibold uppercase text-gold">
              {user.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-text">{user.name}</p>
              <p className="truncate text-[12.5px] text-text-3">{user.email}</p>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-[12.5px]">
            <div>
              <dt className="text-[10.5px] uppercase tracking-[0.14em] text-text-3">
                Bergabung
              </dt>
              <dd className="mt-0.5 text-text-2">{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] uppercase tracking-[0.14em] text-text-3">
                Penyimpanan
              </dt>
              <dd className="mt-0.5 text-text-2">Database akun</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/my-list" className={btnPrimary}>
              <Bookmark className="size-4" aria-hidden />
              Buka Daftar Saya
            </Link>
            <form action={logoutAction}>
              <button type="submit" className={btnGhost}>
                <LogOut className="size-3.5" aria-hidden />
                Keluar
              </button>
            </form>
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-md border border-line bg-surface-2 px-3 py-2 text-[11.5px] leading-relaxed text-text-3">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-mint" aria-hidden />
            Kata sandi disimpan sebagai hash scrypt dengan salt acak. Sesi berakhir otomatis
            setelah 30 hari, atau segera setelah Anda keluar.
          </p>
        </section>

        {/* --- ringkasan --- */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="sticker-sm px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-text-3">
                <Bookmark className="size-3" aria-hidden />
                Daftar tonton
              </p>
              <p className="mt-1 font-mono text-2xl tabular-nums text-text">
                {stats.watchlist}
              </p>
            </div>
            <div className="sticker-sm px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-text-3">
                <Clock3 className="size-3" aria-hidden />
                Judul ditonton
              </p>
              <p className="mt-1 font-mono text-2xl tabular-nums text-text">
                {stats.progress}
              </p>
            </div>
          </div>

          <section className="sticker p-4">
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-text-3">
              Terakhir ditonton
            </h2>
            {progress.length === 0 ? (
              <p className="text-[12.5px] text-text-3">
                Belum ada riwayat. Mulai menonton satu episode, progres akan tercatat di sini.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {progress.map((row) => (
                  <li key={row.animeSlug}>
                    <Link
                      href={`/watch/${row.animeSlug}/${row.episodeNumber}`}
                      className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-[12.5px] text-text-2 hover:bg-surface-2 hover:text-text"
                    >
                      <span className="font-mono text-[11px] text-gold">
                        E{padEpisode(row.episodeNumber)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {titles.get(row.animeSlug) ?? row.animeSlug}
                      </span>
                      <span className="text-[11px] text-text-3">
                        {timeAgo(row.updatedAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="sticker p-4">
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-text-3">
              Daftar tonton terbaru
            </h2>
            {watchlist.length === 0 ? (
              <p className="text-[12.5px] text-text-3">
                Belum ada judul tersimpan.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {watchlist.map((row) => (
                  <li key={row.animeSlug}>
                    <Link
                      href={`/anime/${row.animeSlug}`}
                      className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-[12.5px] text-text-2 hover:bg-surface-2 hover:text-text"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {titles.get(row.animeSlug) ?? row.animeSlug}
                      </span>
                      <Badge>{timeAgo(row.addedAt)}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
