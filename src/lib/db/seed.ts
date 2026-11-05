import { CATALOG } from "@/lib/data/catalog";
import { isSeeded } from "@/lib/db/client";
import {
  addServer,
  addSubtitle,
  createOrUpdateAnime,
  saveEpisode,
} from "@/lib/db/repository";

/**
 * Menyemai database dari katalog bawaan (18 judul orisinal) satu kali.
 *
 * Setelah tersemai, seluruh data dikelola lewat /admin — file katalog hanya
 * dipakai sebagai titik awal, bukan sumber kebenaran lagi.
 */
export function ensureSeeded(): void {
  if (isSeeded()) return;

  for (const anime of CATALOG) {
    createOrUpdateAnime({
      slug: anime.slug,
      title: anime.title,
      titleAlt: anime.titleAlt,
      tagline: anime.tagline,
      synopsis: anime.synopsis,
      type: anime.type,
      status: anime.status,
      year: anime.year,
      season: anime.season,
      studio: anime.studio,
      score: anime.score,
      rating: anime.rating,
      totalEpisodes: anime.totalEpisodes,
      durationMinutes: anime.durationMinutes,
      broadcastDay: anime.broadcastDay,
      broadcastTime: anime.broadcastTime,
      paletteFrom: anime.palette[0],
      paletteTo: anime.palette[1],
      motif: anime.motif,
      poster: anime.poster,
      banner: anime.banner,
      featured: Boolean(anime.featured),
      tags: anime.tags ?? [],
      relatedSlugs: anime.relatedSlugs ?? [],
      genres: anime.genres,
      published: true,
    });

    for (const episode of anime.episodes) {
      const episodeId = saveEpisode({
        animeSlug: anime.slug,
        number: episode.number,
        title: episode.title,
        duration: episode.duration,
        releasedAt: episode.releasedAt,
        synopsis: episode.synopsis,
        filler: Boolean(episode.filler),
      });

      for (const server of episode.servers) {
        addServer({
          episodeId,
          label: server.label,
          type: server.type,
          url: server.url,
          quality: server.quality,
          note: server.note,
        });
      }

      for (const subtitle of episode.subtitles) {
        addSubtitle({
          episodeId,
          lang: subtitle.lang,
          label: subtitle.label,
          src: subtitle.src,
          isDefault: Boolean(subtitle.default),
        });
      }
    }
  }
}
