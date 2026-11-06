# Menjalankan & Menguji di Komputer Sendiri

Panduan ini untuk memasang Captnime dari nol di komputer Anda — termasuk
Windows lewat Visual Studio Code — lalu menguji alur akun dan email.

Ditulis berdasarkan percobaan nyata di Windows: setiap masalah di §7 benar-benar
muncul saat menyiapkan, dan penyebabnya sudah dipastikan.

---

## 1. Prasyarat

| Kebutuhan | Versi | Cara memeriksa |
| --- | --- | --- |
| Node.js | **22.13 atau lebih baru** | `node -v` |
| npm | ikut Node | `npm -v` |
| Git | apa saja | `git --version` |
| VS Code | apa saja (opsional) | — |

Kenapa Node-nya ketat:

- `node:sqlite` (dipakai untuk database) baru ada sejak **Node 22.5** dan bisa
  dipakai tanpa flag sejak **22.13**.
- Sejak **Node 22.12** Node boleh `require()` modul ESM. Tailwind 4 memakai
  `magic-string` yang ESM-only, jadi Node lebih lama akan gagal dengan
  `ERR_REQUIRE_ESM`.

Versi yang dipakai pengembangan tercatat di `.nvmrc`:

```bash
nvm use        # macOS/Linux/macOS + nvm, atau fnm/asdf
```

---

## 2. Ambil kode

**Lewat VS Code:** `Ctrl+Shift+P` → **Git: Clone** → tempel URL repo → pilih
folder → **Open**.

**Lewat terminal** (terminal terintegrasi VS Code: `` Ctrl+` ``):

```bash
git clone https://github.com/Yoannnnnnnn/captnime.git
cd captnime
git checkout arena/e163ab39-captnime
npm ci
```

`npm ci` memasang persis versi di `package-lock.json`, sehingga hasilnya sama
dengan yang sudah diuji. Pakai `npm install` hanya bila Anda memang ingin
memperbarui dependensi.

---

## 3. Konfigurasi `.env.local`

Buat berkas bernama `.env.local` **di akar repo** (sudah masuk `.gitignore`,
jadi tidak akan ikut ter-commit). Isi minimal untuk mencoba di komputer:

```bash
# katalog demo, supaya beranda tidak kosong
CAPTNIME_DATA_SOURCE=local

# opsional: tanpa ini panel admin memakai sandi "admin"
CAPTNIME_ADMIN_PASSWORD=admin
```

Untuk mengaktifkan email, tambahkan nilai **asli** dari akun Mailjet:

```bash
MJ_APIKEY_PUBLIC=<API Key dari Account Settings → API Key Management>
MJ_APIKEY_PRIVATE=<Secret Key pasangannya>
CAPTNIME_MAIL_FROM=<alamat pengirim yang SUDAH divalidasi di Mailjet>
CAPTNIME_MAIL_FROM_NAME=Captnime
CAPTNIME_APP_URL=http://localhost:3000
```

Hal yang sering salah:

- `MJ_APIKEY_PUBLIC`/`MJ_APIKEY_PRIVATE` **bukan** email login dan **bukan**
  kata sandi akun Mailjet.
- `CAPTNIME_MAIL_FROM` harus alamat yang statusnya **Active** di
  *Senders & Domains*. Alamat yang masih *pending* akan ditolak `400`.
- Nilai contoh dari `.env.example` (`xxxx`, `alamat-yang-sudah-divalidasi@…`)
  **sengaja ditolak** oleh aplikasi: fitur email dianggap belum aktif, bukan
  "gagal dikirim". Ganti dengan nilai asli.
- `CAPTNIME_MAIL_SANDBOX=1` membuat Mailjet memvalidasi payload **tanpa
  mengirim** email. Pakai untuk percobaan pertama, hapus untuk kirim sungguhan.

Perubahan `.env.local` baru berlaku setelah server di-restart.

---

## 4. Menjalankan

```bash
npm run dev      # http://localhost:3000 — mode pengembangan (dianjurkan saat menguji)
```

```bash
npm run build && npm start   # meniru produksi
```

Semua skrip berjalan di PowerShell, cmd, macOS, dan Linux. Port/host diatur
lewat env:

```bash
PORT=3001 npm start            # macOS/Linux
$env:PORT=3001; npm start      # PowerShell
```

Catatan Windows:

- Jangan mengarahkan `CAPTNIME_APP_URL` ke port lain selain port yang benar-benar
  dipakai; kalau tidak, tautan di email akan menunjuk halaman yang tidak ada.
- Bila Windows Defender menanyakan izin jaringan saat Next membuka port, pilih
  *Allow* untuk jaringan privat.
- `npm run clean` menghapus `.next` dan `.next-build`. Jalankan bila build/start
  berperilaku aneh setelah mengganti versi Node.

Server berjalan di latar depan dan **menahan terminal** — itu normal. Prompt
tidak kembali bukan berarti macet. Untuk perintah lain, buka terminal kedua
(`Ctrl+Shift+5`); untuk berhenti, `Ctrl+C` di terminal server.

---

## 5. Periksa kredensial email tanpa membuka aplikasi

```bash
npm run cek-email -- --dry        # hanya membaca & memeriksa konfigurasi
npm run cek-email                 # kirim satu email uji ke CAPTNIME_MAIL_FROM
npm run cek-email -- --to=anda@contoh.com   # kirim ke alamat lain
```

Skrip ini mencetak kunci dalam bentuk tersamarkan, menjelaskan masalah yang
ditemukan, dan memberi petunjuk untuk `401`/`400`. Gunanya memisahkan masalah
Mailjet dari masalah aplikasi: kalau skrip ini berhasil, sisa masalahnya ada di
konfigurasi aplikasi, bukan di kredensial.

---

## 6. Menguji alur email di aplikasi

Pantau **terminal tempat `npm run dev` berjalan** — di sanalah baris `[email] …`
muncul saat pengiriman gagal.

1. **Daftar** di `/daftar`. Anda diarahkan ke `/akun` dengan salah satu dari:
   - `?verifikasi=dikirim` → Mailjet menerima,
   - `?verifikasi=belum-aktif` → konfigurasi belum siap (log menyebut alasannya),
   - `?verifikasi=gagal` → Mailjet menolak (ada baris `[email]` di terminal).
2. **Verifikasi**: buka tautan di email → halaman `/verifikasi` → tekan tombol.
   Halaman itu sengaja tidak memverifikasi saat dibuka, supaya pemindai tautan
   di klien email tidak memverifikasi akun atas nama pemiliknya.
3. **Reset sandi**: keluar → `/lupa-sandi` → tautan `/atur-ulang` → sandi baru.
   Sandi lama harus ditolak, sandi baru diterima, sesi lain keluar.
4. **Sebelum verifikasi**, sinkronisasi server sengaja dikunci: `PUT
   /api/me/progress`, `POST /api/me/watchlist`, dan `POST /api/me/import`
   menjawab `403`. Data tetap tersimpan di peramban (mode tamu) dan disalin ke
   akun setelah email terverifikasi. Menonton tetap bisa.
5. **Kirim ulang** tautan: tombol di banner `/akun`, dibatasi 6 kali per 15 menit.

---

## 7. Masalah yang sudah pernah muncul

| Gejala | Penyebab | Solusi |
| --- | --- | --- |
| `ERR_REQUIRE_ESM: require() of ES Module ... magic-string/dist/index.mjs` | Node lebih lama dari 22.12, sementara Tailwind memakai paket ESM-only | Pasang Node 22.13+ (lihat `.nvmrc`), lalu `npm run clean` |
| `Cannot find module 'node:sqlite'` | Node 20 atau 22.5–22.12 | Sama: naikkan Node |
| `Could not find a production build in the '.next' directory` | `next start` dijalankan sebelum `next build`, atau build dan start memakai folder berbeda | `npm run build` lalu `npm start`; jangan mencampur `NEXT_DIST_DIR` |
| `'NEXT_DIST_DIR' is not recognized` / `${HOST…}` aneh di Windows | Skrip lama memakai sintaks bash | Sudah diperbaiki: pakai `npm run dev`/`build`/`start` |
| Email "gagal dikirim" padahal `.env.local` sudah diisi | Nilainya masih placeholder (`xxxx`) atau API Key tertukar dengan sandi akun | `npm run cek-email -- --dry`, ganti dengan nilai asli |
| Sender di Mailjet berstatus *pending* | Percobaan kirim dari alamat yang belum divalidasi membuat Mailjet mengantrekan validasi baru | Klik tautan konfirmasi di inbox alamat itu, atau hapus entri tersebut dan pakai alamat yang Active |
| `[email] Mailjet menolak (400)` | `CAPTNIME_MAIL_FROM` belum divalidasi / tidak sama dengan alamat yang dikonfirmasi | Validasi alamat di *Senders & Domains* |
| `[email] Mailjet menolak (401)` | API Key/Secret Key salah atau akun belum aktif | Salin ulang dari *API Key Management*; selesaikan aktivasi akun |
| Email diterima Mailjet tetapi tidak sampai | `CAPTNIME_MAIL_SANDBOX=1` masih aktif, atau masuk spam | Hapus variabel sandbox; periksa spam dan *Email activity* Mailjet |
| Halaman kosong tanpa judul | `CAPTNIME_DATA_SOURCE` bukan `local` dan database masih kosong | Set `CAPTNIME_DATA_SOURCE=local` |
| `Port 3000 is in use` | Server lain masih berjalan | Hentikan dengan `Ctrl+C`, atau `PORT=3001 npm run dev` (dan sesuaikan `CAPTNIME_APP_URL`) |

---

## 8. Memeriksa database

Akun, sesi, riwayat, dan token email disimpan di `data/captnime.db` (SQLite,
diabaikan Git). Melihat isinya tanpa alat tambahan:

```bash
node -e "const{DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('data/captnime.db');console.log(db.prepare('select email,email_verified_at from users').all())"
```

Di VS Code, ekstensi **SQLite Viewer** bisa membuka berkas itu secara visual.

---

## 9. Membersihkan jejak uji

- **Hapus akun tertentu:** `/akun` → bagian *Hapus akun* (perlu sandi dan
  mengetik `HAPUS`). Riwayat, daftar tonton, sesi, dan token emailnya ikut
  terhapus.
- **Mulai dari nol:** hentikan server, hapus `data/captnime.db` (beserta
  `-wal`/`-shm` bila ada), jalankan lagi. Database dibuat ulang otomatis.
- **Jangan** menghapus baris `users` langsung lewat SQL tanpa
  `PRAGMA foreign_keys = ON`, karena sesi/token akan tertinggal sebagai data
  yatim.
