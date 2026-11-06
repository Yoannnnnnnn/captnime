import { getDb } from "@/lib/db/client";
import type {
  Anime,
  AnimeStatus,
  AnimeType,
  DayName,
  Episode,
  StreamServer,
  Subtitle,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Tipe baris mentah (snake_case, sesuai schema.sql)                   */
/* ------------------------------------------------------------------ */

interface AnimeRow {
  id: string;
  slug: string;
  title: string;
  title_alt: string | null;
  tagline: string | null;
  synopsis: string;
  type: string;
  status: string;
  year: number;
  season: string | null;
  studio: string;
  score: number;
  rating: string;
  total_episodes: number;
  duration_minutes: number;
  broadcast_day: string | null;
  broadcast_time: string | null;
  palette_from: string;
  palette_to: string;
  motif: string | null;
  poster: string | null;
  banner: string | null;
  featured: number;
  published: number;
  tags: string;
  related_slugs: string;
  created_at: string;
  updated_at: string;
}

interface EpisodeRow {
  id: number;
  anime_id: string;
  number: number;
  title: string;
  duration: number;
  released_at: string;
  synopsis: string | null;
  thumbnail: string | null;
  filler: number;
}

interface ServerRow {
  id: number;
  episode_id: number;
  label: string;
  type: string;
  url: string;
  quality: string;
  note: string | null;
  position: number;
}

interface SubtitleRow {
  id: number;
  episode_id: number;
  lang: string;
  label: string;
  src: string;
  is_default: number;
}

/* ------------------------------------------------------------------ */
/* Bantuan                                                             */
/* ------------------------------------------------------------------ */

const csv = (value: string | null | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const joinCsv = (values: string[] | undefined): string =>
  (values ?? []).map((v) => v.trim()).filter(Boolean).join(",");

export function genreSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Batasi nilai kolom `type` ke tiga bentuk yang dikenal UI. */
function toServerType(value: string): "hls" | "mp4" | "embed" {
  if (value === "mp4") return "mp4";
  if (value === "embed") return "embed";
  return "hls";
}

function transaction<T>(work: () => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* Baca — dipakai UI publik lewat DatabaseProvider                     */
/* ------------------------------------------------------------------ */

export function loadAllAnime(includeUnpublished = false): Anime[] {
  const db = getDb();

  const animeRows = db
    .prepare(
      `SELECT * FROM anime ${includeUnpublished ? "" : "WHERE published = 1"}
       ORDER BY created_at ASC, title ASC`,
    )
    .all() as unknown as AnimeRow[];

  if (animeRows.length === 0) return [];

  const genreRows = db
    .prepare(
      `SELECT ag.anime_id AS anime_id, g.name AS name
         FROM anime_genres ag
         JOIN genres g ON g.id = ag.genre_id
        ORDER BY g.name ASC`,
    )
    .all() as unknown as Array<{ anime_id: string; name: string }>;

  const episodeRows = db
    .prepare(`SELECT * FROM episodes ORDER BY anime_id ASC, number ASC`)
    .all() as unknown as EpisodeRow[];

  const serverRows = db
    .prepare(`SELECT * FROM servers ORDER BY episode_id ASC, position ASC, id ASC`)
    .all() as unknown as ServerRow[];

  const subtitleRows = db
    .prepare(`SELECT * FROM subtitles ORDER BY episode_id ASC, id ASC`)
    .all() as unknown as SubtitleRow[];

  const genresByAnime = new Map<string, string[]>();
  for (const row of genreRows) {
    const list = genresByAnime.get(row.anime_id) ?? [];
    list.push(row.name);
    genresByAnime.set(row.anime_id, list);
  }

  const serversByEpisode = new Map<number, StreamServer[]>();
  for (const row of serverRows) {
    const list = serversByEpisode.get(row.episode_id) ?? [];
    list.push({
      id: String(row.id),
      label: row.label,
      type: toServerType(row.type),
      url: row.url,
      quality: row.quality,
      note: row.note ?? undefined,
    });
    serversByEpisode.set(row.episode_id, list);
  }

  const subtitlesByEpisode = new Map<number, Subtitle[]>();
  for (const row of subtitleRows) {
    const list = subtitlesByEpisode.get(row.episode_id) ?? [];
    list.push({
      lang: row.lang,
      label: row.label,
      src: row.src,
      default: row.is_default === 1,
    });
    subtitlesByEpisode.set(row.episode_id, list);
  }

  const episodesByAnime = new Map<string, Episode[]>();
  for (const row of episodeRows) {
    const list = episodesByAnime.get(row.anime_id) ?? [];
    list.push({
      number: row.number,
      title: row.title,
      duration: row.duration,
      releasedAt: row.released_at,
      synopsis: row.synopsis ?? undefined,
      thumbnail: row.thumbnail ?? undefined,
      filler: row.filler === 1,
      servers: serversByEpisode.get(row.id) ?? [],
      subtitles: subtitlesByEpisode.get(row.id) ?? [],
    });
    episodesByAnime.set(row.anime_id, list);
  }

  return animeRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleAlt: row.title_alt ?? undefined,
    tagline: row.tagline ?? undefined,
    synopsis: row.synopsis,
    type: row.type as AnimeType,
    status: row.status as AnimeStatus,
    year: row.year,
    season: row.season ?? undefined,
    studio: row.studio,
    score: row.score,
    rating: row.rating,
    genres: genresByAnime.get(row.id) ?? [],
    totalEpisodes: row.total_episodes,
    durationMinutes: row.duration_minutes,
    broadcastDay: (row.broadcast_day as DayName | null) ?? undefined,
    broadcastTime: row.broadcast_time ?? undefined,
    palette: [row.palette_from, row.palette_to],
    motif: row.motif ?? undefined,
    poster: row.poster ?? undefined,
    banner: row.banner ?? undefined,
    featured: row.featured === 1,
    tags: csv(row.tags),
    episodes: episodesByAnime.get(row.id) ?? [],
    relatedSlugs: csv(row.related_slugs),
  }));
}

/* ------------------------------------------------------------------ */
/* Baca — khusus panel admin (butuh id database)                       */
/* ------------------------------------------------------------------ */

export interface AdminServerRow extends StreamServer {
  dbId: number;
}

export interface AdminSubtitleRow extends Subtitle {
  dbId: number;
}

export interface AdminEpisodeRow {
  dbId: number;
  number: number;
  title: string;
  duration: number;
  releasedAt: string;
  synopsis?: string;
  filler: boolean;
  servers: AdminServerRow[];
  subtitles: AdminSubtitleRow[];
}

export interface AdminAnime {
  anime: Anime;
  episodeRows: AdminEpisodeRow[];
  published: boolean;
}

export interface AdminListItem {
  slug: string;
  title: string;
  type: string;
  status: string;
  year: number;
  score: number;
  published: boolean;
  featured: boolean;
  episodes: number;
  updatedAt: string;
}

export function getAdminAnimeList(): AdminListItem[] {
  const rows = getDb()
    .prepare(
      `SELECT a.slug, a.title, a.type, a.status, a.year, a.score,
              a.published, a.featured, a.updated_at,
              (SELECT COUNT(*) FROM episodes e WHERE e.anime_id = a.id) AS episodes
         FROM anime a
        ORDER BY a.updated_at DESC, a.title ASC`,
    )
    .all() as unknown as Array<{
    slug: string;
    title: string;
    type: string;
    status: string;
    year: number;
    score: number;
    published: number;
    featured: number;
    updated_at: string;
    episodes: number;
  }>;

  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    type: r.type,
    status: r.status,
    year: r.year,
    score: r.score,
    published: r.published === 1,
    featured: r.featured === 1,
    episodes: r.episodes,
    updatedAt: r.updated_at,
  }));
}

export function getAdminAnime(slug: string): AdminAnime | null {
  const anime = loadAllAnime(true).find((a) => a.slug === slug);
  if (!anime) return null;

  const db = getDb();
  const meta = db
    .prepare(`SELECT published FROM anime WHERE slug = ?`)
    .get(slug) as { published: number } | undefined;
  const rows = db
    .prepare(
      `SELECT * FROM episodes WHERE anime_id = ? ORDER BY number ASC`,
    )
    .all(anime.id) as unknown as EpisodeRow[];

  const servers = db
    .prepare(
      `SELECT s.* FROM servers s
         JOIN episodes e ON e.id = s.episode_id
        WHERE e.anime_id = ?
        ORDER BY s.position ASC, s.id ASC`,
    )
    .all(anime.id) as unknown as ServerRow[];

  const subtitles = db
    .prepare(
      `SELECT s.* FROM subtitles s
         JOIN episodes e ON e.id = s.episode_id
        WHERE e.anime_id = ?
        ORDER BY s.id ASC`,
    )
    .all(anime.id) as unknown as SubtitleRow[];

  const episodeRows: AdminEpisodeRow[] = rows.map((row) => ({
    dbId: row.id,
    number: row.number,
    title: row.title,
    duration: row.duration,
    releasedAt: row.released_at,
    synopsis: row.synopsis ?? undefined,
    filler: row.filler === 1,
    servers: servers
      .filter((s) => s.episode_id === row.id)
      .map((s) => ({
        dbId: s.id,
        id: String(s.id),
        label: s.label,
        type: toServerType(s.type),
        url: s.url,
        quality: s.quality,
        note: s.note ?? undefined,
      })),
    subtitles: subtitles
      .filter((s) => s.episode_id === row.id)
      .map((s) => ({
        dbId: s.id,
        lang: s.lang,
        label: s.label,
        src: s.src,
        default: s.is_default === 1,
      })),
  }));

  return { anime, episodeRows, published: meta?.published === 1 };
}

export function getAllGenres(): string[] {
  const rows = getDb()
    .prepare(`SELECT name FROM genres ORDER BY name ASC`)
    .all() as unknown as Array<{ name: string }>;
  return rows.map((r) => r.name);
}

export function countRows(): {
  anime: number;
  episodes: number;
  servers: number;
  subtitles: number;
  genres: number;
} {
  const db = getDb();
  const one = (table: string) =>
    (db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number })
      .total;
  return {
    anime: one("anime"),
    episodes: one("episodes"),
    servers: one("servers"),
    subtitles: one("subtitles"),
    genres: one("genres"),
  };
}

/* ------------------------------------------------------------------ */
/* Tulis — anime                                                       */
/* ------------------------------------------------------------------ */

export interface AnimeWriteInput {
  slug: string;
  title: string;
  titleAlt?: string;
  tagline?: string;
  synopsis: string;
  type: string;
  status: string;
  year: number;
  season?: string;
  studio: string;
  score: number;
  rating: string;
  totalEpisodes: number;
  durationMinutes: number;
  broadcastDay?: string;
  broadcastTime?: string;
  paletteFrom: string;
  paletteTo: string;
  motif?: string;
  poster?: string;
  banner?: string;
  featured: boolean;
  tags: string[];
  relatedSlugs: string[];
  genres: string[];
  published: boolean;
}

const slugIsValid = (slug: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

export function validateSlug(slug: string): string | null {
  if (!slug) return "Slug wajib diisi.";
  if (!slugIsValid(slug))
    return "Slug hanya boleh huruf kecil, angka, dan tanda hubung (-).";
  return null;
}

function ensureGenres(names: string[]): number[] {
  const db = getDb();
  const clean = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  const ids: number[] = [];

  const insert = db.prepare(
    `INSERT INTO genres (name, slug) VALUES (?, ?)
     ON CONFLICT(name) DO NOTHING`,
  );
  const find = db.prepare(`SELECT id FROM genres WHERE name = ?`);

  for (const name of clean) {
    insert.run(name, genreSlug(name));
    const row = find.get(name) as { id: number } | undefined;
    if (row) ids.push(row.id);
  }
  return ids;
}

export function createOrUpdateAnime(input: AnimeWriteInput): string {
  const db = getDb();
  const now = new Date().toISOString();

  return transaction(() => {
    const existing = db
      .prepare(`SELECT id FROM anime WHERE slug = ?`)
      .get(input.slug) as { id: string } | undefined;

    const id = existing?.id ?? `anime-${Date.now().toString(36)}`;

    db.prepare(
      `INSERT INTO anime (
         id, slug, title, title_alt, tagline, synopsis, type, status, year, season,
         studio, score, rating, total_episodes, duration_minutes, broadcast_day,
         broadcast_time, palette_from, palette_to, motif, poster, banner, featured,
         published, tags, related_slugs, created_at, updated_at
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(slug) DO UPDATE SET
         title = excluded.title,
         title_alt = excluded.title_alt,
         tagline = excluded.tagline,
         synopsis = excluded.synopsis,
         type = excluded.type,
         status = excluded.status,
         year = excluded.year,
         season = excluded.season,
         studio = excluded.studio,
         score = excluded.score,
         rating = excluded.rating,
         total_episodes = excluded.total_episodes,
         duration_minutes = excluded.duration_minutes,
         broadcast_day = excluded.broadcast_day,
         broadcast_time = excluded.broadcast_time,
         palette_from = excluded.palette_from,
         palette_to = excluded.palette_to,
         motif = excluded.motif,
         poster = excluded.poster,
         banner = excluded.banner,
         featured = excluded.featured,
         published = excluded.published,
         tags = excluded.tags,
         related_slugs = excluded.related_slugs,
         updated_at = excluded.updated_at`,
    ).run(
      id,
      input.slug,
      input.title,
      input.titleAlt ?? null,
      input.tagline ?? null,
      input.synopsis,
      input.type,
      input.status,
      input.year,
      input.season ?? null,
      input.studio,
      input.score,
      input.rating,
      input.totalEpisodes,
      input.durationMinutes,
      input.broadcastDay ?? null,
      input.broadcastTime ?? null,
      input.paletteFrom,
      input.paletteTo,
      input.motif ?? null,
      input.poster ?? null,
      input.banner ?? null,
      input.featured ? 1 : 0,
      input.published ? 1 : 0,
      joinCsv(input.tags),
      joinCsv(input.relatedSlugs),
      now,
      now,
    );

    const genreIds = ensureGenres(input.genres);
    db.prepare(`DELETE FROM anime_genres WHERE anime_id = ?`).run(id);
    const link = db.prepare(
      `INSERT INTO anime_genres (anime_id, genre_id) VALUES (?, ?)
       ON CONFLICT(anime_id, genre_id) DO NOTHING`,
    );
    for (const genreId of genreIds) link.run(id, genreId);

    return id;
  });
}

export function deleteAnime(slug: string): void {
  getDb().prepare(`DELETE FROM anime WHERE slug = ?`).run(slug);
}

/* ------------------------------------------------------------------ */
/* Tulis — episode                                                     */
/* ------------------------------------------------------------------ */

export interface EpisodeWriteInput {
  id?: number;
  animeSlug: string;
  number: number;
  title: string;
  duration: number;
  releasedAt: string;
  synopsis?: string;
  filler?: boolean;
}

export function saveEpisode(input: EpisodeWriteInput): number {
  const db = getDb();
  const anime = db
    .prepare(`SELECT id FROM anime WHERE slug = ?`)
    .get(input.animeSlug) as { id: string } | undefined;
  if (!anime) throw new Error(`Anime "${input.animeSlug}" tidak ditemukan.`);

  const releasedAt = input.releasedAt || new Date().toISOString();

  if (input.id && input.id > 0) {
    db.prepare(
      `UPDATE episodes
          SET number = ?, title = ?, duration = ?, released_at = ?,
              synopsis = ?, filler = ?
        WHERE id = ?`,
    ).run(
      input.number,
      input.title,
      input.duration,
      releasedAt,
      input.synopsis ?? null,
      input.filler ? 1 : 0,
      input.id,
    );
    return input.id;
  }

  db.prepare(
    `INSERT INTO episodes (anime_id, number, title, duration, released_at, synopsis, filler)
     VALUES (?,?,?,?,?,?,?)
     ON CONFLICT(anime_id, number) DO UPDATE SET
       title = excluded.title,
       duration = excluded.duration,
       released_at = excluded.released_at,
       synopsis = excluded.synopsis,
       filler = excluded.filler`,
  ).run(
    anime.id,
    input.number,
    input.title,
    input.duration,
    releasedAt,
    input.synopsis ?? null,
    input.filler ? 1 : 0,
  );

  const row = db
    .prepare(`SELECT id FROM episodes WHERE anime_id = ? AND number = ?`)
    .get(anime.id, input.number) as { id: number };
  return row.id;
}

export function deleteEpisode(id: number): void {
  getDb().prepare(`DELETE FROM episodes WHERE id = ?`).run(id);
}

/* ------------------------------------------------------------------ */
/* Tulis — server streaming & subtitle                                 */
/* ------------------------------------------------------------------ */

export interface ServerWriteInput {
  episodeId: number;
  label: string;
  type: string;
  url: string;
  quality: string;
  note?: string;
}

export function addServer(input: ServerWriteInput): number {
  const db = getDb();
  const row = db
    .prepare(`SELECT COALESCE(MAX(position), -1) + 1 AS next FROM servers WHERE episode_id = ?`)
    .get(input.episodeId) as { next: number };

  const result = db
    .prepare(
      `INSERT INTO servers (episode_id, label, type, url, quality, note, position)
       VALUES (?,?,?,?,?,?,?)`,
    )
    .run(
      input.episodeId,
      input.label,
      toServerType(input.type),
      input.url,
      input.quality,
      input.note ?? null,
      row.next,
    );

  return Number(result.lastInsertRowid);
}

export function deleteServer(id: number): void {
  getDb().prepare(`DELETE FROM servers WHERE id = ?`).run(id);
}

export interface SubtitleWriteInput {
  episodeId: number;
  lang: string;
  label: string;
  src: string;
  isDefault?: boolean;
}

export function addSubtitle(input: SubtitleWriteInput): number {
  const db = getDb();
  if (input.isDefault) {
    db.prepare(`UPDATE subtitles SET is_default = 0 WHERE episode_id = ?`).run(
      input.episodeId,
    );
  }
  const result = db
    .prepare(
      `INSERT INTO subtitles (episode_id, lang, label, src, is_default)
       VALUES (?,?,?,?,?)`,
    )
    .run(
      input.episodeId,
      input.lang,
      input.label,
      input.src,
      input.isDefault ? 1 : 0,
    );
  return Number(result.lastInsertRowid);
}

export function deleteSubtitle(id: number): void {
  getDb().prepare(`DELETE FROM subtitles WHERE id = ?`).run(id);
}
