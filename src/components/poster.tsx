import { cn } from "@/lib/utils";

/**
 * Poster prosedural: menghasilkan "key art" dari palet + motif tiap judul.
 * Tidak butuh file gambar (0 request, 0 masalah hak cipta), dan otomatis
 * dipakai ulang sebagai backdrop hero, thumbnail episode, dst.
 *
 * Jika `anime.poster` diisi oleh provider (CDN asli), gambar itu yang dipakai.
 */

interface PosterProps {
  anime: {
    title: string;
    palette: [string, string];
    motif?: string;
    poster?: string;
    type?: string;
    status?: string;
  };
  className?: string;
  /** Sembunyikan judul di dalam poster (mis. untuk thumbnail kecil). */
  hideTitle?: boolean;
  /** Ukuran teks judul. */
  titleSize?: "sm" | "md" | "lg";
  rounded?: string;
  priority?: boolean;
}

const TITLE_SIZE = {
  sm: "text-[11px] leading-tight",
  md: "text-sm leading-tight sm:text-base",
  lg: "text-lg leading-tight sm:text-2xl",
} as const;

export function Poster({
  anime,
  className,
  hideTitle = false,
  titleSize = "md",
  rounded = "rounded-xl",
  priority = false,
}: PosterProps) {
  const [from, to] = anime.palette;
  const motif = anime.motif ?? "✧";

  return (
    <div
      className={cn(
        "group/poster relative isolate overflow-hidden bg-ink-800 grain",
        rounded,
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(120% 90% at 15% 0%, ${to} 0%, transparent 55%),
                          radial-gradient(100% 80% at 85% 15%, ${from} 0%, transparent 60%),
                          linear-gradient(160deg, ${from} 0%, #05060a 78%)`,
      }}
    >
      {anime.poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={anime.poster}
          alt={anime.title}
          loading={priority ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          {/* motif raksasa */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-4 -bottom-6 select-none text-[7rem] leading-none opacity-[0.22] mix-blend-screen transition-transform duration-700 group-hover/poster:scale-105 sm:text-[8.5rem]"
            style={{ color: to, textShadow: `0 0 60px ${to}` }}
          >
            {motif}
          </span>

          {/* garis cahaya diagonal */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: `linear-gradient(115deg, transparent 38%, ${to}22 47%, transparent 58%)`,
            }}
          />

          {/* cincin dekoratif */}
          <span
            aria-hidden
            className="pointer-events-none absolute -left-10 top-1/4 h-32 w-32 rounded-full border opacity-20"
            style={{ borderColor: to }}
          />
        </>
      )}

      {/* scrim bawah untuk keterbacaan judul */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
      />

      {!hideTitle && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3">
          {anime.type && (
            <span className="w-fit rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-mist-200 backdrop-blur-sm">
              {anime.type}
            </span>
          )}
          <h3
            className={cn(
              "font-extrabold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]",
              TITLE_SIZE[titleSize],
            )}
          >
            {anime.title}
          </h3>
        </div>
      )}
    </div>
  );
}

/** Latar lebar untuk hero & halaman detail. */
export function Backdrop({
  anime,
  className,
}: {
  anime: { palette: [string, string]; motif?: string; banner?: string };
  className?: string;
}) {
  const [from, to] = anime.palette;
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {anime.banner ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={anime.banner}
          alt=""
          className="h-full w-full scale-105 object-cover opacity-60"
        />
      ) : (
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `radial-gradient(90% 120% at 12% 10%, ${from}cc 0%, transparent 55%),
                              radial-gradient(80% 110% at 88% 0%, ${to}99 0%, transparent 58%),
                              linear-gradient(180deg, #05060a00 35%, #05060a 92%)`,
          }}
        />
      )}
      <span
        aria-hidden
        className="absolute -right-10 top-4 select-none text-[16rem] leading-none opacity-[0.07]"
        style={{ color: to }}
      >
        {anime.motif ?? "✧"}
      </span>
      <span className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-transparent" />
    </div>
  );
}
