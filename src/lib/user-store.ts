"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Penyimpanan data pengguna di perangkat (localStorage).
 * Cukup untuk MVP tanpa login. Ketika autentikasi ditambahkan, ganti
 * implementasi ini dengan API call — signature hook tetap sama.
 */

const PREFIX = "captnime:v1:";
const KEY_HISTORY = `${PREFIX}history`;
const KEY_WATCHLIST = `${PREFIX}watchlist`;

export interface HistoryEntry {
  slug: string;
  title: string;
  episode: number;
  /** detik */
  position: number;
  /** detik */
  duration: number;
  updatedAt: number;
  palette?: [string, string];
  motif?: string;
  poster?: string;
  totalEpisodes: number;
}

export interface WatchlistEntry {
  slug: string;
  title: string;
  addedAt: number;
  palette?: [string, string];
  motif?: string;
  poster?: string;
}

const MAX_HISTORY = 60;

/* ------------------------------------------------------------------ */
/* Core store                                                          */
/* ------------------------------------------------------------------ */

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(PREFIX)) emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota penuh / private mode — abaikan */
  }
  emit();
}

/* ------------------------------------------------------------------ */
/* History                                                             */
/* ------------------------------------------------------------------ */

// Cache snapshot agar referensi stabil (wajib untuk useSyncExternalStore).
let historyCache: HistoryEntry[] | null = null;
let historyRawCache: string | null = null;

function getHistorySnapshot(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY_HISTORY);
  if (raw === historyRawCache && historyCache) return historyCache;
  historyRawCache = raw;
  historyCache = readJSON<HistoryEntry[]>(KEY_HISTORY, []);
  return historyCache;
}

const EMPTY_HISTORY: HistoryEntry[] = [];
function getHistoryServerSnapshot(): HistoryEntry[] {
  return EMPTY_HISTORY;
}

export function useHistory(): HistoryEntry[] {
  return useSyncExternalStore(
    subscribe,
    getHistorySnapshot,
    getHistoryServerSnapshot,
  );
}

export function saveProgress(entry: Omit<HistoryEntry, "updatedAt">) {
  const current = getHistorySnapshot();
  const next = [
    { ...entry, updatedAt: Date.now() },
    ...current.filter((e) => e.slug !== entry.slug),
  ].slice(0, MAX_HISTORY);
  writeJSON(KEY_HISTORY, next);
}

export function getProgress(slug: string): HistoryEntry | undefined {
  return getHistorySnapshot().find((e) => e.slug === slug);
}

export function removeHistory(slug: string) {
  writeJSON(
    KEY_HISTORY,
    getHistorySnapshot().filter((e) => e.slug !== slug),
  );
}

export function clearHistory() {
  writeJSON(KEY_HISTORY, []);
}

/* ------------------------------------------------------------------ */
/* Watchlist                                                           */
/* ------------------------------------------------------------------ */

let watchlistCache: WatchlistEntry[] | null = null;
let watchlistRawCache: string | null = null;

function getWatchlistSnapshot(): WatchlistEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY_WATCHLIST);
  if (raw === watchlistRawCache && watchlistCache) return watchlistCache;
  watchlistRawCache = raw;
  watchlistCache = readJSON<WatchlistEntry[]>(KEY_WATCHLIST, []);
  return watchlistCache;
}

const EMPTY_WATCHLIST: WatchlistEntry[] = [];
function getWatchlistServerSnapshot(): WatchlistEntry[] {
  return EMPTY_WATCHLIST;
}

export function useWatchlist() {
  const items = useSyncExternalStore(
    subscribe,
    getWatchlistSnapshot,
    getWatchlistServerSnapshot,
  );

  const has = useCallback(
    (slug: string) => items.some((i) => i.slug === slug),
    [items],
  );

  const toggle = useCallback(
    (entry: Omit<WatchlistEntry, "addedAt">) => {
      const current = getWatchlistSnapshot();
      const exists = current.some((i) => i.slug === entry.slug);
      const next = exists
        ? current.filter((i) => i.slug !== entry.slug)
        : [{ ...entry, addedAt: Date.now() }, ...current];
      writeJSON(KEY_WATCHLIST, next);
      return !exists;
    },
    [],
  );

  const remove = useCallback((slug: string) => {
    writeJSON(
      KEY_WATCHLIST,
      getWatchlistSnapshot().filter((i) => i.slug !== slug),
    );
  }, []);

  return { items, has, toggle, remove };
}
