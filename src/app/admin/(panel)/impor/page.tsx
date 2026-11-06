import type { Metadata } from "next";
import Link from "next/link";
import { Check, ExternalLink, Search, TriangleAlert } from "lucide-react";
import { importAnimeAction } from "@/app/admin/actions";
import { searchAnime } from "@/lib/metadata/anilist";
import { Poster } from "@/components/poster";
import { formatMinutes } from "@/lib/utils";
import {
  Badge,
  Notice,
  Panel,
  btnGhost,
  btnPrimary,
  inputClass,
} from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Impor Metadata",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  id: "Permintaan impor tidak menyertakan ID judul.",
  fetch: "Gagal mengambil detail dari AniList. Coba lagi atau periksa koneksi server.",
};

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const q = (one("q") ?? "").trim();
  const errorCode = one("error");
  const result = q.length >= 2 ? await searchAnime(q, 12) : { ok: true, data: [] };
  const items = result.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="text-[12.5px] text-text-3 transition-colors hover:text-gold"
        >
          ← Daftar judul
        </Link>
        <span className="font-mono text-[11px] text-text-3">metadata · AniList</span>
      </div>

      {errorCode && MESSAGES[errorCode] ? (
        <Notice tone="error">{MESSAGES[errorCode]}</Notice>
      ) : null}

      <Panel
        index="01"
        title="Cari judul di AniList"
        description="Metadata (judul, sinopsis, genre, tahun, studio, poster) diambil otomatis. Episode dan sumber video tetap Anda isi sendiri."
      >
        <form action="/admin/impor" method="get" className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Contoh: Sousou no Frieren"
            className={`${inputClass} max-w-md flex-1`}
            aria-label="Kata kunci pencarian"
          />
          <button type="submit" className={btnPrimary}>
            <Search className="size-4" aria-hidden />
            Cari
          </button>
        </form>

        <p className="mt-3 text-[11.5px] leading-relaxed text-text-3">
          Hasil dibatasi 12 judul untuk menghormati batas ±90 permintaan/menit
          AniList. Judul yang diimpor masuk sebagai <strong>draf belum terbit</strong>,
          jadi tidak langsung tampil di situs.
        </p>
      </Panel>

      {!result.ok ? (
        <div className="flex items-start gap-2 rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-[12.5px] leading-relaxed text-coral">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">AniList tidak bisa dihubungi</p>
            <p className="mt-0.5">{result.error}</p>
            <p className="mt-1 text-coral/80">
              Bila server memang tidak punya akses internet keluar, arahkan
              <code className="mx-1 font-mono">CAPTNIME_ANILIST_ENDPOINT</code>
              ke proxy/endpoint GraphQL Anda sendiri.
            </p>
          </div>
        </div>
      ) : null}

      {q.length >= 2 && result.ok && items.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-text-3">
          Tidak ada hasil untuk “{q}”. Coba judul Jepang (romaji) atau ejaan lain.
        </p>
      ) : null}

      {items.length > 0 ? (
        <Panel index="02" title={`${items.length} hasil`} description="Pilih satu untuk membuat draf.">
          <ul className="grid gap-2">
            {items.map((item) => (
              <li
                key={item.anilistId}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface-2/60 p-2.5"
              >
                <Poster
                  anime={{
                    title: item.title,
                    palette: item.palette,
                    motif: item.motif,
                    poster: item.poster,
                  }}
                  hideTitle
                  rounded="rounded-md"
                  className="w-12 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-text">
                    {item.title}
                  </p>
                  <p className="truncate text-[11.5px] text-text-3">
                    {item.titleAlt ? `${item.titleAlt} · ` : ""}
                    {item.year} · {item.studio}
                    {item.totalEpisodes > 0
                      ? ` · ${item.totalEpisodes} ep · ${formatMinutes(item.durationMinutes * 60)}`
                      : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge tone={item.status === "ongoing" ? "mint" : "neutral"}>
                      {item.status === "ongoing"
                        ? "Sedang tayang"
                        : item.status === "upcoming"
                          ? "Segera"
                          : "Tamat"}
                    </Badge>
                    <Badge>{item.type}</Badge>
                    {item.score > 0 ? <Badge tone="gold">{item.score.toFixed(1)}</Badge> : null}
                    {item.genres.slice(0, 3).map((g) => (
                      <Badge key={g}>{g}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {item.sourceUrl ? (
                    <Link
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="grid size-8 place-items-center rounded-md border border-line text-text-3 transition-colors hover:text-gold"
                      aria-label={`Buka ${item.title} di AniList`}
                    >
                      <ExternalLink className="size-3.5" aria-hidden />
                    </Link>
                  ) : null}
                  <form action={importAnimeAction}>
                    <input type="hidden" name="anilistId" value={item.anilistId} />
                    <input type="hidden" name="q" value={q} />
                    <button type="submit" className={btnGhost}>
                      <Check className="size-3.5" aria-hidden />
                      Impor draf
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel
        index="03"
        title="Setelah impor"
        description="Draf tidak tayang sampai dilengkapi."
      >
        <ol className="list-inside list-decimal space-y-1.5 text-[12.5px] leading-relaxed text-text-2">
          <li>Periksa sinopsis &amp; genre, rapikan slug bila perlu.</li>
          <li>Tambahkan episode (nomor, tanggal rilis, durasi).</li>
          <li>
            Isi sumber video: <strong>embed resmi</strong> (YouTube/Bilibili kanal
            resmi) atau berkas HLS/MP4 milik Anda.
          </li>
          <li>Centang “Terbitkan di situs”.</li>
        </ol>
        <p className="mt-3 text-[11.5px] leading-relaxed text-text-3">
          AniList hanya menyediakan metadata, bukan video. Lisensi tayang tetap
          tanggung jawab operator — lihat{" "}
          <Link href="/" className="text-text-2 underline underline-offset-4">
            docs/SUMBER-KONTEN.md
          </Link>
          .
        </p>
      </Panel>

      <p className="px-1 text-[11px] text-text-3">
        Metadata:{" "}
        <a
          href="https://anilist.co"
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-4 hover:text-gold"
        >
          AniList
        </a>{" "}
        — digunakan lewat API GraphQL publik. Poster/banner dimuat dari CDN AniList.
      </p>
    </div>
  );
}
