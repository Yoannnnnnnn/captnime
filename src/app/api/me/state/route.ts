import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-user";
import { listProgress, listWatchlist } from "@/lib/db/accounts";
import { getProvider } from "@/lib/provider";
import type { Anime } from "@/lib/types";

export const dynamic = "force-dynamic";

type Card = Pick<Anime, "title" | "slug" | "palette" | "motif" | "poster">;

/**
 * Mengirim riwayat + daftar tonton untuk klien (user-store).
 * Metadata judul diambil dari provider aktif, jadi tetap benar baik katalog
 * berasal dari seed maupun dari database.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null, history: [], watchlist: [] });

  const provider = getProvider();
  const [progress, watchlist] = [listProgress(user.id), listWatchlist(user.id)];

  const slugs = Array.from(
    new Set([...progress.map((p) => p.animeSlug), ...watchlist.map((w) => w.animeSlug)]),
  );
  const found = await Promise.all(slugs.map((slug) => provider.getBySlug(slug)));
  const bySlug = new Map<string, Card>();
  for (const anime of found) {
    if (anime) {
      bySlug.set(anime.slug, {
        title: anime.title,
        slug: anime.slug,
        palette: anime.palette,
        motif: anime.motif,
        poster: anime.poster,
      });
    }
  }

  return NextResponse.json({
    user,
    history: progress.map((row) => {
      const meta = bySlug.get(row.animeSlug);
      return {
        slug: row.animeSlug,
        title: meta?.title ?? row.animeSlug,
        palette: meta?.palette,
        motif: meta?.motif,
        poster: meta?.poster,
        episode: row.episodeNumber,
        position: row.position,
        duration: row.duration,
        totalEpisodes: row.episodeNumber,
        updatedAt: new Date(row.updatedAt).getTime() || Date.now(),
      };
    }),
    watchlist: watchlist.map((row) => {
      const meta = bySlug.get(row.animeSlug);
      return {
        slug: row.animeSlug,
        title: meta?.title ?? row.animeSlug,
        palette: meta?.palette,
        motif: meta?.motif,
        poster: meta?.poster,
        addedAt: new Date(row.addedAt).getTime() || Date.now(),
      };
    }),
  });
}
