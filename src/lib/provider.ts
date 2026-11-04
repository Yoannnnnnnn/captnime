import { LocalProvider } from "@/lib/providers/local";
import { RemoteProvider } from "@/lib/providers/remote";
import type { AnimeProvider } from "@/lib/types";

/**
 * Pemilihan provider cukup lewat environment variable — UI tidak berubah.
 *
 *   CAPTNIME_DATA_SOURCE=local        (default) seed katalog demo
 *   CAPTNIME_DATA_SOURCE=remote
 *   CAPTNIME_API_BASE_URL=https://api.contoh.com
 *   CAPTNIME_API_KEY=xxx              (opsional)
 */
let cached: AnimeProvider | null = null;

export function getProvider(): AnimeProvider {
  if (cached) return cached;

  const source = (process.env.CAPTNIME_DATA_SOURCE ?? "local").toLowerCase();
  const baseUrl = process.env.CAPTNIME_API_BASE_URL;

  if (source === "remote" && baseUrl) {
    cached = new RemoteProvider({
      baseUrl,
      apiKey: process.env.CAPTNIME_API_KEY,
      revalidate: Number(process.env.CAPTNIME_REVALIDATE ?? 60),
    });
  } else {
    cached = new LocalProvider();
  }

  return cached;
}

export const isDemoMode = () =>
  (process.env.CAPTNIME_DATA_SOURCE ?? "local").toLowerCase() !== "remote" ||
  !process.env.CAPTNIME_API_BASE_URL;

export type { AnimeProvider };
