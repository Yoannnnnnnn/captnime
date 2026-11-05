import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

/**
 * Koneksi SQLite tunggal (singleton) untuk seluruh proses Next.js.
 *
 * Disimpan di `globalThis` supaya hot-reload di mode dev tidak membuka puluhan
 * handle file. Mode WAL dipakai agar baca/tulis tidak saling mengunci.
 *
 * Lokasi database bisa diatur lewat env:
 *   CAPTNIME_DB_PATH=/var/data/captnime.db   (paling eksplisit)
 *   CAPTNIME_DATA_DIR=/var/data              (folder, nama file tetap)
 * default: <cwd>/data/captnime.db
 */

declare global {
  // eslint-disable-next-line no-var
  var __captnimeDb: DatabaseSync | undefined;
}

function schemaCandidates(): string[] {
  const list: string[] = [];
  if (process.env.CAPTNIME_SCHEMA_PATH) list.push(process.env.CAPTNIME_SCHEMA_PATH);

  const cwd = process.cwd();
  list.push(
    path.join(cwd, "src/lib/db/schema.sql"),
    path.join(cwd, ".next-build/server/chunks/schema.sql"),
    path.join(cwd, ".next/server/chunks/schema.sql"),
    path.join(cwd, "db/schema.sql"),
  );

  try {
    list.push(path.join(path.dirname(fileURLToPath(import.meta.url)), "schema.sql"));
  } catch {
    /* import.meta.url tidak selalu tersedia di bundel server */
  }

  return list;
}

function readSchema(): string {
  for (const candidate of schemaCandidates()) {
    if (fs.existsSync(candidate)) return fs.readFileSync(candidate, "utf8");
  }
  throw new Error(
    "schema.sql tidak ditemukan. Set CAPTNIME_SCHEMA_PATH ke lokasi schema.sql " +
      "(lihat docs/DATABASE.md).",
  );
}

export function dbLocation(): string {
  if (process.env.CAPTNIME_DB_PATH) return path.resolve(process.env.CAPTNIME_DB_PATH);
  const dir = process.env.CAPTNIME_DATA_DIR
    ? path.resolve(process.env.CAPTNIME_DATA_DIR)
    : path.join(process.cwd(), "data");
  return path.join(dir, "captnime.db");
}

export function getDb(): DatabaseSync {
  if (globalThis.__captnimeDb) return globalThis.__captnimeDb;

  const location = dbLocation();
  fs.mkdirSync(path.dirname(location), { recursive: true });

  const db = new DatabaseSync(location);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(readSchema());

  globalThis.__captnimeDb = db;
  return db;
}

/** True bila sudah ada minimal satu judul di tabel anime. */
export function isSeeded(): boolean {
  const row = getDb().prepare("SELECT COUNT(*) AS total FROM anime").get() as
    | { total: number }
    | undefined;
  return (row?.total ?? 0) > 0;
}

export type { DatabaseSync };
