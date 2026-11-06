# Sumber Video & Biaya (Fase 3)

Dokumen ini menjelaskan tiga cara memasang video di Captnime, angka biayanya,
dan keputusan yang diambil untuk tahap ini.

**Kesimpulan singkat:** untuk sekarang aplikasi memakai **embed pihak ketiga +
URL stream eksternal** (biaya Rp0), sementara jalur **Cloudflare R2** disiapkan
lewat satu variabel lingkungan sehingga tidak perlu menulis ulang kode saat
konten berlisensi sudah tersedia.

---

## 1. Tiga jalur sumber video

| Jalur | Biaya | Kendali | Kapan dipakai |
| --- | --- | --- | --- |
| **Embed** (YouTube/Vimeo/Dailymotion/Bilibili resmi) | Rp0 — platform pemilik yang menanggung bandwidth | Rendah (pemutar milik mereka) | Promotion, trailer, atau konten yang memang dipublikasikan resmi di sana |
| **URL HLS/MP4 eksternal** (CDN Anda / mitra) | Sesuai CDN | Penuh | Bila sudah punya hosting atau partner distribusi |
| **Hosting sendiri** (R2 + FFmpeg HLS) | Termurah di antara hosting sendiri | Penuh + kontrol DRM/anti-hotlink | Bila punya lisensi konten |

Ketiganya dipilih di panel admin pada kolom **Tipe**: `embed`, `hls`, atau `mp4`.
Tidak ada perubahan kode untuk berpindah jalur.

---

## 2. Angka biaya (per November 2026)

Harga diambil dari halaman penyedia saat dokumen ini ditulis — **selalu cek
ulang** sebelum mengambil keputusan.

| Penyedia | Penyimpanan | Egress / bandwidth | Catatan |
| --- | --- | --- | --- |
| **Cloudflare R2** | $0.015/GB/bln (gratis 10 GB) | **$0.00/GB** | Operasi baca $0.36/juta; S3-compatible |
| **Bunny Storage + CDN** | $0.01/GB/bln | $0.01/GB (EU/NA), **$0.03/GB (Asia)** | Minimum akun $1/bln |
| **Bunny Stream** | $0.01/GB/bln | $0.01/GB | Transcoding termasuk |
| **Cloudflare Stream** | $5/1.000 menit tersimpan | $1/1.000 menit ditonton | Bayar per menit, bukan per GB |
| AWS S3 + CloudFront | $0.023/GB/bln | ±$0.09/GB | Pembanding; paling mahal untuk video |

### Contoh: 20 judul × 12 episode, 24 menit, 1080p

Asumsi: satu episode ±1,2 GB (HLS multi-bitrate), 1.000 penonton/bulan,
masing-masing menonton 2 episode (±0,3 GB per episode).

| Komponen | R2 | Bunny (Asia) | Cloudflare Stream |
| --- | --- | --- | --- |
| Penyimpanan ±288 GB | $4,3 | $2,9 | $17,4 |
| Delivery 600 GB / 48.000 menit | **$0** | $18 | $48 |
| **Total per bulan** | **±$4,3** | ±$21 | ±$65 |

**Yang menentukan biaya adalah egress, bukan penyimpanan.** Karena itu R2
menang untuk video: 1 TB ditonton per bulan tetap $0 biaya keluar.

> **Catatan penting & jujur:** paket gratis Cloudflare (CDN) membatasi
> pelayanan berkas video besar lewat jalur cache biasa. R2 sendiri tidak
> memungut egress, tetapi untuk trafik besar yang sehat secara operasional,
> pasang **Bunny CDN di depan bucket R2** (pull zone). Dengan begitu Anda
> membayar $0.03/GB hanya untuk trafik Asia yang benar-benar dilayani Bunny,
> dan tetap menyimpan data murah di R2.

---

## 3. Yang sudah diimplementasikan

1. **Tipe server `embed`** — pemutar menampilkan `<iframe>` dengan `sandbox`,
   `allowFullScreen`, dan `referrerPolicy` ketat.
2. **Allowlist host embed** — hanya YouTube (termasuk `youtube-nocookie`),
   Vimeo, Dailymotion, Bilibili, OK.ru, dan VK. URL lain ditolak dan pemutar
   menampilkan pesan, bukan memuat iframe sembarangan.
3. **Normalisasi URL** — cukup tempel tautan biasa:
   - `https://youtu.be/VIDEOID` → `https://www.youtube-nocookie.com/embed/VIDEOID?rel=0`
   - `https://vimeo.com/123456` → `https://player.vimeo.com/video/123456`
   - `https://www.bilibili.com/video/BVxxxx` → `player.bilibili.com/player.html?bvid=BVxxxx`
4. **CDN base URL** — `CAPTNIME_MEDIA_BASE_URL` menambahkan awalan CDN pada path
   relatif (`/videos/ep1/master.m3u8`), tanpa mengubah isi database.
5. **Riwayat untuk embed** — karena platform pihak ketiga tidak memberi posisi,
   pembukaan episode dicatat sebagai “sedang ditonton” agar muncul di
   Lanjut Tonton. Progres persennya tidak dilacak.
6. **Validasi di server, bukan hanya di form** — `addServerAction` menolak
   tipe yang tidak dikenal, URL kosong, embed di luar allowlist, dan server
   `hls` yang tidak menunjuk `.m3u8`. URL embed disimpan dalam bentuk
   ternormalkan, sehingga yang tersimpan di database selalu bentuk semat yang
   sah. Alasannya praktis: salah tempel dulu baru ketahuan saat penonton
   membuka episode.
7. **Atribusi sumber embed** — di bawah pemutar tertulis platform pemiliknya
   (“Diputar langsung oleh YouTube”) dan tautan **Buka di tab baru** ke halaman
   aslinya. Ini jalan keluar ketika sebuah kanal resmi menonaktifkan opsi semat,
   tanpa perlu menyalurkan ulang videonya.

### Uji putar cepat dengan embed resmi

Ini cara tercepat melihat pemutar bekerja dengan video sungguhan, memakai
konten yang pemiliknya sendiri mempublikasikan di platform yang mengizinkan
semat (mis. kanal resmi Ani-One Asia atau Muse Asia).

1. Pastikan `CAPTNIME_DATA_SOURCE=database` — panel admin dan situs harus
   membaca database yang sama.
2. Buka `/admin/login`, lalu pilih satu judul dan buka salah satu episodenya.
3. Di bagian **Server**, isi: label `YouTube Resmi`, tipe **`embed`**, dan tempel
   **tautan halaman tonton** (bukan kode semat), mis.
   `https://www.youtube.com/watch?v=VIDEOID`.
4. Simpan, lalu buka `/watch/<slug>/<episode>`.

Yang seharusnya terlihat: iframe pemutar, keterangan “Diputar langsung oleh
YouTube — subtitle dan kualitas diatur lewat tombol di dalam pemutar”, dan
tautan “Buka di tab baru”.

Bentuk URL di database setelah disimpan (normalisasi otomatis):

| Anda menempel | Tersimpan sebagai |
| --- | --- |
| `https://youtu.be/VIDEOID` | `https://www.youtube-nocookie.com/embed/VIDEOID?rel=0` |
| `https://www.youtube.com/watch?v=VIDEOID` | sama seperti di atas |
| `https://vimeo.com/123456` | `https://player.vimeo.com/video/123456` |
| `https://www.bilibili.com/video/BVxxxx` | `https://player.bilibili.com/player.html?bvid=BVxxxx&high_quality=1` |

Tautan langsung ke server tertentu: tambahkan `?server=N` (1-based) pada URL
tonton, mis. `/watch/akuarium-kota-tua/1?server=4`. Berguna untuk membagikan
tautan yang langsung memakai sumber resmi, dan membuat perilaku embed bisa
diuji otomatis tanpa mengeklik.

**Kalau video tidak muncul:** YouTube menampilkan “Playback on other websites
has been disabled”. Itu keputusan kanal pemiliknya, bukan kesalahan aplikasi —
beberapa video pada kanal yang sama mengizinkan semat, sebagian tidak. Pilihan
yang sah: coba video lain dari kanal resmi itu, atau pakai “Buka di tab baru”.
Yang **tidak** boleh: mengunduh lalu menyalurkan ulang videonya.

Kemungkinan lain: pembatasan wilayah (kanal resmi Asia Tenggara umumnya aman
dibuka dari Indonesia) atau video sudah dihapus/diprivatkan.

Penolakan yang muncul di panel admin beserta artinya:

| Kode | Arti |
| --- | --- |
| `url-kosong` | URL belum diisi |
| `jenis-server` | Tipe bukan hls/mp4/embed |
| `embed-tak-dikenal` | Host di luar allowlist, atau yang ditempel kode semat `<iframe>` |
| `hls-bukan-m3u8` | Tipe `hls` tetapi URL tidak menunjuk `.m3u8` |
| `url-tidak-valid` | Tipe `mp4` tetapi URL bukan http(s) dan bukan path `/…` |

### Yang belum ada (sengaja)

- **Unggah berkas dari panel** — butuh kredensial storage dan biaya; sementara
  unggah manual (`rclone`/`aws s3 cp`) sudah cukup.
- **Signed URL / anti-hotlink** — perlu secret dan Worker; ditunda sampai ada
  konten berlisensi yang benar-benar perlu dilindungi.
- **Transcoding otomatis** — pemrosesan video sebaiknya di mesin terpisah,
  bukan di proses Next.js.

---

## 4. Menyiapkan hosting sendiri (saat siap)

### a. Transcode dengan FFmpeg (HLS multi-bitrate)

```bash
# 1) Ubah ke HLS 3 kualitas + master playlist
ffmpeg -i episode-01.mp4 \
  -filter_complex "[0:v]split=3[v1][v2][v3];[v1]scale=w=1920:h=1080[v1out];[v2]scale=w=1280:h=720[v2out];[v3]scale=w=854:h=480[v3out]" \
  -map "[v1out]" -c:v:0 libx264 -b:v:0 5000k -maxrate:v:0 5350k -bufsize:v:0 7500k \
  -map "[v2out]" -c:v:1 libx264 -b:v:1 2800k -maxrate:v:1 3000k -bufsize:v:1 4200k \
  -map "[v3out]" -c:v:2 libx264 -b:v:2 1400k -maxrate:v:2 1500k -bufsize:v:2 2100k \
  -map a:0 -map a:0 -map a:0 -c:a aac -b:a 128k -ac 2 \
  -f hls -hls_time 6 -hls_playlist_type vod \
  -hls_segment_filename "out/ep01/%v/seg_%03d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
  "out/ep01/%v/index.m3u8"
```

Hasilnya: `out/ep01/master.m3u8` + folder per kualitas. Unggah folder apa adanya.

### b. Unggah ke R2

```bash
# sekali saja
rclone config   # pilih s3 → provider Cloudflare → isi account id & key

rclone copy out/ep01 r2:captnime-video/videos/langit-kedua/ep01 --progress
```

### c. Arahkan aplikasi ke CDN

```bash
# .env.local
CAPTNIME_MEDIA_BASE_URL=https://media.contoh.com
```

Di panel admin, cukup isi URL server dengan path relatif:

```
/videos/langit-kedua/ep01/master.m3u8
```

Aplikasi akan memutarnya sebagai
`https://media.contoh.com/videos/langit-kedua/ep01/master.m3u8`.

---

## 5. Soal legalitas (tetap berlaku)

- **Embed bukan celah hukum.** Memuat ulang halaman pemutar orang lain di dalam
  iframe tidak memindahkan hak tayang ke Anda; ia hanya menampilkan apa yang
  platform itu sendiri izinkan untuk di-embed.
- Menyalurkan ulang stream/subtitle milik pihak lain — termasuk menempelkan
  tautan `.m3u8` dari situs lain — melanggar hak cipta (UU No. 28 Tahun 2014)
  dan hampir selalu melanggar ToS sumbernya. Tautan seperti itu juga rapuh:
  bisa mati kapan saja, dan sering disertai iklan pihak ketiga.
- Jalur yang aman: konten orisinal, lisensi langsung dari pemegang hak, atau
  kerja sama distribusi/kurasi resmi.

Keputusan teknis termurah tidak menghapus kewajiban lisensi — itu tetap
penentu utama sebelum aplikasi ini dibuka untuk publik.
