# Email Transaksional (Mailjet)

Dokumen ini menjelaskan verifikasi email dan reset kata sandi lewat email,
beserta cara menyiapkan Mailjet sebagai pengirimnya.

Ringkasnya: **tidak perlu SDK baru** — cukup `fetch` ke Mailjet Send API v3.1,
dan **tidak wajib punya domain**. Satu alamat email yang sudah divalidasi
sudah bisa dipakai sebagai pengirim.

---

## 1. Kenapa Mailjet

| | Paket gratis Mailjet |
| --- | --- |
| Kuota | 6.000 email/bulan |
| Batas harian | 200 email/hari (batas keras, bukan rata-rata) |
| Sifat | permanen, bukan uji coba |
| API | REST v3.1 (Basic auth) + SMTP relay + webhook |

Untuk verifikasi akun dan reset kata sandi, batas harian itu jauh lebih dari
cukup. Yang perlu diwaspadai hanya lonjakan pendaftaran: setelah 200 email
dalam satu hari, pesan berikutnya **diantrekan** dan baru dilepas keesokan
hari (dan dihapus bila tiga hari tidak terkirim).

Alternatif dengan API serupa: Resend, Brevo, Mailgun, Postmark. Yang berubah
hanya endpoint dan bentuk autentikasinya — bagian lain dokumen ini tetap
berlaku.

---

## 2. Konfigurasi

```bash
# API Key & Secret Key dari Mailjet (Account > API Key Management).
# BUKAN email dan BUKAN sandi akun Anda.
MJ_APIKEY_PUBLIC=
MJ_APIKEY_PRIVATE=

# Alamat pengirim yang sudah divalidasi di Mailjet.
CAPTNIME_MAIL_FROM=halo@domain-anda.com
CAPTNIME_MAIL_FROM_NAME=Captnime

# Basis tautan absolut di dalam email. Wajib diisi saat produksi.
CAPTNIME_APP_URL=https://captnime.id

# Opsional, hanya untuk uji lokal:
CAPTNIME_MAILJET_ENDPOINT=http://127.0.0.1:4011/v3.1/send
CAPTNIME_MAIL_SANDBOX=1
```

**Nilai placeholder ditolak.** `.env.example` berisi `MJ_APIKEY_PUBLIC=xxxx…`,
dan `xxxx` lolos pemeriksaan "ada isinya". Karena itu `emailConfigStatus()`
menolak nilai yang berbentuk contoh (mengandung `xxxx`, berawalan `ganti-`,
`contoh`, `changeme`, atau `alamat-yang-sudah-divalidasi@…`), serta memeriksa
bentuk alamat pengirim. Tanpa penjagaan ini, salah tempel muncul sebagai
"email gagal dikirim" (Mailjet menolak `401`) alih-alih "email belum aktif" —
pesan yang menyesatkan saat menyiapkan server. Ini pengalaman nyata dari
pengujian pertama.

Bila `MJ_APIKEY_PUBLIC`, `MJ_APIKEY_PRIVATE`, atau `CAPTNIME_MAIL_FROM` kosong
**atau masih placeholder**, fitur email dianggap **mati dengan sopan**
(alasannya dicetak di log server dan dijelaskan di halaman `/akun`):

- pendaftaran tetap berhasil dan pengguna tetap bisa menonton;
- `/lupa-sandi` menampilkan pesan bahwa pengiriman email belum aktif dan
  mengarahkan ke kode pemulihan;
- tidak ada error 500, tidak ada percobaan pengiriman.

### Langkah menyiapkan Mailjet

1. Daftar di mailjet.com, lalu buka **Account Settings → API Key Management**
   dan salin API Key + Secret Key.
2. Buka **Account Settings → Senders & Domains → Add a domain or sender
   address**.
   - **Add a sender address** — masukkan alamat yang Anda kendalikan, lalu
     klik tautan konfirmasi yang dikirim ke kotak masuk alamat itu. Cukup ini
     untuk mulai; tidak perlu DNS.
   - **Add domain** — tambahkan TXT/DKIM di DNS domain Anda. Lebih baik untuk
     produksi: pengirim tampil sebagai domain sendiri (bukan “via mailjet”).
3. Isi `CAPTNIME_MAIL_FROM` dengan alamat yang barusan divalidasi. Kalau
   memvalidasi domain, alamat apa pun di domain itu boleh dipakai.
4. Isi `CAPTNIME_APP_URL` dengan URL publik situs. Tanpa ini tautan memakai
   host permintaan yang sedang berjalan — bisa salah bila di belakang proxy.
5. Kirim satu email percobaan (lihat §7) sebelum mengumumkan fitur ini.

---

## 3. Alur verifikasi email

```
/daftar ──► buat user ──► sesi aktif ──► email "Verifikasi email Captnime"
                                            │
                                            ▼
                              /verifikasi?token=…  (halaman, belum mengubah apa pun)
                                            │  tekan tombol
                                            ▼
                        verifyEmailAction (POST) ──► users.email_verified_at
                                            │
              ┌─────────────────────────────┴──────────────────────────┐
              ▼                                                        ▼
   /akun?verifikasi=berhasil                          /masuk?verifikasi=1
   (bila sesi masih milik pengguna itu)               (bila dibuka di perangkat lain)
```

Poin penting:

- **Verifikasi lewat POST, bukan GET.** Halaman `/verifikasi` hanya menampilkan
  tombol; token baru dipakai saat tombol ditekan. Ini mencegah pemindai tautan
  di klien email “memverifikasi” akun tanpa sepengetahuan pemiliknya.
- **Tautan berlaku 24 jam** dan **sekali pakai**. Membuat tautan baru
  membatalkan tautan lama (`email_tokens` menyimpan satu baris per
  pengguna+tujuan).
- **Kirim ulang** dibatasi 6 kali / 15 menit per pengguna. Tombolnya ada di
  banner `/akun` dan di halaman `/verifikasi` saat tautan gagal.

### Kebijakan: verifikasi bersifat lunak

Pengguna yang belum verifikasi **tetap bisa masuk dan menonton**. Yang dikunci
hanya sinkronisasi server:

| Fitur | Sebelum verifikasi |
| --- | --- |
| Menonton, jelajah, jadwal | jalan normal |
| Daftar tonton & riwayat | tersimpan di `localStorage` peramban (mode tamu) |
| `PUT /api/me/progress`, `POST /api/me/watchlist`, `POST /api/me/import` | **403** `{ "error": "verifikasi" }` |
| `GET /api/me/state` | tetap 200 (baca saja) |

Di sisi klien, `SessionProvider` hanya mengaktifkan mode server bila
`user.emailVerified` benar. Jadi tidak ada tulis server yang ditolak di
tengah jalan dan tidak ada data yang “hilang”: data peramban tetap ada, lalu
disalin ke akun (`/api/me/import`) begitu email terverifikasi.

Gerbang di API tetap dipasang sebagai lapis kedua, supaya aturan ini tidak
hanya bergantung pada UI.

---

## 4. Alur reset kata sandi

```
/lupa-sandi ──► masukkan email ──► requestResetAction
                                      │  (respons SELALU sama: "kalau terdaftar, tautan dikirim")
                                      ▼
                         email "Atur ulang kata sandi Captnime" (berlaku 60 menit)
                                      │
                                      ▼
                     /atur-ulang?token=… ──► sandi baru ──► completeResetAction
                                      │
                                      ├─ password_hash diperbarui
                                      ├─ recovery_hash dikosongkan
                                      └─ semua sesi lama dihapus → /masuk?reset=1
```

- **Tidak bisa dipakai menebak email terdaftar.** Alamat yang tidak ada
  mendapat pesan dan halaman yang sama persis, dan tidak ada email terkirim.
- **Token sekali pakai + 60 menit.** Input yang gagal validasi (sandi pendek,
  konfirmasi beda) **tidak** menghanguskan token — pengguna bisa memperbaiki
  isian di halaman yang sama.
- Permintaan tautan dibatasi 6 kali / 15 menit per IP+email.

### Kode pemulihan tetap ada

Kode `CPT-XXXX-XXXX-XXXX` dari `/akun` masih berfungsi dan sekarang menjadi
**jalan cadangan** bila email tidak bisa dibuka. Formulirnya ada di
`/lupa-sandi` dalam panel “Punya kode pemulihan?”. Reset yang berhasil lewat
email akan mengosongkan `recovery_hash`, jadi kode lama tidak lagi berlaku
setelah kata sandi diganti — buat kode baru bila masih ingin menyimpannya.

---

## 5. Keamanan

- **Token tidak disimpan mentah.** Database hanya berisi SHA-256-nya
  (`email_tokens.token_hash`). Isi database yang bocor tidak memberi tautan
  yang bisa dipakai. Tautan asli hanya ada di kotak masuk pengguna.
- **Tautan di email selalu absolut** dan memakai `CAPTNIME_APP_URL`, bukan
  host yang dikirim klien.
- **Satu token aktif per tujuan.** Permintaan baru menghapus baris lama.
- **Tidak ada enumerasi** di jalur reset; jalur daftar memang masih memberi
  tahu bila email sudah terpakai (trade-off yang disadari).
- **Kegagalan pengiriman tidak pernah membocorkan isi email** ke halaman:
  hanya kode status (`http-401`, `jaringan`, dst.) yang masuk log server.
- **Batas percobaan disimpan di memori proses.** Cukup untuk satu instans;
  hilang saat restart dan tidak dibagi antar instans. Untuk produksi
  multi-instans, pindahkan ke Redis atau tabel database.

---

## 6. Tabel `email_tokens`

| Kolom | Isi |
| --- | --- |
| `token_hash` | SHA-256 token (PK) |
| `user_id` | pemilik, `ON DELETE CASCADE` |
| `purpose` | `verify` atau `reset` |
| `email` | tujuan saat dikirim (jejak audit) |
| `expires_at` | epoch milidetik |
| `created_at` | waktu dibuat |

Baris kedaluwarsa tidak menumpuk: token dihapus saat dipakai, dan
`purgeExpiredEmailTokens()` tersedia untuk pembersihan berkala.

---

## 7. Pengujian

### Otomatis (tanpa jaringan keluar)

Sandbox pengembangan tidak bisa menjangkau `api.mailjet.com`, jadi pengujian
memakai server tiruan:

```bash
python3 /tmp/mock_mailjet.py            # port 4011, simpan pesan ke /tmp/mailjet_outbox.jsonl
CAPTNIME_MAILJET_ENDPOINT=http://127.0.0.1:4011/v3.1/send \
MJ_APIKEY_PUBLIC=kunci-publik MJ_APIKEY_PRIVATE=rahasia \
CAPTNIME_MAIL_FROM=halo@captnime.test CAPTNIME_APP_URL=http://127.0.0.1:3000 \
npm start
python3 /tmp/uji_email.py              # 53 pemeriksaan
```

Server tiruan ikut memvalidasi hal yang akan ditolak Mailjet sungguhan:
Basic auth wajib benar, `From.Email`, `To`, `Subject`, dan `TextPart`/
`HTMLPart` harus ada, maksimal 50 pesan per panggilan.

### Periksa kredensial tanpa aplikasi

```bash
npm run cek-email -- --dry     # baca & periksa konfigurasi saja
npm run cek-email              # kirim satu email uji ke CAPTNIME_MAIL_FROM
npm run cek-email -- --to=anda@contoh.com
```

Skrip ini menyamarkan kunci, menjelaskan masalah yang ditemukan, dan memberi
petunjuk untuk `401`/`400`. Kalau skrip berhasil, masalahnya bukan di
kredensial — melainkan di konfigurasi aplikasi.

### Kirim sungguhan

Ini **tidak bisa** dibuktikan dari sandbox — harus dijalankan dengan kredensial
asli. **Status: sudah diverifikasi operator** (2026-11-06) dengan sender Gmail
yang divalidasi: email verifikasi diterima, tombol `/verifikasi` berfungsi, dan
reset lewat email menyelesaikan alurnya. Catatan dari percobaan itu: alamat
pengirim yang salah ketik di `.env.local` membuat Mailjet membuat entri sender
berstatus *pending*, dan pengiriman ditolak `400` sampai alamat yang benar
dipakai — sekarang kasus itu tertangkap lebih awal oleh penjagaan placeholder
dan `npm run cek-email`. Langkahnya:

```bash
CAPTNIME_MAIL_SANDBOX=1 npm start     # validasi payload tanpa benar-benar mengirim
```

Lalu daftar akun baru dan periksa kotak masuk `CAPTNIME_MAIL_FROM`. Setelah
yakin, hapus `CAPTNIME_MAIL_SANDBOX` agar email benar-benar terkirim.

Yang perlu diperiksa pada pengiriman nyata: masuk kotak masuk (bukan spam),
tautan membuka domain yang benar, dan tombol di `/verifikasi` berfungsi dari
ponsel.

---

## 8. Batasan yang belum dikerjakan

1. **Belum ada webhook status kirim** (bounce/complaint). Alamat yang selalu
   gagal belum otomatis ditandai; pantau dashboard Mailjet.
2. **Belum ada ganti alamat email** di `/akun` — karena itu belum ada alur
   “verifikasi ulang alamat baru”. `clearEmailVerified()` sudah tersedia untuk
   dipakai saat fitur itu dibuat.
3. **Belum ada verifikasi ulang saat masuk dari perangkat baru.**
4. **Belum ada antrean/coba-ulang otomatis** bila Mailjet sedang gagal.
   Pengguna cukup menekan “kirim ulang” (dibatasi 6 kali / 15 menit).
5. **Batas harian 200 email** pada paket gratis Mailjet; untuk lonjakan
   pendaftaran perlu paket berbayar atau pembatasan pendaftaran.
6. **Belum ada 2FA berbasis email.**

Lihat `docs/AUTENTIKASI.md` untuk keseluruhan alur akun dan
`.env.example` untuk daftar variabel lingkungan.
