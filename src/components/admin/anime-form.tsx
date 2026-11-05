import Link from "next/link";
import type { Anime } from "@/lib/types";
import { DAYS, STATUS_LABEL, TYPE_LIST } from "@/lib/data/catalog";
import { saveAnimeAction } from "@/app/admin/actions";
import {
  Badge,
  Field,
  Notice,
  Panel,
  btnGhost,
  btnPrimary,
  inputClass,
} from "@/components/admin/ui";

const RATINGS = ["SU", "13+", "15+", "17+", "21+"];

export function AnimeForm({
  anime,
  genres,
  saved,
  error,
  published = true,
}: {
  anime?: Anime | null;
  genres: string[];
  saved?: boolean;
  error?: string | null;
  published?: boolean;
}) {
  const selected = new Set(anime?.genres ?? []);
  const isNew = !anime;

  return (
    <form action={saveAnimeAction} className="space-y-4">
      <input type="hidden" name="originalSlug" value={anime?.slug ?? ""} />

      {saved ? <Notice tone="ok">Perubahan tersimpan.</Notice> : null}
      {error === "slug" ? (
        <Notice tone="error">
          Slug tidak valid. Gunakan huruf kecil, angka, dan tanda hubung (contoh:
          langit-kedua).
        </Notice>
      ) : null}

      <Panel
        index="01"
        title="Identitas"
        description="Judul, slug URL, dan informasi produksi."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug URL" hint="Dipakai di /anime/<slug> dan /watch/<slug>/1">
            <input
              name="slug"
              required
              defaultValue={anime?.slug ?? ""}
              placeholder="langit-kedua"
              className={inputClass}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
            />
          </Field>
          <Field label="Judul utama">
            <input
              name="title"
              required
              defaultValue={anime?.title ?? ""}
              placeholder="Langit Kedua"
              className={inputClass}
            />
          </Field>
          <Field label="Judul alternatif">
            <input
              name="titleAlt"
              defaultValue={anime?.titleAlt ?? ""}
              placeholder="Second Sky"
              className={inputClass}
            />
          </Field>
          <Field label="Studio">
            <input
              name="studio"
              defaultValue={anime?.studio ?? ""}
              placeholder="Studio Arunika"
              className={inputClass}
            />
          </Field>
          <Field label="Tahun">
            <input
              name="year"
              type="number"
              min={1960}
              max={2100}
              defaultValue={anime?.year ?? new Date().getFullYear()}
              className={inputClass}
            />
          </Field>
          <Field label="Musim">
            <input
              name="season"
              defaultValue={anime?.season ?? ""}
              placeholder="Fall 2026"
              className={inputClass}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        index="02"
        title="Klasifikasi"
        description="Status tayang menentukan muncul atau tidaknya judul di jadwal rilis."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Tipe">
            <select name="type" defaultValue={anime?.type ?? "TV"} className={inputClass}>
              {TYPE_LIST.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              name="status"
              defaultValue={anime?.status ?? "ongoing"}
              className={inputClass}
            >
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Rating umur">
            <select
              name="rating"
              defaultValue={anime?.rating ?? "13+"}
              className={inputClass}
            >
              {RATINGS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Skor (0–10)">
            <input
              name="score"
              type="number"
              step="0.1"
              min={0}
              max={10}
              defaultValue={anime?.score ?? 8}
              className={inputClass}
            />
          </Field>
          <Field label="Total episode">
            <input
              name="totalEpisodes"
              type="number"
              min={0}
              defaultValue={anime?.totalEpisodes ?? 12}
              className={inputClass}
            />
          </Field>
          <Field label="Durasi (menit)">
            <input
              name="durationMinutes"
              type="number"
              min={1}
              defaultValue={anime?.durationMinutes ?? 24}
              className={inputClass}
            />
          </Field>
          <Field label="Hari tayang">
            <select
              name="broadcastDay"
              defaultValue={anime?.broadcastDay ?? ""}
              className={inputClass}
            >
              <option value="">— tidak dijadwalkan —</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Jam tayang">
            <input
              name="broadcastTime"
              defaultValue={anime?.broadcastTime ?? ""}
              placeholder="20:00 WIB"
              className={inputClass}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        index="03"
        title="Genre"
        description="Genre baru otomatis dibuat di tabel genres dan muncul di panel filter."
      >
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <label
              key={genre}
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[12.5px] text-text-2 transition-colors has-[:checked]:border-gold/50 has-[:checked]:text-text"
            >
              <input
                type="checkbox"
                name="genres"
                value={genre}
                defaultChecked={selected.has(genre)}
                className="size-3.5 accent-[var(--color-gold)]"
              />
              {genre}
            </label>
          ))}
        </div>
        <div className="mt-4">
          <Field
            label="Genre tambahan"
            hint="Pisahkan dengan koma bila genre belum ada di daftar."
          >
            <input
              name="genresExtra"
              placeholder="Mecha, Sejarah"
              className={inputClass}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        index="04"
        title="Narasi & penanda"
        description="Sinopsis tampil di halaman detail dan kartu pencarian."
      >
        <div className="grid gap-4">
          <Field label="Tagline">
            <input
              name="tagline"
              defaultValue={anime?.tagline ?? ""}
              placeholder="Dunia ini memilihnya. Langit ini mengingatnya."
              className={inputClass}
            />
          </Field>
          <Field label="Sinopsis">
            <textarea
              name="synopsis"
              rows={5}
              defaultValue={anime?.synopsis ?? ""}
              className={`${inputClass} resize-y leading-relaxed`}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tag" hint="Pisahkan koma: Sub Indo, Adaptasi Novel">
              <input
                name="tags"
                defaultValue={(anime?.tags ?? []).join(", ")}
                className={inputClass}
              />
            </Field>
            <Field label="Judul terkait" hint="Slug anime lain, pisahkan koma.">
              <input
                name="relatedSlugs"
                defaultValue={(anime?.relatedSlugs ?? []).join(", ")}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </Panel>

      <Panel
        index="05"
        title="Visual"
        description="Poster prosedural memakai gradien + motif. Isi URL poster bila punya aset asli."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Gradien dari">
            <input
              name="paletteFrom"
              type="color"
              defaultValue={anime?.palette[0] ?? "#1b1b2f"}
              className={`${inputClass} h-10 p-1`}
            />
          </Field>
          <Field label="Gradien ke">
            <input
              name="paletteTo"
              type="color"
              defaultValue={anime?.palette[1] ?? "#ff3d68"}
              className={`${inputClass} h-10 p-1`}
            />
          </Field>
          <Field label="Motif" hint="Satu glyph, mis. ☾">
            <input
              name="motif"
              maxLength={4}
              defaultValue={anime?.motif ?? ""}
              className={inputClass}
            />
          </Field>
          <div className="flex items-end">
            <Link href="/browse" className={`${btnGhost} w-full`} target="_blank">
              Lihat katalog
            </Link>
          </div>
          <Field label="URL poster" className="sm:col-span-2">
            <input
              name="poster"
              defaultValue={anime?.poster ?? ""}
              placeholder="https://cdn.contoh.com/poster.jpg"
              className={inputClass}
            />
          </Field>
          <Field label="URL banner" className="sm:col-span-2">
            <input
              name="banner"
              defaultValue={anime?.banner ?? ""}
              placeholder="https://cdn.contoh.com/banner.jpg"
              className={inputClass}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        index="06"
        title="Publikasi"
        description="Judul tidak terbit tidak tampil di situs, tetapi tetap tersimpan."
      >
        <div className="flex flex-wrap items-center gap-5">
          <label className="inline-flex items-center gap-2 text-sm text-text-2">
            <input
              type="checkbox"
              name="published"
              defaultChecked={published}
              className="size-4 accent-[var(--color-gold)]"
            />
            Terbitkan di situs
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-text-2">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={Boolean(anime?.featured)}
              className="size-4 accent-[var(--color-gold)]"
            />
            Tampilkan sebagai sorotan beranda
          </label>
          <Badge tone={anime?.status === "ongoing" ? "mint" : "neutral"}>
            {anime ? STATUS_LABEL[anime.status] : "Judul baru"}
          </Badge>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={btnPrimary}>
          {isNew ? "Simpan judul baru" : "Simpan perubahan"}
        </button>
        <Link href="/admin" className={btnGhost}>
          Kembali ke daftar
        </Link>
        {anime ? (
          <Link href={`/anime/${anime.slug}`} target="_blank" className={btnGhost}>
            Lihat halaman publik
          </Link>
        ) : null}
      </div>
    </form>
  );
}
