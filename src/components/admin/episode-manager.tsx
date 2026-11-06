import { Plus, Trash2 } from "lucide-react";
import type { AdminEpisodeRow } from "@/lib/db/repository";
import {
  addServerAction,
  addSubtitleAction,
  deleteEpisodeAction,
  deleteServerAction,
  deleteSubtitleAction,
  saveEpisodeAction,
} from "@/app/admin/actions";
import { Badge, Field, Panel, btnDanger, btnGhost, btnPrimary, inputClass } from "@/components/admin/ui";
import { formatDuration, padEpisode } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);

function EpisodeBlock({ slug, episode }: { slug: string; episode: AdminEpisodeRow }) {
  return (
    <details className="sticker-sm group">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-3 py-2.5 text-sm hover:bg-surface-2">
        <span className="font-mono text-[12px] tabular-nums text-gold">
          #{padEpisode(episode.number)}
        </span>
        <span className="min-w-0 flex-1 truncate text-text">{episode.title}</span>
        {episode.filler ? <Badge tone="coral">Filler</Badge> : null}
        <Badge tone={episode.servers.length > 0 ? "mint" : "coral"}>
          {episode.servers.length} server
        </Badge>
        <Badge>{episode.subtitles.length} subtitle</Badge>
        <span className="text-[11.5px] text-text-3">{formatDuration(episode.duration)}</span>
      </summary>

      <div className="grid gap-4 border-t border-line p-3 lg:grid-cols-2">
        {/* --- form episode --- */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-3">
            Detail episode
          </p>
          <form action={saveEpisodeAction} className="space-y-3">
            <input type="hidden" name="animeSlug" value={slug} />
            <input type="hidden" name="episodeId" value={episode.dbId} />
            <div className="grid grid-cols-3 gap-2">
              <Field label="Nomor">
                <input
                  name="number"
                  type="number"
                  min={1}
                  defaultValue={episode.number}
                  className={inputClass}
                />
              </Field>
              <Field label="Durasi (detik)" className="col-span-2">
                <input
                  name="duration"
                  type="number"
                  min={1}
                  defaultValue={episode.duration}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Judul episode">
              <input name="title" defaultValue={episode.title} className={inputClass} />
            </Field>
            <Field label="Tanggal rilis">
              <input
                name="releasedAt"
                type="date"
                defaultValue={episode.releasedAt.slice(0, 10)}
                className={inputClass}
              />
            </Field>
            <Field label="Sinopsis">
              <textarea
                name="synopsis"
                rows={2}
                defaultValue={episode.synopsis ?? ""}
                className={`${inputClass} resize-y`}
              />
            </Field>
            <label className="inline-flex items-center gap-2 text-[12.5px] text-text-2">
              <input
                type="checkbox"
                name="filler"
                defaultChecked={episode.filler}
                className="size-3.5 accent-[var(--color-gold)]"
              />
              Tandai sebagai filler
            </label>
            <div className="flex items-center gap-2">
              <button type="submit" className={btnPrimary}>
                Simpan episode
              </button>
            </div>
          </form>

          <form action={deleteEpisodeAction}>
            <input type="hidden" name="animeSlug" value={slug} />
            <input type="hidden" name="episodeId" value={episode.dbId} />
            <button type="submit" className={btnDanger}>
              <Trash2 className="mr-1 inline size-3" aria-hidden />
              Hapus episode beserta server & subtitle
            </button>
          </form>
        </div>

        {/* --- server & subtitle --- */}
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-3">
              Server streaming
            </p>
            {episode.servers.length === 0 ? (
              <p className="mb-2 text-[12px] text-coral">
                Belum ada server — episode ini tidak bisa diputar.
              </p>
            ) : (
              <ul className="mb-3 space-y-1.5">
                {episode.servers.map((server) => (
                  <li
                    key={server.dbId}
                    className="flex items-center gap-2 rounded-md border border-line bg-surface-2 px-2 py-1.5 text-[12px]"
                  >
                    <span className="font-semibold text-text">{server.label}</span>
                    <span className="text-text-3">
                      {server.type} · {server.quality}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-text-3" title={server.url}>
                      {server.url}
                    </span>
                    <form action={deleteServerAction}>
                      <input type="hidden" name="animeSlug" value={slug} />
                      <input type="hidden" name="serverId" value={server.dbId} />
                      <button
                        type="submit"
                        aria-label={`Hapus ${server.label}`}
                        className="text-text-3 transition-colors hover:text-coral"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <form action={addServerAction} className="space-y-2 rounded-md bg-surface-2/60 p-2.5">
              <input type="hidden" name="animeSlug" value={slug} />
              <input type="hidden" name="episodeId" value={episode.dbId} />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Field label="Label">
                  <input name="label" placeholder="Server 1" className={inputClass} />
                </Field>
                <Field label="Tipe">
                  <select name="type" className={inputClass}>
                    <option value="hls">hls</option>
                    <option value="mp4">mp4</option>
                    <option value="embed">embed</option>
                  </select>
                </Field>
                <Field label="Kualitas">
                  <select name="quality" className={inputClass}>
                    <option value="auto">auto</option>
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                  </select>
                </Field>
                <Field label="Catatan">
                  <input name="note" placeholder="opsional" className={inputClass} />
                </Field>
              </div>
              <Field
                label="URL stream / embed"
                hint="hls: .m3u8 · mp4: berkas langsung · embed: tautan YouTube/Vimeo/Dailymotion/Bilibili resmi"
              >
                <input
                  name="url"
                  required
                  placeholder="https://cdn.contoh.com/ep1.m3u8"
                  className={inputClass}
                />
              </Field>
              <button type="submit" className={btnGhost}>
                <Plus className="mr-1 inline size-3.5" aria-hidden />
                Tambah server
              </button>
            </form>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-3">
              Subtitle
            </p>
            {episode.subtitles.length === 0 ? (
              <p className="mb-2 text-[12px] text-text-3">Belum ada subtitle.</p>
            ) : (
              <ul className="mb-3 space-y-1.5">
                {episode.subtitles.map((sub) => (
                  <li
                    key={sub.dbId}
                    className="flex items-center gap-2 rounded-md border border-line bg-surface-2 px-2 py-1.5 text-[12px]"
                  >
                    <span className="font-semibold uppercase text-text">{sub.lang}</span>
                    <span className="text-text-3">{sub.label}</span>
                    {sub.default ? <Badge tone="gold">default</Badge> : null}
                    <span className="min-w-0 flex-1 truncate text-text-3" title={sub.src}>
                      {sub.src}
                    </span>
                    <form action={deleteSubtitleAction}>
                      <input type="hidden" name="animeSlug" value={slug} />
                      <input type="hidden" name="subtitleId" value={sub.dbId} />
                      <button
                        type="submit"
                        aria-label={`Hapus subtitle ${sub.label}`}
                        className="text-text-3 transition-colors hover:text-coral"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <form action={addSubtitleAction} className="space-y-2 rounded-md bg-surface-2/60 p-2.5">
              <input type="hidden" name="animeSlug" value={slug} />
              <input type="hidden" name="episodeId" value={episode.dbId} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Kode bahasa">
                  <input name="lang" defaultValue="id" className={inputClass} />
                </Field>
                <Field label="Label">
                  <input name="label" defaultValue="Indonesia" className={inputClass} />
                </Field>
              </div>
              <Field label="URL file .vtt">
                <input
                  name="src"
                  required
                  placeholder="/subtitles/id.vtt"
                  className={inputClass}
                />
              </Field>
              <label className="inline-flex items-center gap-2 text-[12px] text-text-2">
                <input
                  type="checkbox"
                  name="isDefault"
                  className="size-3.5 accent-[var(--color-gold)]"
                />
                Jadikan subtitle default
              </label>
              <button type="submit" className={btnGhost}>
                <Plus className="mr-1 inline size-3.5" aria-hidden />
                Tambah subtitle
              </button>
            </form>
          </div>
        </div>
      </div>
    </details>
  );
}

export function EpisodeManager({
  slug,
  episodes,
}: {
  slug: string;
  episodes: AdminEpisodeRow[];
}) {
  const nextNumber =
    episodes.reduce((max, e) => Math.max(max, e.number), 0) + 1;

  return (
    <div className="space-y-4">
      <Panel
        index="07"
        title="Episode, server, dan subtitle"
        description="Klik satu baris untuk mengubah detail, menambah mirror server, atau mengunggah subtitle."
      >
        {episodes.length === 0 ? (
          <p className="text-sm text-text-3">
            Belum ada episode. Tambahkan episode pertama lewat formulir di bawah.
          </p>
        ) : (
          <div className="space-y-2">
            {episodes.map((episode) => (
              <EpisodeBlock key={episode.dbId} slug={slug} episode={episode} />
            ))}
          </div>
        )}
      </Panel>

      <Panel
        index="08"
        title="Tambah episode"
        description="Server dan subtitle ditambahkan setelah episode tersimpan."
      >
        <form action={saveEpisodeAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="animeSlug" value={slug} />
          <Field label="Nomor episode">
            <input
              name="number"
              type="number"
              min={1}
              defaultValue={nextNumber}
              className={inputClass}
            />
          </Field>
          <Field label="Durasi (detik)">
            <input name="duration" type="number" defaultValue={1440} className={inputClass} />
          </Field>
          <Field label="Judul episode" className="sm:col-span-2">
            <input
              name="title"
              placeholder="Kota yang Lupa Arah Pulang"
              className={inputClass}
            />
          </Field>
          <Field label="Tanggal rilis">
            <input
              name="releasedAt"
              type="date"
              defaultValue={today()}
              className={inputClass}
            />
          </Field>
          <Field label="Sinopsis">
            <input name="synopsis" placeholder="opsional" className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" className={btnPrimary}>
              <Plus className="mr-1 inline size-4" aria-hidden />
              Tambah episode
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
