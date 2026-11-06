import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAdminAnime, getAllGenres } from "@/lib/db/repository";
import { deleteAnimeAction, syncScheduleAction } from "@/app/admin/actions";
import { AnimeForm } from "@/components/admin/anime-form";
import { EpisodeManager } from "@/components/admin/episode-manager";
import { Badge, Notice, Panel, btnDanger, btnGhost } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

/** Pesan untuk penolakan penambahan server (lihat addServerAction). */
const SERVER_ERRORS: Record<string, string> = {
  "url-kosong": "URL server wajib diisi.",
  "berkas-kosong": "Pilih berkas dulu sebelum menekan Unggah.",
  "berkas-jenis":
    "Jenis berkas tidak didukung. Video: mp4, m4v, webm, ogv, mov. Subtitle: vtt, srt, ass.",
  "berkas-terlalu-besar":
    "Berkas terlalu besar. Batas diatur lewat CAPTNIME_UPLOAD_MAX_MB (default 512 MB).",
  "berkas-gagal": "Berkas gagal disimpan. Periksa izin tulis folder unggahan di server.",
  "episode-tidak-valid":
    "Episode tidak ditemukan pada judul ini — mungkin sudah dihapus di tab lain. Muat ulang halaman lalu coba lagi.",
  "jenis-server": "Jenis server tidak dikenal. Pilih hls, mp4, atau embed.",
  "embed-tak-dikenal":
    "URL embed tidak dikenali. Yang diizinkan: YouTube/Vimeo/Dailymotion/Bilibili/OK.ru/VK resmi — tempel tautan halaman tontonnya, bukan kode semat.",
  "hls-bukan-m3u8":
    "Server bertipe hls harus menunjuk berkas manifest .m3u8. Untuk berkas video langsung, pilih tipe mp4.",
  "url-tidak-valid":
    "URL mp4 harus berupa alamat http(s) atau path yang diawali garis miring.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Kelola ${slug}`, robots: { index: false, follow: false } };
}

export default async function AdminAnimePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const record = getAdminAnime(slug);
  if (!record) notFound();

  const genres = getAllGenres();
  const flag = (key: string) => (Array.isArray(sp[key]) ? sp[key][0] : sp[key]);
  const saved = flag("saved") === "1";
  const synced = flag("synced") === "1";
  const syncError = flag("error");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-[12.5px] text-text-3 hover:text-gold"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Daftar judul
        </Link>
        <span className="font-mono text-[11px] text-text-3">/anime/{record.anime.slug}</span>
      </div>

      {synced ? <Notice tone="ok">Jadwal tayang diperbarui dari AniList.</Notice> : null}
      {flag("unggah") === "ok" ? (
        <Notice tone="ok">
          Berkas tersimpan. Video muncul sebagai server mp4, subtitle sebagai track Indonesia
          (default) — tautan putarnya kedaluwarsa 6 jam; muat ulang halaman tonton bila lewat.
        </Notice>
      ) : null}
      {SERVER_ERRORS[syncError ?? ""] ? (
        <Notice tone="error">{SERVER_ERRORS[syncError as string]}</Notice>
      ) : null}
      {syncError === "sync" ? (
        <Notice tone="error">
          Gagal mengambil jadwal dari AniList. Periksa koneksi server atau coba lagi nanti.
        </Notice>
      ) : null}
      {syncError === "jadwal" ? (
        <Notice tone="error">
          AniList tidak memberi jadwal tayang untuk judul ini (biasanya karena sudah
          tamat atau belum diumumkan).
        </Notice>
      ) : null}

      <Panel
        index="00"
        title="Jadwal tayang"
        description="Dipakai halaman /schedule. Bisa diisi manual di formulir di bawah, atau disinkronkan dari AniList."
      >
        <div className="flex flex-wrap items-center gap-3">
          {record.anime.broadcastDay ? (
            <Badge tone="mint">
              {record.anime.broadcastDay} · {record.anime.broadcastTime ?? "—"}
            </Badge>
          ) : (
            <Badge tone="coral">Belum ada jadwal</Badge>
          )}

          {record.anilistId ? (
            <form action={syncScheduleAction}>
              <input type="hidden" name="slug" value={record.anime.slug} />
              <input type="hidden" name="anilistId" value={record.anilistId} />
              <button type="submit" className={btnGhost}>
                Sinkronkan dari AniList
              </button>
            </form>
          ) : (
            <p className="text-[12px] text-text-3">
              Judul ini belum tertaut ke AniList. Impor ulang lewat{" "}
              <a href="/admin/impor" className="text-text-2 underline underline-offset-4">
                Impor metadata
              </a>{" "}
              agar jadwal bisa disinkronkan otomatis.
            </p>
          )}

          {record.anilistId ? (
            <span className="font-mono text-[11px] text-text-3">
              AniList #{record.anilistId}
            </span>
          ) : null}
        </div>
      </Panel>

      <AnimeForm
        anime={record.anime}
        genres={genres}
        saved={saved}
        published={record.published}
      />

      <EpisodeManager slug={record.anime.slug} episodes={record.episodeRows} />

      <Panel
        index="09"
        title="Zona berbahaya"
        description="Menghapus judul juga menghapus seluruh episode, server, dan subtitle-nya."
      >
        <div className="flex flex-wrap items-center gap-3">
          <form action={deleteAnimeAction}>
            <input type="hidden" name="slug" value={record.anime.slug} />
            <button type="submit" className={btnDanger}>
              Hapus “{record.anime.title}” permanen
            </button>
          </form>
          <p className="text-[12px] text-text-3">
            Butuh menyembunyikan sementara? Matikan centang “Terbitkan di situs” di atas.
          </p>
        </div>
      </Panel>

      <div className="flex justify-start">
        <Link href={`/anime/${record.anime.slug}`} target="_blank" className={btnGhost}>
          Buka halaman publik judul ini
        </Link>
      </div>
    </div>
  );
}
