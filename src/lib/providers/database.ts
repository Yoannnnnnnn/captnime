import { ensureSeeded } from "@/lib/db/seed";
import { loadAllAnime } from "@/lib/db/repository";
import { LocalProvider } from "@/lib/providers/local";
import type { Anime, AnimeProvider, BrowseQuery, DayName, GenreInfo, Paginated } from "@/lib/types";

/**
 * Provider database (SQLite lewat node:sqlite).
 *
 * Membaca seluruh katalog dari tabel, lalu memakai ulang aturan filter/sortir
 * LocalProvider — perilaku UI identik dengan mode demo, tanpa duplikasi logika.
 * Cache 5 detik mencegah query berulang saat satu halaman memanggil provider
 * beberapa kali; panel admin memanggil invalidate() setelah menulis.
 */
const CACHE_TTL_MS = 5_000;

class DatabaseProvider implements AnimeProvider {
  readonly name = "database";

  private cache: { at: number; data: Anime[] } | null = null;

  private data(): Anime[] {
    const now = Date.now();
    if (this.cache && now - this.cache.at < CACHE_TTL_MS) return this.cache.data;
    ensureSeeded();
    const data = loadAllAnime();
    this.cache = { at: now, data };
    return data;
  }

  private inner(): LocalProvider {
    return new LocalProvider(this.data());
  }

  invalidate(): void {
    this.cache = null;
  }

  list(query?: BrowseQuery): Promise<Paginated<Anime>> {
    return this.inner().list(query);
  }
  getBySlug(slug: string): Promise<Anime | null> {
    return this.inner().getBySlug(slug);
  }
  getEpisode(slug: string, episodeNumber: number) {
    return this.inner().getEpisode(slug, episodeNumber);
  }
  trending(limit?: number): Promise<Anime[]> {
    return this.inner().trending(limit);
  }
  ongoing(limit?: number): Promise<Anime[]> {
    return this.inner().ongoing(limit);
  }
  spotlight(limit?: number): Promise<Anime[]> {
    return this.inner().spotlight(limit);
  }
  genres(): Promise<GenreInfo[]> {
    return this.inner().genres();
  }
  schedule(): Promise<Record<DayName, Anime[]>> {
    return this.inner().schedule();
  }
  related(slug: string, limit?: number): Promise<Anime[]> {
    return this.inner().related(slug, limit);
  }
  allSlugs(): Promise<string[]> {
    return this.inner().allSlugs();
  }
}

export const databaseProvider = new DatabaseProvider();
