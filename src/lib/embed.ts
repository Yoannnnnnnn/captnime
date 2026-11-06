/**
 * Helper embed yang aman dipakai di klien maupun server.
 *
 * Sengaja terpisah dari `lib/media.ts`: modul itu membaca env
 * (`CAPTNIME_MEDIA_BASE_URL`) dan hanya dipakai di server, sedangkan
 * komponen pemutar adalah client component. Berkas ini tidak menyentuh
 * `process.env` sama sekali.
 */

export type EmbedProvider =
  | "youtube"
  | "vimeo"
  | "dailymotion"
  | "bilibili"
  | "okru"
  | "vk"
  | "lainnya";

const LABELS: Record<EmbedProvider, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  dailymotion: "Dailymotion",
  bilibili: "Bilibili",
  okru: "OK.ru",
  vk: "VK",
  lainnya: "Embed",
};

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
  } catch {
    return null;
  }
}

export function embedProvider(url: string): EmbedProvider {
  const host = hostOf(url);
  if (!host) return "lainnya";
  if (host === "youtube-nocookie.com" || host === "youtube.com" || host === "youtu.be") {
    return "youtube";
  }
  if (host === "vimeo.com") return "vimeo";
  if (host === "dailymotion.com" || host === "dai.ly") return "dailymotion";
  if (host === "bilibili.com") return "bilibili";
  if (host === "ok.ru") return "okru";
  if (host === "vk.com" || host === "vkvideo.ru") return "vk";
  return "lainnya";
}

export function embedProviderLabel(url: string): string {
  return LABELS[embedProvider(url)];
}

/**
 * Tautan "buka di tab baru" untuk URL embed yang sudah dinormalkan.
 *
 * Berguna saat sebuah kanal resmi mematikan opsi semat (embed): pemutar di
 * situs tidak bisa memutar, tetapi pengunjung tetap punya jalan ke halaman
 * aslinya. Mengembalikan `null` bila bentuk URL tidak dikenali.
 */
export function embedExternalUrl(url: string): string | null {
  const provider = embedProvider(url);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (provider === "youtube") {
    const m = parsed.pathname.match(/\/embed\/([A-Za-z0-9_-]{6,})/);
    if (m) return `https://www.youtube.com/watch?v=${m[1]}`;
    return null;
  }

  if (provider === "vimeo") {
    const m = parsed.pathname.match(/\/video\/(\d+)/);
    if (m) return `https://vimeo.com/${m[1]}`;
    return null;
  }

  if (provider === "dailymotion") {
    const m = parsed.pathname.match(/\/embed\/video\/([A-Za-z0-9]+)/);
    if (m) return `https://www.dailymotion.com/video/${m[1]}`;
    return null;
  }

  if (provider === "bilibili") {
    const bvid = parsed.searchParams.get("bvid");
    if (bvid) return `https://www.bilibili.com/video/${bvid}`;
    return null;
  }

  // OK.ru & VK: URL embed sudah tidak jauh dari halaman aslinya.
  return parsed.toString();
}
