# Captnime

Platform streaming anime — antarmuka cepat, katalog rapi, subtitle Indonesia, dan
lanjut-tonton otomatis. Dibangun dengan **Next.js 15 (App Router) + TypeScript +
Tailwind CSS 4**.

> **Status:** MVP fitur inti selesai dan berjalan penuh dengan katalog demo
> (konten orisinal). Lapisan provider membuat aplikasi siap disambungkan ke
> sumber data produksi tanpa mengubah satu pun komponen UI.

---

## 1. Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # produksi
npm run typecheck            # cek tipe
npm run clean                # buang cache .next & .next-build
```

Host dan port bisa diatur lewat env (default `0.0.0.0:3000`):

```bash
HOST=127.0.0.1 PORT=3001 npm start   # hanya loopback
HOST=::        PORT=3000 npm start   # dual-stack IPv4 + IPv6
```

`HOST=::` berguna di lingkungan container/preview yang mungkin menghubungi
`localhost` lewat IPv6 (`::1`); pada kernel dengan `bindv6only=0` satu listener
melayani kedua keluarga alamat. Untuk sebagian besar deployment,
nilai default sudah cukup.

> **Catatan operasional:** pada lingkungan preview, buka aplikasi lewat panel
> preview yang disediakan platform. Membuka URL preview secara manual di tab
> baru bisa menghasilkan `502 Bad Gateway` meski server berjalan normal —
> penyebabnya ada di lapisan proxy, bukan di aplikasi.

Tidak perlu konfigurasi apa pun — katalog demo sudah terisi.

---

## 2. Fitur yang sudah ada

| Area | Detail |
| --- | --- |
| **Beranda** | Hero carousel otomatis, rail Trending dengan peringkat, Sedang Tayang, Baru Ditambahkan, Rating Tertinggi, chip genre, dan panel “Lanjut Tonton”. |
| **Katalog** | Pencarian teks, filter genre/status/tipe, 4 opsi pengurutan, paginasi, dan empty-state yang informatif. |
| **Detail anime** | Backdrop dinamis, poster, sinopsis, tabel informasi (studio/musim/durasi/jadwal), daftar episode dengan progres, anime terkait, tombol daftar tonton. |
| **Pemutar** | HLS (hls.js) & MP4, pilih server, subtitle Indonesia/Inggris on-off, resume dari posisi terakhir, auto-next dengan hitungan, kecepatan 0.75×–2×, PiP, layar penuh, pintasan keyboard, penanganan error + tombol ganti server. |
| **Jadwal** | Jadwal rilis mingguan, hari ini disorot otomatis. |
| **Daftar Saya** | Watchlist + riwayat tontonan (progres per episode) tersimpan di perangkat. |
| **UX** | Mobile-first, bottom tab bar, drawer menu, skeleton loading, halaman 404, `prefers-reduced-motion`, fokus keyboard, aria-label, metadata SEO + sitemap + PWA manifest. |

Pintasan pemutar: `spasi`/`K` putar-jeda · `←`/`→` ±10 detik · `↑`/`↓` volume ·
`F` layar penuh · `M` bisu · `C` subtitle.

---

## 3. Arsitektur

```
src/
├─ app/                  # routing App Router
│  ├─ page.tsx           # beranda
│  ├─ browse/            # katalog + filter
│  ├─ anime/[slug]/      # detail anime
│  ├─ watch/[slug]/[ep]/ # halaman menonton
│  ├─ schedule/          # jadwal rilis
│  ├─ my-list/           # watchlist & riwayat
│  ├─ manifest.ts        # PWA
│  ├─ sitemap.ts, robots.ts
│  └─ globals.css        # design system (Tailwind 4 @theme)
├─ components/           # UI (poster, hero, rail, player, dsb.)
└─ lib/
   ├─ types.ts           # KONTRAK data — sumber kebenaran tunggal
   ├─ provider.ts        # pemilih provider via env
   ├─ providers/
   │  ├─ local.ts        # katalog demo in-memory
   │  └─ remote.ts       # adapter API JSON + normalizer
   ├─ data/catalog.ts    # seed 18 judul orisinal
   ├─ user-store.ts      # localStorage: riwayat, progres, watchlist
   └─ utils.ts           # format tanggal/durasi, helper
```

**Prinsip utama:** UI hanya berbicara dengan `AnimeProvider` (lihat
`src/lib/types.ts`). Menukar sumber data = mengubah satu env var.

---

## 4. Mengganti sumber data

```bash
# .env.local
CAPTNIME_DATA_SOURCE=remote
CAPTNIME_API_BASE_URL=https://api-anda.example.com
CAPTNIME_API_KEY=opsional
```

Endpoint yang diharapkan (detail kontrak + contoh respons:
[`docs/INTEGRASI-SUMBER-DATA.md`](docs/INTEGRASI-SUMBER-DATA.md)):

```
GET /anime?q=&genre=&status=&type=&sort=&page=&perPage=
GET /anime/:slug
GET /anime/:slug/related?limit=
GET /anime/slugs
GET /genres
GET /schedule
```

Kalau bentuk respons API Anda berbeda, cukup sesuaikan `mapAnime()` di
`src/lib/providers/remote.ts` — tidak ada komponen UI yang perlu disentuh.

---

## 5. Soal sumber konten (penting)

Repo ini **tidak** berisi dan **tidak** menyalurkan materi berhak cipta pihak
mana pun.

- 18 judul di `src/lib/data/catalog.ts` adalah **fiksi orisinal** yang ditulis
  untuk demo produk.
- Poster dibuat **prosedural** dari palet + motif (tidak ada file gambar, nol
  permintaan jaringan).
- Subtitle `.vtt` di `public/subtitles/` dibuat sendiri.
- Video demo memakai **sample stream publik yang memang disediakan untuk
  pengujian** (Blender Open Movies via `commondatastorage.googleapis.com`, dan
  `test-streams.mux.dev`). Ini hanya placeholder — ganti dengan CDN Anda.

Menyalurkan ulang stream/subtitle milik orang lain tanpa lisensi melanggar hak
cipta (di Indonesia: UU No. 28 Tahun 2014 tentang Hak Cipta) dan biasanya juga
melanggar ToS layanan sumbernya. Untuk produksi, gunakan konten berlisensi,
kerja sama distribusi, atau API aggregator resmi. Kalau Anda punya sumber legal,
adapter-nya dipasang di sisi server Anda melalui `RemoteProvider`.

---

## 6. Roadmap berikutnya

1. **Autentikasi** (Better Auth / NextAuth) → watchlist & progres pindah ke database.
2. **Database** (Postgres + Prisma/Drizzle) untuk katalog, episode, dan server.
3. **Admin CMS** untuk CRUD judul, episode, dan link server.
4. **Transcoding pipeline** (FFmpeg + HLS multi-bitrate) bila Anda meng-host video sendiri.
5. **CDN + rate limiting** di depan endpoint manifest.
6. **Notifikasi rilis** (web push) untuk judul di daftar tonton.
