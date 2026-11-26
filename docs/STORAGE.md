# Penyimpanan berkas

Captnime punya dua driver penyimpanan untuk berkas unggahan. Pemutar tidak
perlu tahu bedanya — `src/lib/media.ts` menandatangani URL saat render, dan
database hanya menyimpan penanda.

| Driver | Penanda di DB | Kapan dipakai |
| --- | --- | --- |
| `local` | `local:<id>` | default, berkas di `data/uploads/` (di luar `public/`) |
| `r2` | `r2:<key>` | bila `CAPTNIME_S3_*` lengkap, atau `CAPTNIME_STORAGE_DRIVER=r2` |

Driver dipilih otomatis: **keempat** nilai `CAPTNIME_S3_ENDPOINT`,
`CAPTNIME_S3_BUCKET`, `CAPTNIME_S3_ACCESS_KEY_ID`, dan
`CAPTNIME_S3_SECRET_ACCESS_KEY` terisi → `r2`. `CAPTNIME_STORAGE_DRIVER=local`
memaksa tetap di disk (berguna saat menguji tanpa jaringan).

## Cara kerja driver `r2`

Tidak ada SDK AWS — hanya `node:crypto` + `fetch` (`src/lib/s3.ts`):

- **Unggah:** berkas dikirim dari panel ke server, lalu server melakukan `PUT`
  ke **presigned URL** (`expiresIn` 15 menit). Jadi berkas tidak pernah
  menetap di disk aplikasi.
- **Putar/subtitle:** `r2:<key>` diubah saat render menjadi
  - URL publik CDN bila `CAPTNIME_S3_PUBLIC_BASE_URL` diisi, atau
  - **presigned GET** yang kedaluwarsa 6 jam (sama seperti driver lokal).
- **Hapus:** server mengirim `DELETE` presigned; `404` dianggap berhasil.
- **Range/seek** dilayani penyimpanan objek secara native, bukan aplikasi.

Penandatanganan memakai SigV4 *query authentication*, gaya path
(`/<bucket>/<key>`), header bertanda tangan `host`, payload `UNSIGNED-PAYLOAD`.
Karena itu satu implementasi berlaku untuk R2, Backblaze B2, MinIO, dan AWS S3.

## Menyiapkan Cloudflare R2 (gratis 10 GB)

1. **Buat bucket** di dashboard Cloudflare → R2 → *Create bucket*, mis. nama
   `captnime-media`. Catat **Account ID** Anda.
2. **Buat API token** R2 → *Manage R2 API Tokens* → *Create API token* dengan
   izin **Object Read & Write**, dibatasi ke bucket tadi.
3. Isi `.env.local`:

   ```ini
   CAPTNIME_S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   CAPTNIME_S3_BUCKET=captnime-media
   CAPTNIME_S3_REGION=auto
   CAPTNIME_S3_ACCESS_KEY_ID=<Access Key ID>
   CAPTNIME_S3_SECRET_ACCESS_KEY=<Secret Access Key>
   ```

4. **Opsional tapi disarankan** — sambungkan domain/CDN supaya pemutaran tidak
   memakai URL bertanda tangan:
   R2 → bucket → *Settings* → *Public access* → *Connect Domain*
   (mis. `media.contoh.com`), lalu

   ```ini
   CAPTNIME_S3_PUBLIC_BASE_URL=https://media.contoh.com
   ```

   Dengan domain publik, tautan tidak lagi kedaluwarsa — perlindungan
   hotlink berpindah ke Cloudflare (WAF/Hotlink Protection). Tanpa domain
   publik, semuanya tetap aman karena URL presigned berumur 6 jam.

5. **CORS** (baru perlu bila nanti unggah langsung dari peramban):

   ```json
   [{ "AllowedOrigins": ["https://domain-anda.com"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600 }]
   ```

6. **Uji**: buka panel admin → episode → *Unggah berkas*; di bawah form akan
   tertulis **Penyimpanan aktif: Penyimpanan objek (S3/R2)**. Unggah video
   kecil, lalu buka halaman tonton — alamat `<video>` mengarah ke endpoint R2
   (atau domain publik Anda).

## Kalau terjadi masalah

| Gejala | Penyebab umum |
| --- | --- |
| `?error=berkas-gagal` saat unggah | kredensial salah, bucket tidak ada, atau token tidak punya izin tulis |
| Halaman tonton: video tidak jalan, konsol 403 | `CAPTNIME_S3_PUBLIC_BASE_URL` salah/domain belum aktif, atau URL presigned sudah lewat 6 jam → muat ulang halaman |
| Subtitle tidak muncul | objek `.vtt` harus dapat diakses publik; cek CORS/domain |
| Masih tertulis “Disk server” | keempat nilai `CAPTNIME_S3_*` belum lengkap |

Server log mencatat kegagalan sebagai `berkas-gagal`; detail teknis (status
HTTP S3) sengaja tidak ditampilkan di UI agar tidak membocorkan kredensial.

## Biaya (perkiraan, 2026)

| Penyedia | Simpan | Keluar (egress) | Catatan |
| --- | --- | --- | --- |
| Cloudflare R2 | $0,015/GB-bulan (gratis 10 GB) | **$0** | Class A $4,50/juta, Class B $0,36/juta |
| Backblaze B2 | $6/TB-bulan | gratis s.d. 3× data | butuh Cloudflare di depan untuk egress gratis |
| Bunny Storage+CDN | ~$0,01/GB-bulan | ~$0,01/GB (Asia $0,03) | minimum $1/bulan |

Untuk 10 anime × 12 episode × 300 MB (~36 GB) di R2: **±$0,40/bulan**, tanpa
biaya egress.
