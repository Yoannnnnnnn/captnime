import type {
  Anime,
  AnimeProvider,
  BrowseQuery,
  DayName,
  GenreInfo,
  Paginated,
} from "@/lib/types";

/**
 * RemoteProvider — jembatan ke sumber data produksi Anda.
 *
 * Provider ini TIDAK melakukan scraping di sisi browser. Ia hanya memanggil
 * satu API JSON yang Anda kendalikan sendiri (server/API gateway/aggregator
 * berlisensi), lalu memetakan responsnya ke kontrak Captnime.
 *
 * Kontrak endpoint yang diharapkan (semua GET, JSON):
 *   /anime?q=&genre=&status=&type=&sort=&page=&perPage=  -> Paginated<RawAnime>
 *   /anime/:slug                                          -> RawAnime
 *   /genres                                               -> GenreInfo[]
 *   /schedule                                             -> Record<day, RawAnime[]>
 *
 * RawAnime boleh berbeda bentuk; cukup sesuaikan `mapAnime()`.
 * Lihat docs/INTEGRASI-SUMBER-DATA.md untuk contoh lengkap.
 */

export interface RemoteProviderOptions {
  baseUrl: string;
  apiKey?: string;
  /** Detik. Default 60. */
  revalidate?: number;
  headers?: Record<string, string>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Raw = any;

function pick<T>(...values: (T | undefined | null)[]): T | undefined {
  return values.find((v) => v !== undefined && v !== null && v !== "") as
    | T
    | undefined;
}

/** Normalisasi bentuk data dari API Anda ke kontrak internal. */
export function mapAnime(raw: Raw): Anime {
  const episodes = Array.isArray(raw?.episodes)
    ? raw.episodes.map((ep: Raw, i: number) => ({
        number: Number(pick(ep?.number, ep?.episode, i + 1)),
        title: String(pick(ep?.title, ep?.name, `Episode ${i + 1}`)),
        duration: Number(pick(ep?.duration, 1440)),
        releasedAt: String(pick(ep?.releasedAt, ep?.date, new Date(0).toISOString())),
        synopsis: ep?.synopsis ?? undefined,
        thumbnail: pick(ep?.thumbnail, ep?.image),
        filler: Boolean(ep?.filler),
        servers: Array.isArray(ep?.servers)
          ? ep.servers.map((s: Raw, idx: number) => ({
              id: String(pick(s?.id, `s${idx + 1}`)),
              label: String(pick(s?.label, s?.name, `Server ${idx + 1}`)),
              type: s?.type === "hls" ? "hls" : "mp4",
              url: String(pick(s?.url, s?.src, "")),
              quality: String(pick(s?.quality, s?.resolution, "auto")),
              note: s?.note ?? undefined,
            }))
          : [],
        subtitles: Array.isArray(ep?.subtitles)
          ? ep.subtitles.map((s: Raw) => ({
              lang: String(pick(s?.lang, s?.code, "id")),
              label: String(pick(s?.label, s?.name, "Indonesia")),
              src: String(pick(s?.src, s?.url, "")),
              default: Boolean(s?.default),
            }))
          : [],
      }))
    : [];

  return {
    id: String(pick(raw?.id, raw?.slug, crypto.randomUUID())),
    slug: String(pick(raw?.slug, raw?.id, "")),
    title: String(pick(raw?.title, raw?.name, "Tanpa Judul")),
    titleAlt: pick(raw?.titleAlt, raw?.title_english, raw?.alternative),
    tagline: raw?.tagline ?? undefined,
    synopsis: String(pick(raw?.synopsis, raw?.description, "")),
    type: (pick(raw?.type, "TV") as Anime["type"]) ?? "TV",
    status: (pick(raw?.status, "completed") as Anime["status"]) ?? "completed",
    year: Number(pick(raw?.year, new Date().getFullYear())),
    season: raw?.season ?? undefined,
    studio: String(pick(raw?.studio, "—")),
    score: Number(pick(raw?.score, raw?.rating_score, 0)),
    rating: String(pick(raw?.rating, "13+")),
    genres: Array.isArray(raw?.genres) ? raw.genres.map(String) : [],
    totalEpisodes: Number(pick(raw?.totalEpisodes, episodes.length, 0)),
    durationMinutes: Number(pick(raw?.durationMinutes, 24)),
    broadcastDay: raw?.broadcastDay as DayName | undefined,
    broadcastTime: raw?.broadcastTime ?? undefined,
    palette: Array.isArray(raw?.palette) && raw.palette.length === 2
      ? [String(raw.palette[0]), String(raw.palette[1])]
      : ["#1b1b2f", "#ff3d68"],
    motif: raw?.motif ?? undefined,
    poster: pick(raw?.poster, raw?.image, raw?.thumbnail),
    banner: pick(raw?.banner, raw?.cover),
    featured: Boolean(raw?.featured),
    tags: Array.isArray(raw?.tags) ? raw.tags.map(String) : [],
    trailerUrl: raw?.trailerUrl ?? undefined,
    episodes,
    relatedSlugs: Array.isArray(raw?.relatedSlugs) ? raw.relatedSlugs.map(String) : [],
  };
}

export class RemoteProvider implements AnimeProvider {
  readonly name = "remote";
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly revalidate: number;

  constructor(options: RemoteProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.revalidate = options.revalidate ?? 60;
    this.headers = {
      Accept: "application/json",
      ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
      ...options.headers,
    };
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: this.headers,
      next: { revalidate: this.revalidate },
    });
    if (!res.ok) {
      throw new Error(
        `[RemoteProvider] ${path} gagal: ${res.status} ${res.statusText}`,
      );
    }
    return (await res.json()) as T;
  }

  async list(query: BrowseQuery = {}): Promise<Paginated<Anime>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== "semua") params.set(k, String(v));
    });
    const data = await this.get<Paginated<Raw>>(`/anime?${params.toString()}`);
    const items = (data.items ?? []).map(mapAnime);
    return {
      items,
      total: data.total ?? items.length,
      page: data.page ?? 1,
      perPage: data.perPage ?? items.length,
      totalPages: data.totalPages ?? 1,
    };
  }

  async getBySlug(slug: string): Promise<Anime | null> {
    try {
      const raw = await this.get<Raw>(`/anime/${encodeURIComponent(slug)}`);
      return mapAnime(raw);
    } catch {
      return null;
    }
  }

  async getEpisode(slug: string, episodeNumber: number) {
    const anime = await this.getBySlug(slug);
    if (!anime) return null;
    const episode = anime.episodes.find((e) => e.number === episodeNumber);
    if (!episode) return null;
    return { anime, episode };
  }

  private async simple(path: string, limit: number): Promise<Anime[]> {
    const data = await this.get<Raw[]>(path);
    return (Array.isArray(data) ? data : []).map(mapAnime).slice(0, limit);
  }

  async trending(limit = 10) {
    return this.simple(`/anime?sort=populer&perPage=${limit}`, limit);
  }
  async ongoing(limit = 12) {
    return this.simple(`/anime?status=ongoing&perPage=${limit}`, limit);
  }
  async spotlight(limit = 4) {
    return this.simple(`/anime?featured=true&perPage=${limit}`, limit);
  }
  async genres(): Promise<GenreInfo[]> {
    return this.get<GenreInfo[]>("/genres");
  }
  async schedule(): Promise<Record<DayName, Anime[]>> {
    const raw = await this.get<Record<string, Raw[]>>("/schedule");
    return Object.fromEntries(
      Object.entries(raw).map(([day, list]) => [day, (list ?? []).map(mapAnime)]),
    ) as Record<DayName, Anime[]>;
  }
  async related(slug: string, limit = 6) {
    return this.simple(`/anime/${encodeURIComponent(slug)}/related?limit=${limit}`, limit);
  }
  async allSlugs(): Promise<string[]> {
    const data = await this.get<{ slug: string }[]>("/anime/slugs");
    return (data ?? []).map((d) => d.slug);
  }
}
