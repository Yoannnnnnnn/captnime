import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { ensureSeeded } from "@/lib/db/seed";
import { countRows, getAdminAnimeList } from "@/lib/db/repository";
import { STATUS_LABEL } from "@/lib/data/catalog";
import { timeAgo } from "@/lib/utils";
import { Badge, Panel, btnPrimary } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const useDatabase = () =>
  (process.env.CAPTNIME_DATA_SOURCE ?? "local").toLowerCase() === "database";

export default async function AdminDashboardPage() {
  ensureSeeded();

  const [list, stats] = [getAdminAnimeList(), countRows()];
  const published = list.filter((a) => a.published).length;

  return (
    <div className="space-y-6">
      {!useDatabase() ? (
        <div className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-[12.5px] leading-relaxed text-coral">
          <strong className="font-semibold">Situs masih memakai katalog statis.</strong>{" "}
          Perubahan di panel ini tersimpan ke database, tetapi belum tampil di halaman
          publik. Jalankan server dengan{" "}
          <code className="font-mono">CAPTNIME_DATA_SOURCE=database</code> agar situs
          membaca database.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Judul", value: stats.anime, note: `${published} terbit` },
          { label: "Episode", value: stats.episodes, note: "total" },
          { label: "Server", value: stats.servers, note: "tautan streaming" },
          { label: "Subtitle", value: stats.subtitles, note: "track bahasa" },
          { label: "Genre", value: stats.genres, note: "kategori" },
        ].map((card) => (
          <div key={card.label} className="sticker-sm px-3.5 py-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-text-3">
              {card.label}
            </p>
            <p className="mt-1 font-mono text-2xl tabular-nums text-text">{card.value}</p>
            <p className="text-[11px] text-text-3">{card.note}</p>
          </div>
        ))}
      </div>

      <Panel
        index="01"
        title="Daftar judul"
        description="Diurutkan dari yang terakhir diubah. Sunting untuk mengelola episode dan server."
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] text-text-3">
            {list.length} judul di database
          </p>
          <Link href="/admin/anime/baru" className={btnPrimary}>
            <Plus className="size-4" aria-hidden />
            Judul baru
          </Link>
        </div>

        {list.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-3">
            Database masih kosong. Tambah judul pertama, atau muat ulang halaman ini untuk
            menyemai katalog demo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[10.5px] uppercase tracking-[0.14em] text-text-3">
                  <th className="py-2 pr-3 font-semibold">Judul</th>
                  <th className="px-3 py-2 font-semibold">Tipe</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 text-right font-semibold">Episode</th>
                  <th className="px-3 py-2 text-right font-semibold">Skor</th>
                  <th className="px-3 py-2 font-semibold">Tayang</th>
                  <th className="px-3 py-2 font-semibold">Diubah</th>
                  <th className="py-2 pl-3" />
                </tr>
              </thead>
              <tbody>
                {list.map((anime) => (
                  <tr key={anime.slug} className="border-b border-line/60 last:border-0">
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/admin/anime/${anime.slug}`}
                        className="font-medium text-text hover:text-gold"
                      >
                        {anime.title}
                      </Link>
                      <span className="ml-2 font-mono text-[11px] text-text-3">
                        {anime.slug}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-text-2">{anime.type}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={anime.status === "ongoing" ? "mint" : "neutral"}>
                        {STATUS_LABEL[anime.status as keyof typeof STATUS_LABEL] ?? anime.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-text-2">
                      {anime.episodes}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums text-text-2">
                      {anime.score.toFixed(1)}
                    </td>
                    <td className="px-3 py-2.5">
                      {anime.published ? (
                        <Badge tone="mint">Terbit</Badge>
                      ) : (
                        <Badge tone="coral">Draf</Badge>
                      )}
                      {anime.featured ? (
                        <span className="ml-1.5">
                          <Badge tone="gold">Sorotan</Badge>
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-[11.5px] text-text-3">
                      {timeAgo(anime.updatedAt)}
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <Link
                        href={`/admin/anime/${anime.slug}`}
                        className="inline-flex items-center gap-1 text-[12px] text-text-2 hover:text-gold"
                      >
                        Sunting
                        <ArrowUpRight className="size-3.5" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel index="02" title="Cara kerja" description="Ringkas, supaya operator baru tidak salah kira.">
        <ul className="space-y-2 text-[12.5px] leading-relaxed text-text-2">
          <li>
            <span className="text-text">Judul</span> memuat metadata, genre, palet poster,
            dan status publikasi.
          </li>
          <li>
            <span className="text-text">Episode</span> punya nomor unik per judul; nomor
            sama akan memperbarui episode yang sudah ada.
          </li>
          <li>
            <span className="text-text">Server</span> adalah tautan HLS (.m3u8) atau MP4
            yang diputar pemutar. Minimal satu server agar episode bisa ditonton.
          </li>
          <li>
            <span className="text-text">Subtitle</span> menunjuk file .vtt; tandai satu
            sebagai default.
          </li>
          <li>
            Semua perubahan langsung memicu revalidasi halaman publik — tidak perlu deploy
            ulang.
          </li>
        </ul>
      </Panel>
    </div>
  );
}
