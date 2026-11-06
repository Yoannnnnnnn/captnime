import type { AnimeStatus, AnimeType, DayName } from "@/lib/types";

/**
 * Klien metadata AniList (GraphQL).
 *
 * Yang diambil HANYA metadata: judul, sinopsis, genre, tahun, musim, studio,
 * skor, poster/banner, dan jumlah episode. Tidak ada tautan stream — video tetap
 * diisi manual lewat panel admin (embed resmi atau berkas milik sendiri).
 *
 * Catatan operasional:
 * - AniList membatasi ±90 permintaan/menit per IP; pencarian di panel dibatasi
 *   20 hasil agar tidak memicu limit.
 * - Endpoint bisa diganti lewat CAPTNIME_ANILIST_ENDPOINT (berguna untuk mock
 *   saat pengujian, atau proxy di lingkungan yang memblokir anilist.co).
 * - Atribusi "Metadata: AniList" ditampilkan di halaman impor.
 */

const DEFAULT_ENDPOINT = "https://graphql.anilist.co";
const TIMEOUT_MS = 8000;

export function anilistEndpoint(): string {
  return process.env.CAPTNIME_ANILIST_ENDPOINT?.trim() || DEFAULT_ENDPOINT;
}

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  description
  format
  status
  season
  seasonYear
  startDate { year }
  episodes
  duration
  genres
  averageScore
  popularity
  isAdult
  siteUrl
  coverImage { extraLarge large color }
  bannerImage
  studios(isMain: true) { nodes { name } }
`;

const SEARCH_QUERY = `
query ($search: String, $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
      ${MEDIA_FIELDS}
    }
  }
}
`;

const DETAIL_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    ${MEDIA_FIELDS}
  }
}
`;

export interface AniListMedia {
  id: number;
  title: { romaji?: string; english?: string; native?: string };
  description?: string;
  format?: string;
  status?: string;
  season?: string;
  seasonYear?: number;
  startDate?: { year?: number };
  episodes?: number;
  duration?: number;
  genres?: string[];
  averageScore?: number;
  popularity?: number;
  isAdult?: boolean;
  siteUrl?: string;
  coverImage?: { extraLarge?: string; large?: string; color?: string };
  bannerImage?: string;
  studios?: { nodes?: Array<{ name?: string }> };
}

/** Judul yang siap dipakai panel admin + pratinjau. */
export interface MetadataDraft {
  anilistId: number;
  title: string;
  titleAlt?: string;
  synopsis: string;
  type: AnimeType;
  status: AnimeStatus;
  year: number;
  season?: string;
  studio: string;
  score: number;
  rating: string;
  totalEpisodes: number;
  durationMinutes: number;
  genres: string[];
  palette: [string, string];
  motif?: string;
  poster?: string;
  banner?: string;
  sourceUrl?: string;
}

export interface MetadataResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/* ------------------------------------------------------------------ */
/* Bantuan pemetaan                                                    */
/* ------------------------------------------------------------------ */

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#039;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&mdash;": "—",
  "&ndash;": "–",
  "&nbsp;": " ",
};

function plainText(html: string | undefined): string {
  if (!html) return "";
  return (
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m)
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function toType(format: string | undefined): AnimeType {
  switch (format) {
    case "MOVIE":
      return "Movie";
    case "OVA":
      return "OVA";
    case "ONA":
      return "ONA";
    case "SPECIAL":
    case "MUSIC":
      return "Special";
    case "TV":
    case "TV_SHORT":
    default:
      return "TV";
  }
}

function toStatus(status: string | undefined): AnimeStatus {
  switch (status) {
    case "RELEASING":
    case "HIATUS":
      return "ongoing";
    case "NOT_YET_RELEASED":
      return "upcoming";
    case "FINISHED":
    case "CANCELLED":
    default:
      return "completed";
  }
}

/** Gelapkan warna hex untuk gradien poster (`#1a2b3c` → lebih gelap). */
function darken(hex: string, factor = 0.45): string {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) return "#1b1b2f";
  const channel = (start: number) => {
    const value = Math.round(parseInt(clean.slice(start, start + 2), 16) * factor);
    return value.toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

const GENRE_MOTIF: Record<string, string> = {
  Action: "⚔",
  Adventure: "⌖",
  Comedy: "☺",
  Drama: "🎭",
  Fantasy: "✧",
  Horror: "☾",
  "Mahou Shoujo": "✦",
  Mecha: "⬢",
  Music: "♪",
  Mystery: "◎",
  Psychological: "◎",
  Romance: "❀",
  "Sci-Fi": "✵",
  "Slice of Life": "☕",
  Sports: "⚽",
  Supernatural: "✦",
  Thriller: "⌁",
};

export function toDraft(media: AniListMedia): MetadataDraft {
  // Romaji dipakai sebagai judul utama: itu bentuk yang paling dikenal di
  // katalog anime (termasuk penonton Indonesia). Judul Inggris menyusul.
  const title =
    media.title.romaji?.trim() ||
    media.title.english?.trim() ||
    media.title.native?.trim() ||
    `Anime ${media.id}`;

  const alt = [media.title.english, media.title.native]
    .map((t) => t?.trim())
    .find((t) => t && t !== title);

  const color =
    media.coverImage?.color && /^#[0-9a-f]{6}$/i.test(media.coverImage.color)
      ? media.coverImage.color
      : "#1b1b2f";

  const genres = (media.genres ?? []).slice(0, 6);
  const motif = genres.map((g) => GENRE_MOTIF[g]).find(Boolean) ?? "✧";

  return {
    anilistId: media.id,
    title,
    titleAlt: alt,
    synopsis: plainText(media.description) || "Belum ada sinopsis dari sumber metadata.",
    type: toType(media.format),
    status: toStatus(media.status),
    year: media.seasonYear ?? media.startDate?.year ?? new Date().getFullYear(),
    season: media.season
      ? `${media.season.charAt(0)}${media.season.slice(1).toLowerCase()} ${media.seasonYear ?? ""}`.trim()
      : undefined,
    studio: media.studios?.nodes?.[0]?.name?.trim() || "Tidak diketahui",
    score: media.averageScore ? Math.round(media.averageScore) / 10 : 0,
    rating: media.isAdult ? "17+" : "13+",
    totalEpisodes: media.episodes ?? 0,
    durationMinutes: media.duration ?? 24,
    genres,
    palette: [darken(color), color],
    motif,
    poster: media.coverImage?.extraLarge ?? media.coverImage?.large,
    banner: media.bannerImage,
    sourceUrl: media.siteUrl,
  };
}

/* ------------------------------------------------------------------ */
/* Permintaan GraphQL                                                  */
/* ------------------------------------------------------------------ */

async function query<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(anilistEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`AniList menolak permintaan (HTTP ${response.status}).`);
  }

  const json = (await response.json()) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };

  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? "Kesalahan AniList.");
  }
  if (!json.data) throw new Error("Respons AniList kosong.");

  return json.data;
}

export async function searchAnime(
  term: string,
  perPage = 12,
): Promise<MetadataResult<MetadataDraft[]>> {
  const search = term.trim();
  if (search.length < 2) return { ok: true, data: [] };

  try {
    const data = await query<{ Page: { media?: AniListMedia[] } }>(SEARCH_QUERY, {
      search,
      perPage: Math.min(Math.max(perPage, 1), 20),
    });
    return { ok: true, data: (data.Page.media ?? []).map(toDraft) };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal menghubungi AniList. Periksa koneksi server.",
    };
  }
}

export async function getAnimeById(
  id: number,
): Promise<MetadataResult<MetadataDraft>> {
  try {
    const data = await query<{ Media?: AniListMedia }>(DETAIL_QUERY, { id });
    if (!data.Media) return { ok: false, error: "Judul tidak ditemukan di AniList." };
    return { ok: true, data: toDraft(data.Media) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal menghubungi AniList.",
    };
  }
}

/** Jadwal tayang AniList bisa dipakai nanti; tipe hari disiapkan agar konsisten. */
export type BroadcastDay = DayName;
