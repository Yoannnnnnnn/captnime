# Database & Panel Admin (Fase 1)

Dokumen ini menjelaskan cara kerja basis data Captnime, cara memakai panel admin,
dan langkah memindahkan basis data ke Postgres saat naik produksi.

---

## 1. Ringkasan

| Hal | Nilai |
| --- | --- |
| Mesin | SQLite lewat modul bawaan Node 22, `node:sqlite` (`DatabaseSync`) |
| Lokasi default | `data/captnime.db` |
| Skema | `src/lib/db/schema.sql` |
| Akses data | `src/lib/db/repository.ts` (satu-satunya lapisan SQL) |
| Pemakai data | `src/lib/providers/database.ts` → `getProvider()` |
| Panel admin | `/admin` (login di `/admin/login`) |

**Kenapa bukan Prisma + Postgres sekarang?** Lingkungan pengembangan ini tidak
punya server Postgres, dan Prisma butuh engine biner yang tidak bisa diunduh di
sini. `node:sqlite` memberi perilaku SQL sungguhan tanpa dependensi eksternal.
Skema dan seluruh query sengaja ditulis portabel agar pindah ke Postgres nanti
tidak menyentuh UI sama sekali.

> Catatan jujur: `node:sqlite` masih ditandai *experimental* di Node 22. Untuk
> produksi dengan banyak penulis serentak, Postgres tetap pilihan yang benar.

---

## 2. Menyalakan mode database

```bash
# .env.local
CAPTNIME_DATA_SOURCE=database
CAPTNIME_ADMIN_PASSWORD=ganti-dengan-sandi-kuat
# opsional:
# CAPTNIME_ADMIN_SECRET=rahasia-penanda-tangan-cookie
# CAPTNIME_DB_PATH=/var/data/captnime.db
# CAPTNIME_DATA_DIR=/var/data
```

Lalu:

```bash
npm run build && npm start
```

Variabel lain:

| Variabel | Fungsi |
| --- | --- |
| `CAPTNIME_DATA_SOURCE` | `local` (default) · `database` · `remote` |
| `CAPTNIME_DB_PATH` | Path file SQLite (menang atas `CAPTNIME_DATA_DIR`) |
| `CAPTNIME_DATA_DIR` | Folder database; nama file tetap `captnime.db` |
| `CAPTNIME_SCHEMA_PATH` | Path `schema.sql` bila lokasi standar tidak terdeteksi |
| `CAPTNIME_ADMIN_PASSWORD` | Kata sandi panel admin (default `admin` bila kosong) |
| `CAPTNIME_ADMIN_SECRET` | Kunci HMAC cookie sesi; bila kosong memakai password |

**Penting:** panel admin selalu menulis ke SQLite, tetapi situs publik hanya
membacanya bila `CAPTNIME_DATA_SOURCE=database`. Bila masih `local`, panel
menampilkan peringatan merah di bagian atas — perubahan tersimpan tapi belum
tampil di situs.

---

## 3. Skema

```
anime ──┬── anime_genres ── genres
        └── episodes ──┬── servers
                       └── subtitles
```

- `anime` — metadata judul, palet poster, `featured`, `published` (kontrol
  tampil / soft delete), dan `anilist_id` (sumber metadata, dipakai untuk
  sinkronisasi jadwal tayang). `slug` unik dan menjadi URL publik.
- `genres` + `anime_genres` — relasi banyak-ke-banyak; genre baru dibuat otomatis
  saat disimpan dari panel.
- `episodes` — unik per (`anime_id`, `number`); menyimpan nomor sama akan
  memperbarui episode itu, bukan membuat duplikat.
- `servers` — tautan stream per episode (`hls`/`mp4`, kualitas, urutan tampil).
- `subtitles` — track `.vtt` per episode; satu track bisa ditandai default.

Kolom daftar sederhana (`tags`, `related_slugs`) disimpan sebagai CSV. Ini
pilihan pragmatis untuk satu tabel kecil; bila butuh pencarian per tag,
normalisasi jadi tabel relasi seperti `anime_genres`.

**Migrasi aditif.** `CREATE TABLE IF NOT EXISTS` tidak menambah kolom ke tabel
yang sudah ada, jadi `client.ts` memeriksa `PRAGMA table_info(anime)` dan
menjalankan `ALTER TABLE … ADD COLUMN` saat kolom baru belum ada (contoh:
`anilist_id`). Tidak perlu reset atau membuang database lama.

Semua foreign key memakai `ON DELETE CASCADE`, jadi menghapus judul otomatis
membersihkan episode, server, dan subtitle-nya.

---

## 4. Penyemaian data awal

Saat database masih kosong, `ensureSeeded()` (`src/lib/db/seed.ts`) menyalin 18
judul dari `src/lib/data/catalog.ts` beserta episode, server, dan subtitle.

- Idempoten: berhenti begitu tabel `anime` berisi data.
- Dipanggil otomatis oleh provider database dan dashboard admin.
- Setelah tersemai, **katalog TS bukan lagi sumber kebenaran** — kelola lewat
  panel. Menambah judul ke `catalog.ts` tidak akan mengubah database yang sudah
  terisi.

Mau mulai dari nol?

```bash
rm -f data/captnime.db data/captnime.db-wal data/captnime.db-shm
```

---

## 5. Panel admin

Buka `/admin`.

- **Masuk** memakai `CAPTNIME_ADMIN_PASSWORD`. Sesi disimpan sebagai cookie
  `captnime_admin` berisi kedaluwarsa + tanda tangan HMAC-SHA256, `httpOnly`,
  `SameSite=Lax`, berlaku 12 jam. Password tidak pernah disimpan di cookie.
- **Daftar judul** menampilkan jumlah episode, status terbit, dan waktu ubah.
- **Editor judul** memuat identitas, klasifikasi, genre (centang + genre baru),
  narasi, visual (gradien, motif, URL poster/banner), dan publikasi.
- **Editor episode** per baris: ubah detail, tambah/hapus server, tambah/hapus
  subtitle. Nomor episode berikutnya terisi otomatis.
- Setiap penyimpanan memanggil `revalidatePath()` untuk beranda, katalog,
  jadwal, halaman detail, dan halaman tonton — plus `databaseProvider.invalidate()`
  agar cache provider 5 detik tidak menyajikan data basi.
- `robots` untuk seluruh `/admin*` diset `noindex`.
- **Dua lapis penjagaan:** `src/middleware.ts` mengembalikan HTTP 307 untuk
  pengunjung tanpa cookie (middleware tidak bisa memverifikasi HMAC karena
  berjalan di Edge runtime), lalu setiap server action tulis memanggil
  `requireAdmin()` sendiri — karena action bisa dipanggil dari rute mana pun
  lewat header `Next-Action`, bukan hanya dari halaman panel.

Ganti kata sandi = ganti env lalu restart. Semua sesi lama otomatis tidak sah
karena kunci HMAC ikut berubah.

### Batasan yang perlu diketahui

- Satu kata sandi untuk semua operator; belum ada peran, audit log, atau akun
  per-editor.
- Panel menerima **URL** poster/stream/subtitle, belum ada unggah berkas.
- Daftar genre di sidebar publik masih memakai `ALL_GENRES` dari katalog statis;
  genre baru tetap muncul di panel filter katalog karena dihitung dari data
  provider, tetapi belum di sidebar.
- Semua query berjalan sinkron di event loop. Aman untuk katalog berukuran
  ratusan judul; ribuan judul sebaiknya pindah ke Postgres.

---

## 6. Operasional

**Persistensi.** File `.db` (dan `-wal`/`-shm`) harus berada di volume
persisten. Di Docker, mount volume ke `/var/data` lalu set
`CAPTNIME_DB_PATH=/var/data/captnime.db`. Jangan menyimpan database di dalam
image.

**`schema.sql` harus ikut terbaca saat runtime.** `src/lib/db/client.ts` mencari
berkas ini di beberapa lokasi umum (root proyek, `.next-build/server/chunks/`,
folder modul). Untuk deployment yang tidak menyertakan folder `src/`, salin
`schema.sql` ke image dan set `CAPTNIME_SCHEMA_PATH`.

**Backup.**

```bash
sqlite3 data/captnime.db ".backup 'backup-$(date +%F).db'"
```

Menyalin file `.db` saat proses berjalan juga bisa, tapi sertakan `-wal` atau
paksa checkpoint dulu. Cara paling aman: `sqlite3 ... ".backup ..."`.

**Penulisan serentak.** SQLite mengizinkan banyak pembaca, satu penulis. Panel
sudah memakai WAL + `busy_timeout 5000 ms`; ini cukup untuk panel admin dengan
satu-dua editor. Jangan membuka file yang sama dari beberapa proses penulis.

**Rendering.** Halaman publik memakai ISR (`revalidate = 300`). Prerender saat
build memakai katalog seed; setelah itu setiap penyimpanan dari panel memicu
revalidasi sehingga data database langsung tampil.

---

## 7. Pindah ke Postgres

Seluruh SQL terkumpul di `src/lib/db/repository.ts` dan `schema.sql`. Langkahnya:

1. Terjemahkan `schema.sql`:
   - `INTEGER PRIMARY KEY AUTOINCREMENT` → `GENERATED ALWAYS AS IDENTITY`
   - `datetime('now')` → `now()`
   - `TEXT` tetap; `INTEGER` untuk boolean diubah ke `BOOLEAN`
   - tambahkan `CREATE TYPE` atau `CHECK` untuk `type`/`status` bila mau ketat
2. Ganti `client.ts` dengan `pg` (`Pool`) atau Drizzle/Prisma.
3. Ubah placeholder `?` menjadi `$1, $2, …` di repository (atau pakai query
   builder yang menangani ini).
4. Ganti `INSERT … ON CONFLICT(slug) DO UPDATE` — sintaksnya sama di Postgres,
   hanya `excluded` yang juga sama, jadi bagian ini nyaris tidak berubah.
5. Semua pemanggil (`providers/database.ts`, halaman admin, server actions)
   tidak perlu diubah karena hanya memakai fungsi repository.

---

## 8. Perintah berguna

```bash
npm run typecheck                     # cek tipe
npm run build                         # build produksi ke .next-build
CAPTNIME_DATA_SOURCE=database npm start

# lihat isi database tanpa alat tambahan
node -e "const{DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('data/captnime.db');console.table(d.prepare('select slug,title,published from anime order by title').all())"
```
