# Akun Pengguna (Fase 2)

Dokumen ini menjelaskan cara kerja autentikasi Captnime, penyimpanan riwayat
dan daftar tonton di akun, serta batasannya.

---

## 1. Ringkasan

| Hal | Nilai |
| --- | --- |
| Metode | Email + kata sandi (tanpa verifikasi email) |
| Hash kata sandi | scrypt, N=16384, r=8, p=1, salt acak 16 byte |
| Sesi | Token acak 32 byte di cookie; yang disimpan hanya SHA-256-nya |
| Masa sesi | 30 hari (cookie `httpOnly`, `SameSite=Lax`) |
| Penyimpanan | Tabel `users`, `sessions`, `watchlist`, `progress` di SQLite yang sama dengan katalog |
| Halaman | `/masuk`, `/daftar`, `/akun` |
| Tamu | Tetap bisa menonton; data disimpan di `localStorage` |

Tidak ada dependensi baru — semuanya memakai `node:crypto` dan `node:sqlite`.
Untuk OAuth (Google/GitHub), verifikasi email, atau reset kata sandi lewat email,
pasang better-auth/NextAuth lalu petakan ke tabel `users` yang sudah ada.

---

## 2. Alur

```
Daftar  → validasi → hash scrypt → INSERT users → sesi dibuat → /akun
Masuk   → cari user → verifikasi scrypt → sesi dibuat → /akun (atau ?next=)
Keluar  → hapus baris sesi → hapus cookie → /
```

- `?next=` hanya menerima path internal (`/...`), sehingga tidak bisa dipakai
  untuk open redirect.
- Setelah login, `SessionProvider` memanggil `/api/me`, lalu berpindah mode dari
  `localStorage` ke server. Data tamu yang ada disalin ke akun **sekali**
  (server yang lebih baru menang), lalu kunci localStorage dibersihkan.

---

## 3. Tabel

```sql
users     (id, email UNIQUE, name, password_hash, created_at)
sessions  (token_hash PK, user_id FK, expires_at, created_at)
progress  (user_id, anime_slug, episode_number, position, duration, updated_at)
watchlist (user_id, anime_slug, added_at)
```

- `progress` satu baris per judul: episode terakhir + posisi dalam detik,
  persis bentuk yang dibutuhkan panel “Lanjut Tonton”.
- `sessions.expires_at` disimpan sebagai epoch milidetik agar perbandingan
  tidak bergantung pada zona waktu basis data.
- Semua foreign key `ON DELETE CASCADE`; menghapus user menghapus sesi,
  riwayat, dan daftar tontonnya.

---

## 4. Endpoint klien

Dipakai `src/lib/user-store.ts`; semuanya memerlukan sesi (kecuali `/api/me`
yang mengembalikan `{ user: null }` untuk tamu).

| Endpoint | Fungsi |
| --- | --- |
| `GET /api/me` | Identitas pengguna + jumlah daftar tonton/riwayat |
| `GET /api/me/state` | Riwayat + daftar tonton lengkap dengan metadata judul |
| `PUT /api/me/progress` | Simpan progres (`slug, episode, position, duration`) |
| `DELETE /api/me/progress?slug=` | Hapus satu judul dari riwayat |
| `DELETE /api/me/progress?all=1` | Bersihkan seluruh riwayat |
| `POST /api/me/watchlist` | Tambah/hapus (`{ slug, inList }`) |
| `DELETE /api/me/watchlist?slug=` | Hapus dari daftar tonton |
| `POST /api/me/import` | Salin data tamu ke akun (sekali saat login) |

Metadata judul (`title`, `palette`, `motif`, `poster`) diambil dari provider
yang sedang aktif, jadi benar baik katalog berasal dari seed maupun database.

### Throttle penulisan progres

Pemutar menyimpan posisi tiap 5 detik. Di mode akun, penulisan ke server
dibatasi **15 detik per judul** (nilai terbaru diantrekan lalu dikirim), dan
sisa antrean dikirim saat halaman ditutup (`pagehide`/`beforeunload`).
Ini mencegah ratusan UPDATE per sesi menonton tanpa kehilangan progres.

---

## 5. Keamanan

- **Password**: scrypt + salt acak; verifikasi memakai `timingSafeEqual`.
  Parameter disimpan di dalam hash (`scrypt$N$salt$hash`) sehingga bisa
  dinaikkan tanpa mematahkan hash lama.
- **Sesi**: token mentah hanya ada di cookie; database menyimpan SHA-256-nya.
  Bocornya isi tabel `sessions` tidak langsung memberi token yang bisa dipakai.
- **Cookie**: `httpOnly` (tidak terbaca JavaScript), `SameSite=Lax`
  (cookie tidak ikut pada POST lintas situs — mitigasi CSRF), dan `Secure`
  hanya saat permintaan lewat HTTPS agar `npm start` di `http://localhost`
  tetap bisa login.
- **Pembatasan percobaan**: maksimal 6 percobaan gagal per IP+email dalam
  15 menit. Disimpan di memori proses — cukup untuk satu instans, tetapi
  **reset saat server restart** dan tidak dibagi antar instans. Untuk
  multi-instans, pindahkan ke Redis atau tabel database.
- **Middleware**: `/akun` tanpa cookie langsung 307 ke `/masuk?next=/akun`.
  Verifikasi sesi sebenarnya tetap di `requireUser()` (halaman) dan
  `getCurrentUser()` (API).
- **Enumerasi akun**: pesan galat login sengaja seragam (“email atau kata sandi
  tidak cocok”), tetapi pendaftaran tetap memberi tahu bila email sudah dipakai
  (trade-off yang disadari demi kegunaan).

---

## 6. Batasan yang belum dikerjakan

1. **Belum ada verifikasi email** — siapa pun bisa mendaftar dengan email orang lain.
2. **Belum ada reset kata sandi / ganti kata sandi** di UI.
3. **Belum ada hapus akun** dari UI (bisa lewat SQL manual).
4. **Belum ada login sosial (OAuth)** atau 2FA.
5. **Belum ada peran**: admin panel masih memakai kata sandi lingkungan terpisah,
   bukan akun pengguna.
6. **Watchlist belum dibatasi** jumlahnya; riwayat dibatasi 60 judul terakhir.

Semuanya perlu diselesaikan sebelum aplikasi dibuka untuk publik.

---

## 7. Membuat akun admin dari akun pengguna?

Belum — panel `/admin` sengaja memakai kredensial lingkungan
(`CAPTNIME_ADMIN_PASSWORD`) agar terpisah dari akun penonton. Bila nanti ingin
satu sistem identitas, tambahkan kolom `role` di `users` lalu ganti
`requireAdmin()` agar memeriksa peran tersebut.

---

## 8. Uji manual cepat

```bash
# daftar
curl -i -c /tmp/c.txt -X POST http://localhost:3000/daftar ...   # lewat peramban lebih mudah

# cek sesi
curl -s -b /tmp/c.txt http://localhost:3000/api/me

# simpan progres
curl -s -b /tmp/c.txt -X PUT http://localhost:3000/api/me/progress \
  -H 'Content-Type: application/json' \
  -d '{"slug":"langit-kedua","episode":3,"position":300,"duration":1440}'
```

Lihat juga `docs/DATABASE.md` untuk lokasi file database dan cara backup.
