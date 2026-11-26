import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CircleHelp,
  Film,
  LifeBuoy,
  MonitorPlay,
  RefreshCw,
  Subtitles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Bantuan Menonton",
  description:
    "Panduan singkat Captnime: kenapa video tidak muncul, cara memilih server, subtitle yang tidak tampil, dan apa yang perlu dilaporkan.",
};

/** Satu baris tabel gejala → penyebab → solusi. */
const GEJALA: { gejala: string; sebab: string; solusi: string }[] = [
  {
    gejala: "Muncul “Tautan berkas kedaluwarsa”",
    sebab:
      "Berkas unggahan hanya bisa diambil lewat tautan bertanda tangan yang berlaku 6 jam.",
    solusi: "Muat ulang halaman tonton, lalu tekan putar lagi.",
  },
  {
    gejala: "Muncul “Diputar langsung oleh …” tapi kotak hitam kosong",
    sebab:
      "Kanal pemilik video menonaktifkan pemutaran di situs lain, atau jaringan Anda memblokir domain pemutar.",
    solusi: "Tekan “Buka di tab baru”, atau pilih server lain di bawah pemutar.",
  },
  {
    gejala: "Muncul “Gagal memuat video” pada server hls/mp4",
    sebab: "Server sumber sedang mati, lambat, atau menolak permintaan dari luar.",
    solusi: "Pilih server berikutnya; kalau semua gagal, coba lagi beberapa saat.",
  },
  {
    gejala: "Subtitle tidak muncul",
    sebab: "Track subtitle sedang dimatikan, atau berkas .vtt gagal dimuat.",
    solusi: "Buka panel subtitle di pemutar dan pilih “Indonesia”.",
  },
  {
    gejala: "Pemutaran terhenti lalu kembali ke awal",
    sebab: "Jaringan putus sesaat, atau berkas memang belum terunduh penuh.",
    solusi: "Tunggu indikator “Memuat” hilang, lalu tekan putar lagi.",
  },
];

const LANGKAH_SERVER = [
  "Di bawah pemutar ada baris tombol server: “Server 1”, “Server 2”, dan seterusnya.",
  "Klik server lain — pemutar langsung memuat sumber itu tanpa memuat ulang halaman.",
  "Server bertanda “embed” artinya video diputar langsung oleh platform pemiliknya (mis. YouTube) dan kualitas diatur di dalam pemutarnya.",
  "Bisa juga membuka tautan langsung: tambahkan ?server=2 di akhir alamat episode.",
];

export default function BantuanPage() {
  return (
    <div className="container-page pt-16 pb-6 lg:pt-7">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Bantuan</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          <CircleHelp className="size-6 text-gold" aria-hidden />
          Video tidak muncul?
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-text-2">
          Sebagian besar masalah pemutaran berasal dari sumber videonya, bukan dari akun
          Anda. Mulai dari tiga pemeriksaan di bawah — biasanya selesai kurang dari
          satu menit.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="sticker p-5">
          <span className="grid size-9 place-items-center rounded-xl bg-gold/12 text-gold">
            <RefreshCw className="size-4" aria-hidden />
          </span>
          <h2 className="mt-3 text-sm font-semibold text-text">1. Muat ulang halaman</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-text-2">
            Tautan berkas yang diunggah ke Captnime hanya berlaku <strong>6 jam</strong>.
            Kalau tab Anda dibiarkan terbuka sejak kemarin, tautannya sudah mati — muat
            ulang (F5) lalu tekan putar lagi.
          </p>
        </section>

        <section className="sticker p-5">
          <span className="grid size-9 place-items-center rounded-xl bg-gold/12 text-gold">
            <MonitorPlay className="size-4" aria-hidden />
          </span>
          <h2 className="mt-3 text-sm font-semibold text-text">2. Ganti server</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-text-2">
            Tiap episode bisa punya beberapa sumber. Kalau satu server gagal, pilih server
            lain di baris tombol di bawah pemutar — tidak perlu kembali ke halaman
            sebelumnya.
          </p>
        </section>

        <section className="sticker p-5">
          <span className="grid size-9 place-items-center rounded-xl bg-gold/12 text-gold">
            <Film className="size-4" aria-hidden />
          </span>
          <h2 className="mt-3 text-sm font-semibold text-text">3. Buka di tab baru</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-text-2">
            Untuk server yang diputar oleh platform lain, kadang kanal pemiliknya
            menonaktifkan semat. Tautan <strong>“Buka di tab baru”</strong> di bawah
            pemutar membuka video di halaman aslinya.
          </p>
        </section>
      </div>

      <section className="sticker mt-4 p-5">
        <h2 className="text-sm font-semibold text-text">Gejala dan penyebabnya</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[12.5px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.14em] text-text-3">
                <th className="border-b border-line pb-2 pr-3 font-semibold">Yang terlihat</th>
                <th className="border-b border-line pb-2 pr-3 font-semibold">Penyebab</th>
                <th className="border-b border-line pb-2 font-semibold">Yang bisa dicoba</th>
              </tr>
            </thead>
            <tbody>
              {GEJALA.map((row) => (
                <tr key={row.gejala} className="align-top">
                  <td className="border-b border-line/60 py-2.5 pr-3 font-medium text-text">
                    {row.gejala}
                  </td>
                  <td className="border-b border-line/60 py-2.5 pr-3 text-text-2">{row.sebab}</td>
                  <td className="border-b border-line/60 py-2.5 text-text-2">{row.solusi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="sticker p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
            <MonitorPlay className="size-4 text-gold" aria-hidden />
            Cara memilih server
          </h2>
          <ol className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-text-2">
            {LANGKAH_SERVER.map((text, index) => (
              <li key={text} className="flex gap-2.5">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-bold text-gold">
                  {index + 1}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="sticker p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
            <Subtitles className="size-4 text-gold" aria-hidden />
            Subtitle Indonesia
          </h2>
          <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-text-2">
            <li>
              Subtitle aktif otomatis bila tersedia. Buka tombol <em>subtitle</em> di
              pemutar untuk mematikan atau memilih bahasa lain.
            </li>
            <li>
              Pada server embed, subtitle diatur lewat tombol di dalam pemutar platform
              tersebut.
            </li>
            <li>
              Kalau teks subtitle tampil tapi kosong, coba server lain — berkas subtitle
              terikat pada sumber yang sedang diputar.
            </li>
          </ul>
        </section>
      </div>

      <section className="sticker mt-4 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
          <LifeBuoy className="size-4 text-gold" aria-hidden />
          Kalau masih tidak bisa
        </h2>
        <p className="mt-2 text-[12.5px] leading-relaxed text-text-2">
          Catat empat hal ini agar laporan mudah ditindaklanjuti: <strong>judul</strong>,{" "}
          <strong>nomor episode</strong>, <strong>label server</strong> yang dipakai
          (mis. “Server 2” atau nama platformnya), dan <strong>peramban</strong> yang
          Anda pakai (Chrome/Firefox/Safari, ponsel atau desktop). Kalau memakai jaringan
          kantor atau sekolah, sebutkan juga — banyak jaringan memblokir domain pemutar
          video.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/browse"
            className="flex h-10 items-center gap-1.5 rounded-full bg-gold px-4 text-[13px] font-bold text-bg transition hover:bg-gold-2"
          >
            Cari judul lain <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/"
            className="flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-[13px] font-bold text-text transition hover:bg-surface-2"
          >
            Kembali ke beranda
          </Link>
        </div>
      </section>

      <p className="mt-4 text-[11px] leading-relaxed text-text-3">
        Captnime hanya memutar video dari sumber resmi pemiliknya atau berkas yang diunggah
        pengelola. Bila sebuah judul tidak bisa diputar di mana pun, kemungkinan besar
        sumbernya sedang bermasalah — bukan akun Anda.
      </p>
    </div>
  );
}
