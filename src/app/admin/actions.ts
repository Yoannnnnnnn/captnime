"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  addServer,
  addSubtitle,
  createOrUpdateAnime,
  deleteAnime,
  deleteEpisode,
  deleteServer,
  deleteSubtitle,
  saveEpisode,
  uniqueSlug,
  validateSlug,
} from "@/lib/db/repository";
import { getAnimeById } from "@/lib/metadata/anilist";
import { databaseProvider } from "@/lib/providers/database";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
  checkPassword,
  createSessionValue,
  requireAdmin,
} from "@/lib/auth";

/* ------------------------------------------------------------------ */
/* Sesi                                                               */
/* ------------------------------------------------------------------ */

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    redirect("/admin/login?error=1");
  }

  const store = await cookies();
  const proto = (await headers()).get("x-forwarded-proto");
  store.set(ADMIN_COOKIE, createSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    // Hanya tandai Secure bila permintaan benar-benar lewat HTTPS, supaya
    // login tetap bisa dipakai pada `npm start` di http://localhost.
    secure: proto === "https",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/admin");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ */
/* Bantuan                                                            */
/* ------------------------------------------------------------------ */

const str = (fd: FormData, key: string, fallback = "") =>
  String(fd.get(key) ?? fallback).trim();

const num = (fd: FormData, key: string, fallback = 0) => {
  const value = Number(fd.get(key));
  return Number.isFinite(value) ? value : fallback;
};

const list = (fd: FormData, key: string) =>
  str(fd, key)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Segarkan cache provider + halaman yang menampilkan data. */
function refresh(slug?: string) {
  databaseProvider.invalidate();
  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/schedule");
  revalidatePath("/my-list");
  revalidatePath("/admin");
  if (slug) {
    revalidatePath(`/anime/${slug}`);
    revalidatePath("/watch/[slug]/[episode]", "page");
  }
}

/* ------------------------------------------------------------------ */
/* Anime                                                              */
/* ------------------------------------------------------------------ */

export async function saveAnimeAction(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "slug");
  const slugError = validateSlug(slug);
  if (slugError) redirect(`/admin/anime/${slug || "baru"}?error=slug`);

  const originalSlug = str(formData, "originalSlug");
  if (originalSlug && originalSlug !== slug) {
    // Slug diganti: hapus baris lama agar tidak muncul dua judul.
    deleteAnime(originalSlug);
  }

  createOrUpdateAnime({
    slug,
    title: str(formData, "title", "Tanpa Judul"),
    titleAlt: str(formData, "titleAlt") || undefined,
    tagline: str(formData, "tagline") || undefined,
    synopsis: str(formData, "synopsis"),
    type: str(formData, "type", "TV"),
    status: str(formData, "status", "completed"),
    year: num(formData, "year", new Date().getFullYear()),
    season: str(formData, "season") || undefined,
    studio: str(formData, "studio", "—"),
    score: num(formData, "score", 0),
    rating: str(formData, "rating", "13+"),
    totalEpisodes: num(formData, "totalEpisodes", 12),
    durationMinutes: num(formData, "durationMinutes", 24),
    broadcastDay: str(formData, "broadcastDay") || undefined,
    broadcastTime: str(formData, "broadcastTime") || undefined,
    paletteFrom: str(formData, "paletteFrom", "#1b1b2f"),
    paletteTo: str(formData, "paletteTo", "#ff3d68"),
    motif: str(formData, "motif") || undefined,
    poster: str(formData, "poster") || undefined,
    banner: str(formData, "banner") || undefined,
    featured: formData.get("featured") === "on",
    tags: list(formData, "tags"),
    relatedSlugs: list(formData, "relatedSlugs"),
    genres: [
      ...formData.getAll("genres").map((value) => String(value).trim()),
      ...list(formData, "genresExtra"),
    ],
    published: formData.get("published") === "on",
  });

  refresh(slug);
  redirect(`/admin/anime/${slug}?saved=1`);
}

export async function deleteAnimeAction(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "slug");
  deleteAnime(slug);
  refresh(slug);
  redirect("/admin");
}

/* ------------------------------------------------------------------ */
/* Impor metadata                                                     */
/* ------------------------------------------------------------------ */

/**
 * Buat draf judul dari metadata AniList (tanpa episode & server).
 * Video tetap diisi manual: embed resmi atau berkas milik sendiri.
 */
export async function importAnimeAction(formData: FormData) {
  await requireAdmin();

  const id = num(formData, "anilistId", 0);
  const term = str(formData, "q");
  if (!id) redirect(`/admin/impor?error=id${term ? `&q=${encodeURIComponent(term)}` : ""}`);

  const result = await getAnimeById(id);
  if (!result.ok || !result.data) {
    redirect(
      `/admin/impor?error=fetch${term ? `&q=${encodeURIComponent(term)}` : ""}`,
    );
  }

  const draft = result.data;
  const slug = uniqueSlug(draft.title);

  createOrUpdateAnime({
    slug,
    title: draft.title,
    titleAlt: draft.titleAlt,
    synopsis: draft.synopsis,
    type: draft.type,
    status: draft.status,
    year: draft.year,
    season: draft.season,
    studio: draft.studio,
    score: draft.score,
    rating: draft.rating,
    totalEpisodes: draft.totalEpisodes,
    durationMinutes: draft.durationMinutes,
    paletteFrom: draft.palette[0],
    paletteTo: draft.palette[1],
    motif: draft.motif,
    poster: draft.poster,
    banner: draft.banner,
    featured: false,
    tags: ["Impor AniList", draft.sourceUrl ? `Sumber: ${draft.sourceUrl}` : ""].filter(Boolean),
    relatedSlugs: [],
    genres: draft.genres,
    // Draf: sengaja belum terbit sampai admin menambahkan episode + sumber video.
    published: false,
  });

  refresh(slug);
  redirect(`/admin/anime/${slug}?saved=1`);
}

/* ------------------------------------------------------------------ */
/* Episode                                                            */
/* ------------------------------------------------------------------ */

export async function saveEpisodeAction(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "animeSlug");
  const id = num(formData, "episodeId", 0);

  const releasedAt = str(formData, "releasedAt");

  saveEpisode({
    id: id > 0 ? id : undefined,
    animeSlug: slug,
    number: num(formData, "number", 1),
    title: str(formData, "title", "Episode"),
    duration: num(formData, "duration", 1440),
    releasedAt:
      releasedAt.length === 10
        ? `${releasedAt}T00:00:00.000Z`
        : releasedAt || new Date().toISOString(),
    synopsis: str(formData, "synopsis") || undefined,
    filler: formData.get("filler") === "on",
  });

  refresh(slug);
  redirect(`/admin/anime/${slug}#episode`);
}

export async function deleteEpisodeAction(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "animeSlug");
  deleteEpisode(num(formData, "episodeId", 0));
  refresh(slug);
  redirect(`/admin/anime/${slug}#episode`);
}

/* ------------------------------------------------------------------ */
/* Server streaming & subtitle                                        */
/* ------------------------------------------------------------------ */

export async function addServerAction(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "animeSlug");
  addServer({
    episodeId: num(formData, "episodeId", 0),
    label: str(formData, "label", "Server"),
    type: str(formData, "type", "hls"),
    url: str(formData, "url"),
    quality: str(formData, "quality", "auto"),
    note: str(formData, "note") || undefined,
  });
  refresh(slug);
  redirect(`/admin/anime/${slug}#episode`);
}

export async function deleteServerAction(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "animeSlug");
  deleteServer(num(formData, "serverId", 0));
  refresh(slug);
  redirect(`/admin/anime/${slug}#episode`);
}

export async function addSubtitleAction(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "animeSlug");
  addSubtitle({
    episodeId: num(formData, "episodeId", 0),
    lang: str(formData, "lang", "id"),
    label: str(formData, "label", "Indonesia"),
    src: str(formData, "src"),
    isDefault: formData.get("isDefault") === "on",
  });
  refresh(slug);
  redirect(`/admin/anime/${slug}#episode`);
}

export async function deleteSubtitleAction(formData: FormData) {
  await requireAdmin();
  const slug = str(formData, "animeSlug");
  deleteSubtitle(num(formData, "subtitleId", 0));
  refresh(slug);
  redirect(`/admin/anime/${slug}#episode`);
}
