-- =============================================================================
-- Skema Captnime (Fase 1 — CMS)
-- =============================================================================
-- Sengaja memakai tipe portabel (TEXT/INTEGER/REAL) dan sintaks yang mudah
-- diterjemahkan ke Postgres:
--   * TEXT       -> TEXT / VARCHAR
--   * INTEGER    -> INTEGER
--   * REAL       -> DOUBLE PRECISION / NUMERIC
--   * datetime('now')  -> now()
--   * AUTOINCREMENT    -> GENERATED ALWAYS AS IDENTITY
-- Lihat docs/DATABASE.md untuk panduan pindah ke Postgres.
-- =============================================================================

CREATE TABLE IF NOT EXISTS anime (
  id                TEXT PRIMARY KEY,
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  title_alt         TEXT,
  tagline           TEXT,
  synopsis          TEXT NOT NULL DEFAULT '',
  type              TEXT NOT NULL DEFAULT 'TV',
  status            TEXT NOT NULL DEFAULT 'completed',
  year              INTEGER NOT NULL DEFAULT 2026,
  season            TEXT,
  studio            TEXT NOT NULL DEFAULT '',
  score             REAL NOT NULL DEFAULT 0,
  rating            TEXT NOT NULL DEFAULT '13+',
  total_episodes    INTEGER NOT NULL DEFAULT 0,
  duration_minutes  INTEGER NOT NULL DEFAULT 24,
  broadcast_day     TEXT,
  broadcast_time    TEXT,
  palette_from      TEXT NOT NULL DEFAULT '#1b1b2f',
  palette_to        TEXT NOT NULL DEFAULT '#ff3d68',
  motif             TEXT,
  poster            TEXT,
  banner            TEXT,
  featured          INTEGER NOT NULL DEFAULT 0,
  published         INTEGER NOT NULL DEFAULT 1,
  tags              TEXT NOT NULL DEFAULT '',
  related_slugs     TEXT NOT NULL DEFAULT '',
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS genres (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE,
  slug  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS anime_genres (
  anime_id  TEXT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  genre_id  INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (anime_id, genre_id)
);

CREATE TABLE IF NOT EXISTS episodes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  anime_id     TEXT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
  number       INTEGER NOT NULL,
  title        TEXT NOT NULL DEFAULT '',
  duration     INTEGER NOT NULL DEFAULT 1440,
  released_at  TEXT NOT NULL DEFAULT (datetime('now')),
  synopsis     TEXT,
  thumbnail    TEXT,
  filler       INTEGER NOT NULL DEFAULT 0,
  UNIQUE (anime_id, number)
);

CREATE TABLE IF NOT EXISTS servers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  episode_id  INTEGER NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'hls',
  url         TEXT NOT NULL,
  quality     TEXT NOT NULL DEFAULT 'auto',
  note        TEXT,
  position    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subtitles (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  episode_id   INTEGER NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  lang         TEXT NOT NULL DEFAULT 'id',
  label        TEXT NOT NULL DEFAULT 'Indonesia',
  src          TEXT NOT NULL,
  is_default   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_anime_status      ON anime(status);
CREATE INDEX IF NOT EXISTS idx_anime_published   ON anime(published);
CREATE INDEX IF NOT EXISTS idx_anime_updated     ON anime(updated_at);
CREATE INDEX IF NOT EXISTS idx_episodes_anime    ON episodes(anime_id, number);
CREATE INDEX IF NOT EXISTS idx_servers_episode   ON servers(episode_id);
CREATE INDEX IF NOT EXISTS idx_subtitles_episode ON subtitles(episode_id);
CREATE INDEX IF NOT EXISTS idx_anime_genres_genre ON anime_genres(genre_id);

-- =============================================================================
-- Fase 2 — akun pengguna
-- =============================================================================
-- Password disimpan sebagai hash scrypt (format: scrypt$N$salt$hash) oleh
-- node:crypto; token sesi disimpan sebagai SHA-256, bukan nilai mentahnya.
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,   -- selalu huruf kecil
  name           TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,          -- sha256(token mentah di cookie)
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  INTEGER NOT NULL,          -- epoch milidetik
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Riwayat tontonan: satu baris per judul (episode terakhir + posisi).
CREATE TABLE IF NOT EXISTS progress (
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anime_slug      TEXT NOT NULL,
  episode_number  INTEGER NOT NULL,
  position        INTEGER NOT NULL DEFAULT 0,   -- detik
  duration        INTEGER NOT NULL DEFAULT 0,   -- detik
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, anime_slug)
);

CREATE TABLE IF NOT EXISTS watchlist (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anime_slug  TEXT NOT NULL,
  added_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, anime_slug)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_progress_updated ON progress(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_added  ON watchlist(user_id, added_at DESC);
