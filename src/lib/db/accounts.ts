import { getDb } from "@/lib/db/client";

/**
 * Akses data akun pengguna: users, sessions, watchlist, progress.
 *
 * Semua query di sini tetap memakai SQL portabel (? placeholder, ON CONFLICT)
 * agar bisa dipindah ke Postgres bersama repository katalog.
 */

export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  recovery_hash: string | null;
  created_at: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface ProgressRow {
  animeSlug: string;
  episodeNumber: number;
  position: number;
  duration: number;
  updatedAt: string;
}

export interface WatchlistRow {
  animeSlug: string;
  addedAt: string;
}

interface RawProgress {
  anime_slug: string;
  episode_number: number;
  position: number;
  duration: number;
  updated_at: string;
}

interface RawWatchlist {
  anime_slug: string;
  added_at: string;
}

const toPublicUser = (row: UserRow): PublicUser => ({
  id: row.id,
  email: row.email,
  name: row.name,
  createdAt: row.created_at,
});

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------------------------------------------ */
/* Users                                                              */
/* ------------------------------------------------------------------ */

export function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): PublicUser {
  const db = getDb();
  const id = newId("user");
  db.prepare(
    `INSERT INTO users (id, email, name, password_hash) VALUES (?,?,?,?)`,
  ).run(id, input.email, input.name, input.passwordHash);

  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as
    | unknown as UserRow
    | undefined;
  if (!row) throw new Error("Gagal membuat pengguna.");
  return toPublicUser(row);
}

export function findUserByEmail(email: string): UserRow | null {
  const row = getDb()
    .prepare(`SELECT * FROM users WHERE email = ?`)
    .get(email.toLowerCase()) as unknown as UserRow | undefined;
  return row ?? null;
}

export function findUserById(id: string): PublicUser | null {
  const row = getDb().prepare(`SELECT * FROM users WHERE id = ?`).get(id) as unknown as
    | UserRow
    | undefined;
  return row ? toPublicUser(row) : null;
}

export function emailExists(email: string): boolean {
  return Boolean(findUserByEmail(email));
}

export function setPasswordHash(userId: string, hash: string): void {
  getDb().prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash, userId);
}

/** `null` menghapus kode pemulihan (dipakai setelah kode dipakai). */
export function setRecoveryHash(userId: string, hash: string | null): void {
  getDb().prepare(`UPDATE users SET recovery_hash = ? WHERE id = ?`).run(hash, userId);
}

export function deleteUser(userId: string): void {
  // sessions/progress/watchlist ikut terhapus lewat ON DELETE CASCADE.
  getDb().prepare(`DELETE FROM users WHERE id = ?`).run(userId);
}

export function countUsers(): number {
  return (
    getDb().prepare(`SELECT COUNT(*) AS total FROM users`).get() as {
      total: number;
    }
  ).total;
}

/* ------------------------------------------------------------------ */
/* Sessions                                                           */
/* ------------------------------------------------------------------ */

export function createSession(input: {
  tokenHash: string;
  userId: string;
  expiresAt: number;
}): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)
     ON CONFLICT(token_hash) DO UPDATE SET
       user_id = excluded.user_id,
       expires_at = excluded.expires_at`,
  ).run(input.tokenHash, input.userId, input.expiresAt);
}

export function findSessionUser(tokenHash: string): PublicUser | null {
  const row = getDb()
    .prepare(
      `SELECT u.* FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(tokenHash, Date.now()) as unknown as UserRow | undefined;
  return row ? toPublicUser(row) : null;
}

export function deleteSession(tokenHash: string): void {
  getDb().prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(tokenHash);
}

export function deleteUserSessions(userId: string): void {
  getDb().prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}

/** Keluarkan semua perangkat lain, sesi saat ini tetap hidup. */
export function deleteOtherSessions(userId: string, keepTokenHash: string): void {
  getDb()
    .prepare(`DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?`)
    .run(userId, keepTokenHash);
}

export function purgeExpiredSessions(): void {
  getDb().prepare(`DELETE FROM sessions WHERE expires_at <= ?`).run(Date.now());
}

/* ------------------------------------------------------------------ */
/* Watchlist                                                          */
/* ------------------------------------------------------------------ */

export function listWatchlist(userId: string, limit = 60): WatchlistRow[] {
  const rows = getDb()
    .prepare(
      `SELECT anime_slug, added_at FROM watchlist
        WHERE user_id = ? ORDER BY added_at DESC, rowid DESC LIMIT ?`,
    )
    .all(userId, limit) as unknown as RawWatchlist[];
  return rows.map((r) => ({ animeSlug: r.anime_slug, addedAt: r.added_at }));
}

export function hasWatchlist(userId: string, slug: string): boolean {
  return Boolean(
    getDb()
      .prepare(`SELECT 1 AS ok FROM watchlist WHERE user_id = ? AND anime_slug = ?`)
      .get(userId, slug),
  );
}

export function addWatchlist(userId: string, slug: string): void {
  getDb()
    .prepare(
      `INSERT INTO watchlist (user_id, anime_slug) VALUES (?,?)
       ON CONFLICT(user_id, anime_slug) DO NOTHING`,
    )
    .run(userId, slug);
}

export function removeWatchlist(userId: string, slug: string): void {
  getDb()
    .prepare(`DELETE FROM watchlist WHERE user_id = ? AND anime_slug = ?`)
    .run(userId, slug);
}

export function clearWatchlist(userId: string): void {
  getDb().prepare(`DELETE FROM watchlist WHERE user_id = ?`).run(userId);
}

/* ------------------------------------------------------------------ */
/* Progress                                                           */
/* ------------------------------------------------------------------ */

export function listProgress(userId: string, limit = 60): ProgressRow[] {
  const rows = getDb()
    .prepare(
      `SELECT anime_slug, episode_number, position, duration, updated_at
         FROM progress WHERE user_id = ?
        ORDER BY updated_at DESC, rowid DESC
        LIMIT ?`,
    )
    .all(userId, limit) as unknown as RawProgress[];
  return rows.map((r) => ({
    animeSlug: r.anime_slug,
    episodeNumber: r.episode_number,
    position: r.position,
    duration: r.duration,
    updatedAt: r.updated_at,
  }));
}

export function getProgress(userId: string, slug: string): ProgressRow | null {
  const row = getDb()
    .prepare(
      `SELECT anime_slug, episode_number, position, duration, updated_at
         FROM progress WHERE user_id = ? AND anime_slug = ?`,
    )
    .get(userId, slug) as unknown as RawProgress | undefined;
  return row
    ? {
        animeSlug: row.anime_slug,
        episodeNumber: row.episode_number,
        position: row.position,
        duration: row.duration,
        updatedAt: row.updated_at,
      }
    : null;
}

export function upsertProgress(input: {
  userId: string;
  slug: string;
  episodeNumber: number;
  position: number;
  duration: number;
}): void {
  getDb()
    .prepare(
      `INSERT INTO progress (user_id, anime_slug, episode_number, position, duration, updated_at)
       VALUES (?,?,?,?,?,?)
       ON CONFLICT(user_id, anime_slug) DO UPDATE SET
         episode_number = excluded.episode_number,
         position = excluded.position,
         duration = excluded.duration,
         updated_at = excluded.updated_at`,
    )
    .run(
      input.userId,
      input.slug,
      Math.max(1, Math.trunc(input.episodeNumber)),
      Math.max(0, Math.trunc(input.position)),
      Math.max(0, Math.trunc(input.duration)),
      new Date().toISOString(),
    );
}

export function removeProgress(userId: string, slug: string): void {
  getDb()
    .prepare(`DELETE FROM progress WHERE user_id = ? AND anime_slug = ?`)
    .run(userId, slug);
}

export function clearProgress(userId: string): void {
  getDb().prepare(`DELETE FROM progress WHERE user_id = ?`).run(userId);
}

export function accountStats(userId: string): {
  watchlist: number;
  progress: number;
} {
  const db = getDb();
  return {
    watchlist: (
      db.prepare(`SELECT COUNT(*) AS total FROM watchlist WHERE user_id = ?`).get(userId) as {
        total: number;
      }
    ).total,
    progress: (
      db.prepare(`SELECT COUNT(*) AS total FROM progress WHERE user_id = ?`).get(userId) as {
        total: number;
      }
    ).total,
  };
}
