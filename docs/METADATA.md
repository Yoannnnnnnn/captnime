# Impor Metadata dari AniList

Untuk mengisi katalog tanpa mengetik manual, panel admin bisa mengambil
**metadata** dari API GraphQL publik AniList. Yang diambil hanya informasi
judul — **bukan video**.

---

## 1. Apa yang diimpor

| Diimpor | Tidak diimpor |
| --- | --- |
| Judul utama + alternatif | Tautan stream |
| Sinopsis (HTML dibersihkan) | Episode |
| Genre | Subtitle |
| Tahun & musim | Hubungan antar judul |
| **Jadwal tayang berikutnya** (`nextAiringEpisode`, dikonversi ke WIB) | — |
| Studio utama | — |
| Skor rata-rata & rating umur | — |
| Jumlah episode, durasi | — |
| Poster, banner, warna poster | — |

Judul hasil impor disimpan sebagai **draf (`published = 0`)**, jadi tidak tampil
di situs sampai Anda melengkapi episode + sumber video lalu mencentang
“Terbitkan di situs”.

---

## 2. Alur di panel

1. `/admin` → **Impor metadata**
2. Cari judul (romaji/Inggris). Hasil dibatasi **12** per pencarian.
3. Tekan **Impor draf** → otomatis dibuat dengan slug unik
   (`judul`, `judul-2`, …) lalu Anda diarahkan ke editor.
4. Lengkapi episode dan sumber video:
   - **Embed resmi** — tautan YouTube/Bilibili kanal resmi (lihat `VIDEO.md`).
   - **Berkas sendiri** — HLS/MP4 di CDN Anda.
5. Centang “Terbitkan di situs”.

---

## 3. Jadwal tayang otomatis

AniList menyertakan `nextAiringEpisode { airingAt episode }`. Nilainya dipakai
untuk mengisi `broadcast_day` dan `broadcast_time` supaya judul hasil impor
langsung muncul di `/schedule`.

- `airingAt` adalah UTC (detik). Konversi memakai **WIB (UTC+7, tanpa DST)**:
  `Sabtu 13:00 UTC` → **Sabtu 20:00 WIB**, `Sabtu 20:30 UTC` → **Minggu 03:30 WIB**.
- Bila judul sudah tamat atau jadwal belum diumumkan, AniList tidak mengirim
  `nextAiringEpisode`; jadwal dibiarkan kosong dan bisa diisi manual.
- Editor judul menampilkan **jadwal aktif + ID AniList**, plus tombol
  **Sinkronkan dari AniList** untuk memperbarui saat jadwal berubah.
- ID AniList disimpan di kolom `anime.anilist_id`. Database lama otomatis
  mendapat kolom ini lewat migrasi ringan di `src/lib/db/client.ts`
  (`PRAGMA table_info` → `ALTER TABLE`), jadi tidak perlu reset database.

Halaman `/schedule` sendiri tetap hanya menampilkan judul berstatus
**ongoing** dan **sudah terbit**. Draf impor sengaja tidak muncul sampai Anda
melengkapi episode dan mencentang “Terbitkan di situs”.

---

## 4. Pemetaan data

| AniList | Captnime |
| --- | --- |
| `title.english → romaji → native` | `title` |
| `title.romaji` / `title.native` lain | `titleAlt` |
| `description` (HTML → teks) | `synopsis` |
| `TV`, `MOVIE`, `OVA`, `ONA`, `SPECIAL`/`MUSIC` | `TV`, `Movie`, `OVA`, `ONA`, `Special` |
| `RELEASING`, `HIATUS` | `ongoing` |
| `NOT_YET_RELEASED` | `upcoming` |
| `FINISHED`, `CANCELLED` | `completed` |
| `averageScore / 10` | `score` |
| `isAdult` | `rating` (`17+` / `13+`) |
| `coverImage.color` (digelapkan 45%) + warna asli | `palette[0]`, `palette[1]` |
| `coverImage.extraLarge` | `poster` |
| `bannerImage` | `banner` |
| `studios(isMain: true).nodes[0]` | `studio` |
| `genres[]` | `genres` (maks 6, genre baru dibuat otomatis) |
| `nextAiringEpisode.airingAt` → WIB | `broadcastDay`, `broadcastTime` |
| `id` | `anilist_id` (dipakai untuk sinkronisasi jadwal) |

Nama genre dari AniList berbahasa Inggris (`Action`, `Fantasy`). Bila katalog
Anda memakai nama Indonesia (`Aksi`, `Fantasi`), impor menghasilkan dua ejaan
genre yang berbeda. Ini disengaja: lebih baik terlihat apa adanya daripada
menerjemahkan otomatis dan salah. Rapikan di editor bila perlu.

---

## 5. Konfigurasi

```bash
# default: https://graphql.anilist.co
CAPTNIME_ANILIST_ENDPOINT=
```

Endpoint bisa diganti untuk:

- **proxy** di lingkungan yang memblokir `anilist.co`,
- **mock server** saat pengujian otomatis (dipakai pada uji di repo ini),
- gateway internal yang menambahkan cache.

Batasan yang perlu diingat:

- AniList membatasi ±**90 permintaan/menit** per IP. Pencarian dibatasi 12 hasil
  dan tidak ada permintaan otomatis di latar belakang.
- Timeout permintaan 8 detik; bila gagal, panel menampilkan pesan dan tidak ada
  data setengah jadi yang tersimpan.
- Poster/banner dimuat langsung dari CDN AniList. Bila ingin mandiri, unduh
  gambarnya dan isi URL poster sendiri di editor.

---

## 6. Atribusi & ketentuan

Metadata berasal dari AniList dan ditampilkan dengan atribusi di halaman impor.
API AniList bersifat publik, tetapi tetap milik mereka — jangan menyalahgunakan
(mis. scraping massal di luar kuota) dan jangan menghapus atribusinya.

AniList **tidak** memberikan hak tayang atas anime yang bersangkutan. Impor
metadata tidak mengubah kewajiban lisensi video — lihat `SUMBER-KONTEN.md`.

---

## 7. Kalau ingin sumber metadata lain

`src/lib/metadata/anilist.ts` hanya berisi tiga hal: query GraphQL, fungsi
pemetaan `toDraft()`, dan dua fungsi publik (`searchAnime`, `getAnimeById`).
Menambah penyedia lain (mis. Jikan/MyAnimeList, TMDB, atau API internal) cukup
membuat modul serupa yang mengembalikan `MetadataDraft` — halaman impor dan
aksi penyimpanan tidak perlu diubah.
