"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Penyimpanan data pengguna: riwayat tontonan + daftar tonton.
 *
 * Dua mode, API hook-nya sama sehingga komponen tidak perlu tahu bedanya:
 *
 * 1. Tamu      — `localStorage`, tanpa akun (perilaku lama, tetap didukung).
 * 2. Login     — tabel `progress` & `watchlist` di server lewat /api/me/*.
 *
 * `SessionProvider` memanggil `setRemoteUser(userId)` saat sesi diketahui.
 * Saat pertama kali masuk, data tamu disalin ke akun (server yang lebih baru
 * menang), lalu kunci localStorage dibersihkan agar tidak dobel.
 */

const PREFIX = "captnime:v1:";
const KEY_HISTORY = `${PREFIX}history`;
const KEY_WATCHLIST = `${PREFIX}watchlist`;
const KEY_IMPORTED = (userId: string) => `${PREFIX}imported:${userId}`;

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
/* Mode server                                                         */
/* ------------------------------------------------------------------ */

let remoteUserId: string | null = null;
let remoteHistory: HistoryEntry[] = [];
let remoteWatchlist: WatchlistEntry[] = [];
let remoteHydrated = false;

export function isRemote(): boolean {
  return remoteUserId !== null;
}

export function isRemoteHydrated(): boolean {
  return remoteHydrated;
}

function api(path: string, init: RequestInit) {
  return fetch(path, {
    credentials: "same-origin",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    ...init,
  }).catch(() => undefined);
}

async function refreshFromServer(): Promise<void> {
  const res = await fetch("/api/me/state", {
    credentials: "same-origin",
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) return;
  const data = (await res.json()) as {
    history?: HistoryEntry[];
    watchlist?: WatchlistEntry[];
  };
  remoteHistory = Array.isArray(data.history) ? data.history : [];
  remoteWatchlist = Array.isArray(data.watchlist) ? data.watchlist : [];
  remoteHydrated = true;
  emit();
}

/** Salin data tamu ke akun sekali per pengguna, lalu bersihkan lokal. */
async function importGuestData(): Promise<void> {
  if (!remoteUserId || typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(KEY_IMPORTED(remoteUserId))) return;
  } catch {
    return;
  }

  const history = readJSON<HistoryEntry[]>(KEY_HISTORY, []);
  const watchlist = readJSON<WatchlistEntry[]>(KEY_WATCHLIST, []);
  if (history.length === 0 && watchlist.length === 0) return;

  const res = await api("/api/me/import", {
    method: "POST",
    body: JSON.stringify({ history, watchlist }),
  }).catch(() => undefined);

  if (res?.ok) {
    writeJSON(KEY_HISTORY, []);
    writeJSON(KEY_WATCHLIST, []);
    try {
      window.localStorage.setItem(KEY_IMPORTED(remoteUserId), String(Date.now()));
    } catch {
      /* abaikan */
    }
    await refreshFromServer();
  }
}

/**
 * Dipanggil SessionProvider saat sesi berubah.
 * Memberi `null` mengembalikan store ke mode tamu.
 */
export async function setRemoteUser(userId: string | null): Promise<void> {
  remoteUserId = userId;
  if (!userId) {
    remoteHistory = [];
    remoteWatchlist = [];
    remoteHydrated = false;
    emit();
    return;
  }
  await refreshFromServer();
  await importGuestData();

  if (typeof window !== "undefined") {
    const flush = () => flushPendingProgress();
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
  }
}

/* ------------------------------------------------------------------ */
/* Riwayat                                                             */
/* ------------------------------------------------------------------ */

// Cache snapshot agar referensi stabil (wajib untuk useSyncExternalStore).
let historyCache: HistoryEntry[] | null = null;
let historyRawCache: string | null = null;

function localHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY_HISTORY);
  if (raw === historyRawCache && historyCache) return historyCache;
  historyRawCache = raw;
  historyCache = readJSON<HistoryEntry[]>(KEY_HISTORY, []);
  return historyCache;
}

const EMPTY_HISTORY: HistoryEntry[] = [];

function getHistorySnapshot(): HistoryEntry[] {
  return remoteUserId ? remoteHistory : localHistory();
}

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

/* ---- pengiriman progres dengan throttle (menghindari tulis tiap 5 detik) ---- */

const THROTTLE_MS = 15_000;
const pending = new Map<string, HistoryEntry>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const lastSent = new Map<string, number>();

function sendProgress(entry: HistoryEntry) {
  lastSent.set(entry.slug, Date.now());
  pending.delete(entry.slug);
  const timer = timers.get(entry.slug);
  if (timer) {
    clearTimeout(timer);
    timers.delete(entry.slug);
  }
  void api("/api/me/progress", {
    method: "PUT",
    body: JSON.stringify({
      slug: entry.slug,
      episode: entry.episode,
      position: Math.round(entry.position),
      duration: Math.round(entry.duration),
    }),
  });
}

export function flushPendingProgress() {
  for (const entry of Array.from(pending.values())) sendProgress(entry);
}

function queueProgress(entry: HistoryEntry) {
  const last = lastSent.get(entry.slug) ?? 0;
  const elapsed = Date.now() - last;
  if (elapsed >= THROTTLE_MS) {
    sendProgress(entry);
    return;
  }
  pending.set(entry.slug, entry);
  if (!timers.has(entry.slug)) {
    timers.set(
      entry.slug,
      setTimeout(() => {
        const queued = pending.get(entry.slug);
        timers.delete(entry.slug);
        if (queued) sendProgress(queued);
      }, THROTTLE_MS - elapsed),
    );
  }
}

export function saveProgress(entry: Omit<HistoryEntry, "updatedAt">) {
  const record: HistoryEntry = { ...entry, updatedAt: Date.now() };

  if (remoteUserId) {
    remoteHistory = [
      record,
      ...remoteHistory.filter((e) => e.slug !== record.slug),
    ].slice(0, MAX_HISTORY);
    emit();
    queueProgress(record);
    return;
  }

  const current = localHistory();
  writeJSON(KEY_HISTORY, [
    record,
    ...current.filter((e) => e.slug !== record.slug),
  ].slice(0, MAX_HISTORY));
}

export function getProgress(slug: string): HistoryEntry | undefined {
  return getHistorySnapshot().find((e) => e.slug === slug);
}

export function removeHistory(slug: string) {
  if (remoteUserId) {
    remoteHistory = remoteHistory.filter((e) => e.slug !== slug);
    emit();
    void api(`/api/me/progress?slug=${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
    return;
  }
  writeJSON(
    KEY_HISTORY,
    localHistory().filter((e) => e.slug !== slug),
  );
}

export function clearHistory() {
  if (remoteUserId) {
    remoteHistory = [];
    emit();
    void api("/api/me/progress?all=1", { method: "DELETE" });
    return;
  }
  writeJSON(KEY_HISTORY, []);
}

/* ------------------------------------------------------------------ */
/* Watchlist                                                           */
/* ------------------------------------------------------------------ */

let watchlistCache: WatchlistEntry[] | null = null;
let watchlistRawCache: string | null = null;

function localWatchlist(): WatchlistEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY_WATCHLIST);
  if (raw === watchlistRawCache && watchlistCache) return watchlistCache;
  watchlistRawCache = raw;
  watchlistCache = readJSON<WatchlistEntry[]>(KEY_WATCHLIST, []);
  return watchlistCache;
}

const EMPTY_WATCHLIST: WatchlistEntry[] = [];

function getWatchlistSnapshot(): WatchlistEntry[] {
  return remoteUserId ? remoteWatchlist : localWatchlist();
}

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
      const inListNow = getWatchlistSnapshot().some((i) => i.slug === entry.slug);

      if (remoteUserId) {
        remoteWatchlist = inListNow
          ? remoteWatchlist.filter((i) => i.slug !== entry.slug)
          : [{ ...entry, addedAt: Date.now() }, ...remoteWatchlist];
        emit();
        void api("/api/me/watchlist", {
          method: "POST",
          body: JSON.stringify({ slug: entry.slug, inList: !inListNow }),
        });
        return !inListNow;
      }

      const current = localWatchlist();
      writeJSON(
        KEY_WATCHLIST,
        inListNow
          ? current.filter((i) => i.slug !== entry.slug)
          : [{ ...entry, addedAt: Date.now() }, ...current],
      );
      return !inListNow;
    },
    [],
  );

  const remove = useCallback((slug: string) => {
    if (remoteUserId) {
      remoteWatchlist = remoteWatchlist.filter((i) => i.slug !== slug);
      emit();
      void api(`/api/me/watchlist?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      return;
    }
    writeJSON(
      KEY_WATCHLIST,
      localWatchlist().filter((i) => i.slug !== slug),
    );
  }, []);

  return { items, has, toggle, remove };
}
