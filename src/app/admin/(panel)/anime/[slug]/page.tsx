import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAdminAnime, getAllGenres } from "@/lib/db/repository";
import { deleteAnimeAction } from "@/app/admin/actions";
import { AnimeForm } from "@/components/admin/anime-form";
import { EpisodeManager } from "@/components/admin/episode-manager";
import { Panel, btnDanger, btnGhost } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

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
  const saved = (Array.isArray(sp.saved) ? sp.saved[0] : sp.saved) === "1";

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
