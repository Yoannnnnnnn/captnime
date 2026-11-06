/**
 * Kontrak data Captnime.
 *
 * Semua sumber data (seed lokal, API aggregator, CMS, maupun adapter milik
 * Anda sendiri) WAJIB dipetakan ke tipe di file ini. Dengan begitu seluruh UI
 * tidak pernah tahu-menahu dari mana data berasal.
 */

export type AnimeStatus = "ongoing" | "completed" | "upcoming";
export type AnimeType = "TV" | "Movie" | "OVA" | "ONA" | "Special";

export type DayName =
  | "Senin"
  | "Selasa"
  | "Rabu"
  | "Kamis"
  | "Jumat"
  | "Sabtu"
  | "Minggu";

/** Track subtitle terpisah per bahasa (sub Indo jadi default). */
export interface Subtitle {
  lang: string; // "id" | "en" | ...
  label: string; // "Indonesia" | "English"
  src: string; // URL .vtt
  default?: boolean;
}

/** Satu pilihan "server" streaming untuk sebuah episode. */
export interface StreamServer {
  id: string;
  label: string; // "Server 1", "Mirror HD", dst.
  /**
   * hls/mp4 = berkas milik sendiri (bisa lewat CDN).
   * embed   = pemutar pihak ketiga (YouTube resmi, Vimeo, Dailymotion, Bilibili).
   */
  type: "hls" | "mp4" | "embed";
  url: string;
  quality: string; // "1080p" | "720p" | "480p" | "auto"
  note?: string;
}

export interface Episode {
  number: number;
  title: string;
  duration: number; // detik
  releasedAt: string; // ISO date
  synopsis?: string;
  /** Thumbnail opsional; bila kosong UI memakai poster anime. */
  thumbnail?: string;
  servers: StreamServer[];
  subtitles: Subtitle[];
  filler?: boolean;
}

export interface Anime {
  id: string;
  slug: string;
  title: string;
  titleAlt?: string;
  tagline?: string;
  synopsis: string;
  type: AnimeType;
  status: AnimeStatus;
  year: number;
  season?: string;
  studio: string;
  score: number; // 0..10
  rating: string; // "13+", "17+", "SU"
  genres: string[];
  totalEpisodes: number;
  durationMinutes: number;
  broadcastDay?: DayName;
  broadcastTime?: string;
  /** Palet gradien [dari, ke] untuk poster prosedural. */
  palette: [string, string];
  /** Glyph/motif dekoratif pada poster prosedural. */
  motif?: string;
  /** URL poster asli. Bila diisi, menggantikan poster prosedural. */
  poster?: string;
  banner?: string;
  featured?: boolean;
  tags?: string[];
  trailerUrl?: string;
  episodes: Episode[];
  relatedSlugs?: string[];
}

export type SortKey = "populer" | "terbaru" | "judul" | "rating";

export interface BrowseQuery {
  q?: string;
  genre?: string;
  status?: AnimeStatus | "semua";
  type?: AnimeType | "semua";
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface GenreInfo {
  slug: string;
  name: string;
  total: number;
}

/**
 * Antarmuka provider. Implementasi apa pun boleh async (DB, HTTP, cache).
 */
export interface AnimeProvider {
  readonly name: string;
  list(query?: BrowseQuery): Promise<Paginated<Anime>>;
  getBySlug(slug: string): Promise<Anime | null>;
  getEpisode(
    slug: string,
    episodeNumber: number,
  ): Promise<{ anime: Anime; episode: Episode } | null>;
  trending(limit?: number): Promise<Anime[]>;
  ongoing(limit?: number): Promise<Anime[]>;
  spotlight(limit?: number): Promise<Anime[]>;
  genres(): Promise<GenreInfo[]>;
  schedule(): Promise<Record<DayName, Anime[]>>;
  related(slug: string, limit?: number): Promise<Anime[]>;
  allSlugs(): Promise<string[]>;
}
