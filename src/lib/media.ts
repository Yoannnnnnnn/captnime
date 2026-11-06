import type { StreamServer } from "@/lib/types";

/**
 * Utilitas sumber video.
 *
 * Tiga bentuk sumber yang didukung:
 *   hls    — manifest .m3u8 (hls.js / Safari native)
 *   mp4    — berkas progresif
 *   embed  — halaman pemutar pihak ketiga di dalam <iframe>
 *            (YouTube resmi, Vimeo, Dailymotion, Bilibili, OK.ru, VK)
 *
 * Embed dipakai untuk konten yang memang dipublikasikan pemiliknya di
 * platform tersebut — bukan untuk menyelundupkan stream berhak cipta.
 */

/** Host yang boleh dimuat sebagai iframe. Selain ini ditolak. */
const EMBED_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "player.vimeo.com",
  "vimeo.com",
  "dailymotion.com",
  "www.dailymotion.com",
  "dai.ly",
  "player.bilibili.com",
  "bilibili.com",
  "www.bilibili.com",
  "ok.ru",
  "www.ok.ru",
  "vk.com",
  "vkvideo.ru",
];

function hostAllowed(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return EMBED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

/** Ubah URL tonton biasa menjadi URL embed agar bisa dipasang di <iframe>. */
export function normalizeEmbedUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!hostAllowed(url)) return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");

  // YouTube: watch?v=ID | youtu.be/ID | shorts/ID | embed/ID
  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "youtu.be") {
    let id = url.searchParams.get("v");
    if (!id && host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (!id) {
      const m = url.pathname.match(/\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{6,})/);
      if (m) id = m[1];
    }
    if (!id || !/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  }

  // Vimeo: vimeo.com/ID → player.vimeo.com/video/ID
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    if (!id || !/^\d+$/.test(id)) return null;
    return `https://player.vimeo.com/video/${id}`;
  }

  // Dailymotion: dailymotion.com/video/ID | dai.ly/ID
  if (host === "dailymotion.com" || host === "dai.ly") {
    const parts = url.pathname.split("/").filter(Boolean);
    const id = host === "dai.ly" ? parts[0] : parts[parts.length - 1];
    if (!id) return null;
    return `https://www.dailymotion.com/embed/video/${id}`;
  }

  // Bilibili: bilibili.com/video/BVxxx → player.bilibili.com/player.html?bvid=
  if (host === "bilibili.com") {
    const m = url.pathname.match(/\/video\/(BV[A-Za-z0-9]+)/);
    if (!m) return null;
    return `https://player.bilibili.com/player.html?bvid=${m[1]}&high_quality=1`;
  }

  // Selain pola di atas, izinkan hanya bila sudah berupa halaman embed.
  return url.toString();
}

export function isEmbedUrlAllowed(raw: string): boolean {
  return normalizeEmbedUrl(raw) !== null;
}

/**
 * Tempelkan CDN di depan path relatif seperti `/videos/ep1/master.m3u8`.
 *
 * Dengan begitu pindah dari berkas lokal ke R2/Bunny cukup mengganti
 * `CAPTNIME_MEDIA_BASE_URL`, tanpa menyentuh isi database.
 * Hanya dipakai di server (membaca env).
 */
export function resolveMediaUrl(url: string): string {
  const base = process.env.CAPTNIME_MEDIA_BASE_URL?.trim();
  if (!base) return url;
  if (!url.startsWith("/")) return url;
  return `${base.replace(/\/+$/, "")}${url}`;
}

/** Siapkan daftar server sebelum dikirim ke pemutar (khusus server component). */
export function prepareServers(servers: StreamServer[]): StreamServer[] {
  return servers.map((server) => {
    if (server.type === "embed") {
      const normalized = normalizeEmbedUrl(server.url);
      return normalized ? { ...server, url: normalized } : server;
    }
    return { ...server, url: resolveMediaUrl(server.url) };
  });
}
