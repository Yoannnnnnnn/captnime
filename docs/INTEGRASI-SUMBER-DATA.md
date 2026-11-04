# Integrasi Sumber Data

Dokumen ini menjelaskan cara menyambungkan Captnime ke backend produksi Anda
sendiri tanpa mengubah kode UI.

---

## 1. Alur

```
UI (Server Component)
   └─ getProvider()               src/lib/provider.ts
        ├─ LocalProvider          katalog demo in-memory
        └─ RemoteProvider         HTTP JSON ke API Anda
              └─ mapAnime()       normalizer ke kontrak internal (src/lib/types.ts)
```

`getProvider()` dipilih sekali per proses berdasarkan environment variable:

| Env | Nilai | Fungsi |
| --- | --- | --- |
| `CAPTNIME_DATA_SOURCE` | `local` (default) / `remote` | memilih implementasi |
| `CAPTNIME_API_BASE_URL` | URL | wajib untuk `remote` |
| `CAPTNIME_API_KEY` | string | dikirim sebagai `Authorization: Bearer …` |
| `CAPTNIME_REVALIDATE` | detik (default 60) | cache ISR untuk `fetch` |

---

## 2. Kontrak endpoint

Semua respons JSON, `Content-Type: application/json`.

### `GET /anime`

Query: `q`, `genre`, `status` (`ongoing|completed|upcoming`), `type`
(`TV|Movie|OVA|ONA|Special`), `sort` (`populer|terbaru|rating|judul`), `page`,
`perPage`.

```json
{
  "items": [ { /* Anime */ } ],
  "total": 42,
  "page": 1,
  "perPage": 12,
  "totalPages": 4
}
```

### `GET /anime/:slug`

Satu objek `Anime` (lihat di bawah) atau `404`.

### `GET /anime/:slug/related?limit=6`

Array `Anime`.

### `GET /anime/slugs`

```json
[{ "slug": "langit-kedua" }]
```

### `GET /genres`

```json
[{ "slug": "fantasi", "name": "Fantasi", "total": 6 }]
```

### `GET /schedule`

```json
{
  "Senin": [ { /* Anime */ } ],
  "Selasa": [],
  "Rabu": [],
  "Kamis": [],
  "Jumat": [],
  "Sabtu": [],
  "Minggu": []
}
```

---

## 3. Bentuk objek `Anime`

Kolom wajib: `slug`, `title`, `synopsis`, `status`, `episodes`.

```json
{
  "id": "anime-001",
  "slug": "langit-kedua",
  "title": "Langit Kedua",
  "titleAlt": "Second Sky",
  "tagline": "Dunia ini memilihnya.",
  "synopsis": "Ardan terbangun di negeri yang langitnya terbelah dua…",
  "type": "TV",
  "status": "ongoing",
  "year": 2026,
  "season": "Fall 2026",
  "studio": "Studio Arunika",
  "score": 9.1,
  "rating": "13+",
  "genres": ["Fantasi", "Isekai"],
  "totalEpisodes": 9,
  "durationMinutes": 24,
  "broadcastDay": "Sabtu",
  "broadcastTime": "20:00 WIB",
  "palette": ["#2b1a6b", "#ff8a3d"],
  "motif": "☾",
  "poster": "https://cdn.example.com/poster.jpg",
  "banner": "https://cdn.example.com/banner.jpg",
  "featured": true,
  "tags": ["Sub Indo"],
  "episodes": [
    {
      "number": 1,
      "title": "Kota yang Lupa Arah Pulang",
      "duration": 1440,
      "releasedAt": "2026-09-05T00:00:00.000Z",
      "filler": false,
      "servers": [
        {
          "id": "utama",
          "label": "Server 1",
          "type": "hls",
          "url": "https://cdn.example.com/ep1/master.m3u8",
          "quality": "1080p"
        }
      ],
      "subtitles": [
        {
          "lang": "id",
          "label": "Indonesia",
          "src": "https://cdn.example.com/ep1/id.vtt",
          "default": true
        }
      ]
    }
  ]
}
```

Catatan:

- `palette` + `motif` dipakai bila `poster` kosong (poster prosedural).
- `duration` dalam **detik**.
- `servers[].type` harus `"hls"` (`.m3u8`) atau `"mp4"`.
- `subtitles[].src` harus file **WebVTT** dan mengizinkan CORS bila beda origin.
- Nama hari pada `broadcastDay` harus salah satu dari: Senin, Selasa, Rabu,
  Kamis, Jumat, Sabtu, Minggu.

---

## 4. Adaptasi bentuk data yang berbeda

Bila API Anda memakai nama field lain (mis. `title_english`, `description`,
`thumbnail`), cukup edit `mapAnime()` di `src/lib/providers/remote.ts`. Fungsi
itu menerima objek mentah dan mengembalikan `Anime`. Tidak ada komponen UI yang
bergantung pada bentuk API mentah.

Contoh pemetaan field:

```ts
title: String(pick(raw?.title, raw?.name, "Tanpa Judul")),
poster: pick(raw?.poster, raw?.image, raw?.thumbnail),
score: Number(pick(raw?.score, raw?.rating_score, 0)),
```

---

## 5. Jika ingin menambah sumber lain

1. Buat kelas baru yang mengimplementasikan `AnimeProvider` di
   `src/lib/providers/`.
2. Daftarkan di `getProvider()`.
3. Tambahkan env var pemilihnya.

Semua kode sumber data **wajib berjalan di server** (jangan memanggil sumber
pihak ketiga langsung dari browser: melanggar CORS/ToS dan membocorkan kunci
API). Pastikan juga Anda memiliki hak distribusi atas konten yang disalurkan.
