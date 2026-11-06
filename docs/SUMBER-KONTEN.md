# Sumber Konten: Opsi, Risiko, dan Keputusan

Dokumen ini menjawab satu pertanyaan yang berulang: **apakah Captnime bisa
mengambil katalog/stream dari situs agregator tidak resmi (Samehadaku,
Oploverz, dan sejenisnya), seperti yang dilakukan aplikasi sejenis?**

Jawaban singkat: **secara teknis bisa, tetapi tidak saya bangun di repo ini.**
Alasannya bukan kemarahan soal teknologi, melainkan tiga hal yang bisa
menjatuhkan produk: hukum, ketahanan teknis, dan kelayakan bisnis.

---

## 1. Bagaimana aplikasi sejenis melakukannya

Umumnya tiga pola:

1. **Scraping HTML** halaman daftar + halaman episode, mengambil judul, poster,
   dan tautan pemutar.
2. **Menyematkan iframe** pemutar situs sumber (paling murah: bandwidth
   ditanggung situs sumber).
3. **Menyadap tautan stream** (`.m3u8`/`.mp4`) lalu memproksinya dengan header
   `Referer`/`Origin` palsu agar tidak ditolak.

Ketiganya menghasilkan aplikasi yang *terlihat* berfungsi. Yang tidak terlihat:
tidak satu pun dari pola itu memindahkan hak tayang. Situs sumber sendiri
beroperasi tanpa lisensi; menyalurkan ulang dari mereka bukan membuatnya sah.

---

## 2. Tiga alasan tidak dibangun di sini

### a. Hukum (paling menentukan)

- Menyalurkan ulang karya tanpa izin untuk tujuan komersial masuk ranah
  pelanggaran hak cipta — di Indonesia diatur UU No. 28 Tahun 2014, dengan
  ancaman pidana penjara dan denda bagi pelanggaran yang bersifat komersial.
- Embed tidak menciptakan izin. Ia hanya menampilkan apa yang platform pemilik
  izinkan; situs agregator bukan pemilik izin.
- Konsekuensi praktis: repo bisa dihapus (DMCA/GitHub), domain bisa diblokir
  lewat PSE/Kominfo, dan **payment gateway serta ad network hampir pasti
  menolak** situs dengan konten tidak berlisensi. Artinya model bisnisnya mati
  sebelum sempat bersaing.

### b. Ketahanan teknis

- Situs sumber memakai Cloudflare/anti-bot dan DOM yang berubah; scraper perlu
  diperbaiki terus-menerus.
- Tautan stream sering berbasis token dengan masa berlaku pendek, dan hanya
  mau dilayani dengan `Referer` tertentu. Untuk memutar sendiri, Anda harus
  memproksi video — artinya **Anda** yang menanggung bandwidth, bukan mereka.
- Sumber bisa hilang sewaktu-waktu (ganti domain, tutup, kena blokir). Katalog
  dan riwayat pengguna jadi rusak tanpa peringatan.
- Di lingkungan pengembangan ini pun tidak bisa diuji: egress hanya diizinkan
  ke beberapa host (GitHub, npm, PyPI), bukan ke situs-situs tersebut.

### c. Kualitas produk

- Pemutar iframe pihak ketiga membawa iklan popup/redirect mereka sendiri.
- Tidak ada kendali subtitle, kualitas, atau DRM; pengalaman "seperti
  Wibuku" justru berisi hal-hal yang biasanya dikeluhkan pengguna.

---

## 3. Opsi yang tersedia (dan biayanya)

| Opsi | Legal | Biaya | Kualitas | Effort |
| --- | --- | --- | --- | --- |
| **A. Embed resmi** (kanal YouTube/Bilibili resmi, trailer, klip) | ✅ | Rp0 | Sedang (pemutar pihak lain) | Sudah jadi |
| **B. Metadata otomatis** (AniList GraphQL / Jikan API) untuk judul, sinopsis, genre, jadwal | ✅ | Rp0 | Tinggi untuk katalog | ±1 hari kerja |
| **C. Konten orisinal / berlisensi** di R2 + HLS | ✅ | ±$4–21/bln (lihat `VIDEO.md`) | Penuh | Butuh lisensi & produksi |
| **D. Kerja sama/afiliasi distributor** (Bstation, Catchplay, iQiyi, dsb.) | ✅ | Bagi hasil | Penuh | Butuh negosiasi |
| **E. Scraping situs agregator** | ❌ | Murah di awal, mahal di akhir | Rendah | Tinggi & berkelanjutan |

Rekomendasi: **A + B sekarang**, lalu **C atau D** saat siap operasional.
Kombinasi A+B memberi katalog rapi yang legal tanpa biaya infrastruktur.

---

## 4. Kalau tetap ingin memakai sumber sendiri

Repo ini sengaja tidak menyematkan scraper, tetapi **tidak mengunci** Anda:
seluruh UI hanya berbicara dengan `AnimeProvider`
(lihat `src/lib/providers/remote.ts` dan `docs/INTEGRASI-SUMBER-DATA.md`).

Artinya: siapa pun yang punya sumber **berlisensi** (atau sumber miliknya
sendiri) dapat memasang adapter di server terpisah dan mengarahkan aplikasi
lewat env:

```bash
CAPTNIME_DATA_SOURCE=remote
CAPTNIME_API_BASE_URL=https://api-anda.example.com
```

Bentuk respons yang diharapkan sudah didokumentasikan. Tanggung jawab atas isi
sumber tersebut berada pada operator yang memasangnya, bukan pada lapisan UI.

---

## 5. Ringkasan untuk keputusan

- Scraping bukan jalan pintas menuju "gratis"; ia memindahkan biaya dari
  bandwidth ke risiko hukum dan risiko operasional.
- Katalog legal bisa dibangun **tanpa biaya** lebih dulu: metadata dari AniList/
  Jikan + embed dari kanal resmi.
- Begitu ada lisensi, jalur teknis termurah sudah siap: R2 + HLS + CDN base URL
  (`docs/VIDEO.md`).

Yang benar-benar menentukan apakah Captnime bisa terbit bukan kode, melainkan
**izin atas kontennya**.
