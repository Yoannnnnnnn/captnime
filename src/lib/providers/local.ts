import { CATALOG } from "@/lib/data/catalog";
import type {
  Anime,
  AnimeProvider,
  AnimeStatus,
  BrowseQuery,
  DayName,
  GenreInfo,
  Paginated,
} from "@/lib/types";

/**
 * Provider lokal: membaca katalog in-memory (seed).
 * Dipakai untuk demo, development, dan fallback ketika provider remote
 * tidak dikonfigurasi.
 */
export class LocalProvider implements AnimeProvider {
  readonly name = "local";
  private readonly anime: Anime[];

  constructor(data: Anime[] = CATALOG) {
    this.anime = data;
  }

  async list(query: BrowseQuery = {}): Promise<Paginated<Anime>> {
    const {
      q = "",
      genre = "",
      status = "semua",
      type = "semua",
      sort = "populer",
      page = 1,
      perPage = 12,
    } = query;

    const needle = q.trim().toLowerCase();
    let items = this.anime.filter((a) => {
      if (genre && !a.genres.includes(genre)) return false;
      if (status !== "semua" && a.status !== status) return false;
      if (type !== "semua" && a.type !== type) return false;
      if (!needle) return true;
      const haystack = [a.title, a.titleAlt ?? "", a.synopsis, ...a.genres]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });

    items = LocalProvider.sortItems(items, sort);

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * perPage;

    return {
      items: items.slice(start, start + perPage),
      total,
      page: safePage,
      perPage,
      totalPages,
    };
  }

  private static sortItems(items: Anime[], sort: BrowseQuery["sort"]): Anime[] {
    const copy = [...items];
    switch (sort) {
      case "terbaru":
        return copy.sort(
          (a, b) =>
            new Date(b.episodes.at(-1)?.releasedAt ?? 0).getTime() -
            new Date(a.episodes.at(-1)?.releasedAt ?? 0).getTime(),
        );
      case "judul":
        return copy.sort((a, b) => a.title.localeCompare(b.title, "id"));
      case "rating":
        return copy.sort((a, b) => b.score - a.score);
      case "populer":
      default:
        return copy.sort((a, b) => {
          const ongoingBoost = Number(b.status === "ongoing") - Number(a.status === "ongoing");
          if (ongoingBoost !== 0) return ongoingBoost;
          return b.score * b.episodes.length - a.score * a.episodes.length;
        });
    }
  }

  async getBySlug(slug: string): Promise<Anime | null> {
    return this.anime.find((a) => a.slug === slug) ?? null;
  }

  async getEpisode(slug: string, episodeNumber: number) {
    const anime = await this.getBySlug(slug);
    if (!anime) return null;
    const episode = anime.episodes.find((e) => e.number === episodeNumber);
    if (!episode) return null;
    return { anime, episode };
  }

  async trending(limit = 10): Promise<Anime[]> {
    return [...this.anime]
      .filter((a) => a.status !== "upcoming")
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async ongoing(limit = 12): Promise<Anime[]> {
    return this.anime
      .filter((a) => a.status === "ongoing")
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async spotlight(limit = 4): Promise<Anime[]> {
    const featured = this.anime.filter((a) => a.featured);
    return (featured.length > 0 ? featured : this.anime).slice(0, limit);
  }

  async genres(): Promise<GenreInfo[]> {
    const counts = new Map<string, number>();
    for (const a of this.anime) {
      for (const g of a.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, total]) => ({
        name,
        slug: slugify(name),
        total,
      }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "id"));
  }

  async schedule(): Promise<Record<DayName, Anime[]>> {
    const days: DayName[] = [
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
      "Minggu",
    ];
    const result = Object.fromEntries(days.map((d) => [d, [] as Anime[]])) as Record<
      DayName,
      Anime[]
    >;
    for (const a of this.anime) {
      if (a.status === "ongoing" && a.broadcastDay && result[a.broadcastDay]) {
        result[a.broadcastDay].push(a);
      }
    }
    return result;
  }

  async related(slug: string, limit = 6): Promise<Anime[]> {
    const base = await this.getBySlug(slug);
    if (!base) return [];

    const explicit = (base.relatedSlugs ?? [])
      .map((s) => this.anime.find((a) => a.slug === s))
      .filter((a): a is Anime => Boolean(a));

    const byGenre = this.anime
      .filter(
        (a) =>
          a.slug !== slug &&
          !explicit.some((e) => e.slug === a.slug) &&
          a.genres.some((g) => base.genres.includes(g)),
      )
      .sort((a, b) => b.score - a.score);

    return [...explicit, ...byGenre].slice(0, limit);
  }

  async allSlugs(): Promise<string[]> {
    return this.anime.map((a) => a.slug);
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const GENRE_STATUS: AnimeStatus[] = ["ongoing", "completed", "upcoming"];
