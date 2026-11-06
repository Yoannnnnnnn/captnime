# Captnime

Platform streaming anime — antarmuka cepat, katalog rapi, subtitle Indonesia, dan
lanjut-tonton otomatis. Dibangun dengan **Next.js 15 (App Router) + TypeScript +
Tailwind CSS 4**.

> **Status:** MVP fitur inti selesai, ditambah Fase 1 (CMS + basis data) dan
> Fase 2 (akun pengguna). Katalog dikelola lewat `/admin` tanpa deploy ulang,
> dan riwayat/daftar tonton tersimpan di akun — bukan cuma di satu perangkat.
> Tamu tetap bisa menonton tanpa login.

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
| **Beranda** | Masthead bernomor, feature asimetris 8 kolom, panel “Lanjut Tonton” + rilis hari ini, daftar “Paling ditonton” berangka, mosaik ukuran campur, arsip episode, dan rating tertinggi. |
| **Katalog** | Pencarian teks, filter genre/status/tipe, 4 opsi pengurutan, paginasi, dan empty-state yang informatif. |
| **Detail anime** | Backdrop dinamis, poster, sinopsis, tabel informasi (studio/musim/durasi/jadwal), daftar episode dengan progres, anime terkait, tombol daftar tonton. |
| **Pemutar** | HLS (hls.js) & MP4, pilih server, subtitle Indonesia/Inggris on-off, resume dari posisi terakhir, auto-next dengan hitungan, kecepatan 0.75×–2×, PiP, layar penuh, pintasan keyboard, penanganan error + tombol ganti server. |
| **Jadwal** | Jadwal rilis mingguan, hari ini disorot otomatis. |
| **Daftar Saya** | Watchlist + riwayat tontonan. Tamu: `localStorage`. Login: tabel `progress`/`watchlist`, tersinkron antar perangkat. |
| **Akun** | `/masuk`, `/daftar`, `/akun`. Kata sandi scrypt + salt, sesi cookie `httpOnly` bertanda token acak (yang disimpan hanya hash-nya), pembatasan 6 percobaan gagal/15 menit, data tamu disalin otomatis saat pertama masuk. Lihat [`docs/AUTENTIKASI.md`](docs/AUTENTIKASI.md). |
| **Panel admin** | `/admin`: login berbasis password env, CRUD judul, episode, server streaming, dan subtitle. Perubahan langsung tayang lewat revalidasi — tanpa deploy ulang. Lihat [`docs/DATABASE.md`](docs/DATABASE.md). |
| **UX** | Mobile-first, bottom tab bar, drawer menu, skeleton loading, halaman 404, `prefers-reduced-motion`, fokus keyboard, aria-label, metadata SEO + sitemap + PWA manifest. |

Pintasan pemutar: `spasi`/`K` putar-jeda · `←`/`→` ±10 detik · `↑`/`↓` volume ·
`F` layar penuh · `M` bisu · `C` subtitle.

---

## 3. Bahasa visual

Tema **gelap sinematik**, mengikuti pola produk streaming nyata (Crunchyroll,
Netflix, Bstation) — bukan gaya dekoratif:

- Latar berlapis `#08090d → #12141a → #191c24`, garis 1px (`--color-line`),
  tanpa glow/gradient-blur.
- **Satu aksen** emas `#ffb020` hanya untuk aksi utama, item aktif, dan progres.
- Gambar jadi bintang utama: hero full-bleed dengan scrim bertingkat, kartu
  poster 2:3 tanpa border tebal, hover sekadar zoom tipis + elevasi warna.
- Tipografi bobot sedang (400–600) dengan hierarki ukuran, bukan heading raksasa.
- Poster dibangkitkan prosedural (SVG minimal: lengkung langit, siluet, bulan)
  agar katalog punya karakter tanpa aset berhak cipta.

Token didefinisikan di `src/app/globals.css` (`--color-bg`, `--color-surface`,
`--color-line`, `--color-text`, `--color-gold`) dengan utility `scrim-b`,
`scrim-l`, `sticker`, `btn-sticker`.

### Tata letak

Struktur sengaja dibuat tidak mengikuti pola "hero + rail horizontal + grid
seragam" yang dipakai hampir semua aplikasi streaming:

- **Navigasi samping** (`SideNav`) di desktop — menu, genre, dan pencarian dalam
  satu kolom tetap; header atas hanya dipakai di layar kecil.
- **Beranda bento asimetris** — panel feature 8 kolom berdampingan dengan kolom
  "Lanjut tonton" dan "Rilis hari ini", lalu daftar berangka, mosaik ukuran
  campur, dan daftar episode bergaya arsip. Tidak ada carousel.
- **Jelajah** — panel filter menempel di kiri, hasil sebagai mosaik dengan satu
  tile besar, bukan grid kartu seragam.
- Tipografi editorial: kicker bernomor (`01`, `02`), garis pemisah 1px, dan
  judul berukuran sedang agar hierarki datang dari susunan, bukan ketebalan.

## 4. Arsitektur

```
src/
├─ app/                  # routing App Router
│  ├─ page.tsx           # beranda
│  ├─ browse/            # katalog + filter
│  ├─ anime/[slug]/      # detail anime
│  ├─ watch/[slug]/[ep]/ # halaman menonton
│  ├─ schedule/          # jadwal rilis
│  ├─ my-list/           # watchlist & riwayat
│  ├─ admin/             # panel CMS (login + panel terproteksi)
│  ├─ masuk/, daftar/    # autentikasi pengguna
│  ├─ akun/              # profil + ringkasan aktivitas
│  ├─ api/me/            # state, progress, watchlist, import
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
   ├─ db/                # SQLite: schema.sql, client, repository, seed
   ├─ auth.ts            # sesi cookie admin (HMAC)
   ├─ auth-user.ts       # scrypt, sesi pengguna, rate limit
   ├─ db/accounts.ts     # users, sessions, watchlist, progress
   ├─ user-store.ts      # localStorage: riwayat, progres, watchlist
   └─ utils.ts           # format tanggal/durasi, helper
```

**Prinsip utama:** UI hanya berbicara dengan `AnimeProvider` (lihat
`src/lib/types.ts`). Menukar sumber data = mengubah satu env var.

---

## 5. Panel admin & basis data

Katalog bisa dioperasikan tanpa developer lewat `/admin`:

```bash
CAPTNIME_DATA_SOURCE=database
CAPTNIME_ADMIN_PASSWORD=sandi-kuat-anda
npm run build && npm start
# buka http://localhost:3000/admin
```

- Login: satu kata sandi dari `CAPTNIME_ADMIN_PASSWORD`; sesi cookie `httpOnly`
  bertanda tangan HMAC, berlaku 12 jam.
- Kelola **judul** (metadata, genre, palet poster, publikasi), **episode**
  (nomor, tanggal, filler), **server streaming** (HLS/MP4 + kualitas), dan
  **subtitle** (.vtt, satu bisa jadi default).
- Basis data: SQLite lewat `node:sqlite`, default `data/captnime.db`. Saat masih
  kosong, database otomatis diisi 18 judul dari katalog.
- Halaman publik memakai ISR; setiap penyimpanan memicu `revalidatePath()` +
  invalidasi cache provider, jadi perubahan tampil segera.
- Pindah ke Postgres nanti hanya menyentuh `schema.sql` + `repository.ts`.

Rincian skema, backup, deployment, dan migrasi: [`docs/DATABASE.md`](docs/DATABASE.md).

---

## 6. Akun pengguna

```bash
# tanpa konfigurasi tambahan — tabel dibuat otomatis di database yang sama
npm run build && npm start
# /daftar → /masuk → /akun
```

- Kata sandi: **scrypt** (N=16384, r=8, p=1, salt acak) — bukan plaintext, bukan
  MD5/SHA biasa.
- Sesi: token 32 byte di cookie `httpOnly` + `SameSite=Lax`; database hanya
  menyimpan SHA-256 token. Berlaku 30 hari.
- Percobaan masuk dibatasi 6 kali per IP+email dalam 15 menit.
- Pengunjung tanpa akun tetap bisa menonton dan memakai "Daftar Saya" lewat
  `localStorage`. Saat pertama kali masuk, data tamu itu **disalin ke akun**
  (data server yang lebih baru menang) lalu kunci lokal dibersihkan.
- Mode akun tetap memakai katalog dari provider mana pun; metadata judul
  dilengkapi dari provider aktif saat state dikirim ke klien.

Rincian tabel, endpoint, keamanan, dan batasan: [`docs/AUTENTIKASI.md`](docs/AUTENTIKASI.md).

---

## 7. Mengganti sumber data

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

## 8. Sumber video & biaya

Tiga jalur didukung, dipilih per server di panel admin:

| Tipe | Isi | Biaya |
| --- | --- | --- |
| `embed` | Tautan YouTube/Vimeo/Dailymotion/Bilibili resmi; dimuat dalam iframe dengan allowlist host | Rp0 |
| `hls` / `mp4` | Berkas milik sendiri atau CDN mitra | Sesuai CDN |
| `hls` + `CAPTNIME_MEDIA_BASE_URL` | Path relatif (`/videos/…`) otomatis diberi awalan CDN | Sesuai CDN |

Keputusan untuk tahap ini: **embed + URL eksternal** (tanpa biaya), dengan jalur
Cloudflare R2 disiapkan lewat satu env var — bukan hosting video sendiri.

Hitungan singkat (20 judul × 12 episode, 1080p, 600 GB ditonton/bulan):
R2 ±**$4/bulan** (egress $0) vs Bunny Asia ±$21 vs Cloudflare Stream ±$65.
Angka lengkap, konfigurasi FFmpeg + R2, dan catatan legalitas:
[`docs/VIDEO.md`](docs/VIDEO.md).

---

## 9. Soal sumber konten (penting)

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

## 10. Roadmap berikutnya

1. ~~Database + Admin CMS~~ — **selesai** di Fase 1 (`node:sqlite` + `/admin`).
2. ~~Autentikasi pengguna~~ — **selesai** di Fase 2 (scrypt + sesi database, sinkron
   riwayat & daftar tonton).
3. **Penyempurnaan akun** — verifikasi email, reset/ganti kata sandi, hapus akun,
   opsional OAuth. Lihat batasan di `docs/AUTENTIKASI.md`.
4. **Hosting video** — *sebagian*: tiga jalur sumber (embed, HLS/MP4 eksternal,
   CDN base) sudah ada. Berikutnya: unggah dari panel, FFmpeg pipeline terpisah,
   signed URL/anti-hotlink bila konten berlisensi sudah tersedia (`docs/VIDEO.md`).
5. **CDN + rate limiting** di depan endpoint manifest dan `/api/me/*`.
6. **Notifikasi rilis** (web push) untuk judul di daftar tonton.
7. **Migrasi Postgres** bila penulis data atau trafik sudah banyak (lihat docs/DATABASE.md).
