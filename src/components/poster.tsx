import { cn } from "@/lib/utils";

/**
 * Poster kartun: ilustrasi flat yang dibangkitkan dari palet tiap judul.
 *
 * Tidak ada file gambar dan tidak ada gradient-blur. Bentuknya sengaja sederhana
 * — lingkaran, bukit, ombak, gedung — dengan garis tepi tebal supaya terasa
 * digambar tangan, bukan hasil generator.
 */

const OUTLINE = "#fff7e9";

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) % 100000;
  }
  return h;
}

interface SceneProps {
  variant: number;
  from: string;
  to: string;
  seed: number;
}

/** Adegan 200x300: sederhana, tebal, lucu. */
function Scene({ variant, from, to, seed }: SceneProps) {
  const sunX = 60 + (seed % 80);
  const sunY = 55 + (seed % 30);

  return (
    <svg
      viewBox="0 0 200 300"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <rect width="200" height="300" fill={from} />

      {variant === 0 && (
        <>
          <circle cx={sunX} cy={sunY} r="34" fill={to} stroke={OUTLINE} strokeWidth="5" />
          <path
            d="M-10 300 Q 50 190 110 300 Z"
            fill={to}
            stroke={OUTLINE}
            strokeWidth="5"
          />
          <path
            d="M70 300 Q 140 205 210 300 Z"
            fill={from}
            stroke={OUTLINE}
            strokeWidth="5"
            opacity="0.85"
          />
          <circle cx={sunX + 62} cy={sunY + 34} r="5" fill={OUTLINE} />
          <circle cx={sunX - 58} cy={sunY + 70} r="3.5" fill={OUTLINE} />
        </>
      )}

      {variant === 1 && (
        <>
          <path
            d={`M ${sunX} ${sunY - 26} a 26 26 0 1 0 0.1 0 Z`}
            fill={to}
            stroke={OUTLINE}
            strokeWidth="5"
          />
          <path
            d={`M ${sunX + 10} ${sunY - 34} a 24 24 0 1 0 8 45 Z`}
            fill={from}
          />
          {[
            [30, 60],
            [168, 96],
            [54, 128],
            [140, 42],
            [96, 84],
          ].map(([x, y], i) => (
            <path
              key={i}
              d={`M ${x} ${y - 7} l 2.6 5.4 6 0.7 -4.4 4.1 1.2 6 -5.4 -3 -5.4 3 1.2 -6 -4.4 -4.1 6 -0.7 Z`}
              fill={OUTLINE}
            />
          ))}
          <path
            d="M-10 300 L 40 205 L 90 300 Z M 70 300 L 130 190 L 195 300 Z"
            fill={to}
            stroke={OUTLINE}
            strokeWidth="5"
          />
        </>
      )}

      {variant === 2 && (
        <>
          <circle cx={sunX} cy={sunY} r="28" fill={to} stroke={OUTLINE} strokeWidth="5" />
          <path
            d="M-10 190 q 26 -18 52 0 t 52 0 t 52 0 t 52 0 V 300 H -10 Z"
            fill={to}
            stroke={OUTLINE}
            strokeWidth="5"
          />
          <path
            d="M-10 230 q 26 -18 52 0 t 52 0 t 52 0 t 52 0 V 300 H -10 Z"
            fill={from}
            stroke={OUTLINE}
            strokeWidth="5"
            opacity="0.9"
          />
          <path d="M40 165 q8 -12 16 0 q8 -12 16 0" stroke={OUTLINE} strokeWidth="4" fill="none" />
        </>
      )}

      {variant === 3 && (
        <>
          <rect x="24" y="150" width="42" height="150" fill={to} stroke={OUTLINE} strokeWidth="5" />
          <rect x="78" y="110" width="46" height="190" fill={from} stroke={OUTLINE} strokeWidth="5" />
          <rect x="136" y="175" width="44" height="125" fill={to} stroke={OUTLINE} strokeWidth="5" />
          <circle cx={sunX} cy={sunY} r="26" fill={to} stroke={OUTLINE} strokeWidth="5" />
          {[
            [34, 170],
            [50, 170],
            [88, 130],
            [104, 130],
            [88, 158],
            [104, 158],
            [146, 195],
            [162, 195],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="10" height="12" fill={from} stroke={OUTLINE} strokeWidth="3" />
          ))}
        </>
      )}

      {variant === 4 && (
        <>
          <circle cx="100" cy="120" r="66" fill="none" stroke={OUTLINE} strokeWidth="6" />
          <circle cx="100" cy="120" r="46" fill="none" stroke={to} strokeWidth="10" />
          <circle cx="100" cy="120" r="22" fill={to} stroke={OUTLINE} strokeWidth="5" />
          <path
            d="M-10 300 Q 60 210 120 300 Z"
            fill={to}
            stroke={OUTLINE}
            strokeWidth="5"
          />
          <path d="M150 40 l 4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 Z" fill={to} stroke={OUTLINE} strokeWidth="3" />
        </>
      )}
    </svg>
  );
}

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
  hideTitle?: boolean;
  titleSize?: "sm" | "md" | "lg";
  rounded?: string;
  priority?: boolean;
}

const TITLE_SIZE = {
  sm: "text-[10px] leading-[1.15]",
  md: "text-[11.5px] leading-[1.2] sm:text-[13px]",
  lg: "text-sm leading-[1.2] sm:text-base",
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
  const seed = hash(anime.title);
  const variant = seed % 5;

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden border-2 border-ink bg-ink",
        rounded,
        className,
      )}
      style={{ boxShadow: "4px 4px 0 0 var(--color-ink)" }}
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
        <Scene variant={variant} from={from} to={to} seed={seed} />
      )}

      {!hideTitle && (
        <div className="absolute inset-x-1.5 bottom-1.5">
          <div className="rounded-lg border-2 border-ink bg-paper px-1.5 py-1">
            {anime.type && (
              <span className="mb-0.5 block text-[8px] font-black uppercase tracking-[0.12em] text-ink-mute">
                {anime.type}
              </span>
            )}
            <h3 className={cn("font-black text-ink", TITLE_SIZE[titleSize])}>
              {anime.title}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}

/** Latar lebar untuk hero & halaman detail — langit kartun, bukan gradient gelap. */
export function Backdrop({
  anime,
  className,
}: {
  anime: {
    title?: string;
    palette: [string, string];
    motif?: string;
    banner?: string;
  };
  className?: string;
}) {
  const [from, to] = anime.palette;
  const seed = hash(anime.title ?? "x");

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {anime.banner ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={anime.banner} alt="" className="h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-paper/80" />
        </>
      ) : (
        <svg
          viewBox="0 0 1200 600"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          aria-hidden
        >
          <rect width="1200" height="600" fill="var(--color-paper)" />
          <circle cx={900 + (seed % 120)} cy="150" r="150" fill={to} stroke="#1e1b2e" strokeWidth="6" />
          <path
            d="M-40 600 Q 220 330 520 600 Z"
            fill={from}
            stroke="#1e1b2e"
            strokeWidth="6"
            opacity="0.95"
          />
          <path
            d="M380 600 Q 700 380 1040 600 Z"
            fill={to}
            stroke="#1e1b2e"
            strokeWidth="6"
            opacity="0.8"
          />
          <path
            d="M0 480 q 60 -40 120 0 t 120 0 t 120 0"
            stroke="#1e1b2e"
            strokeWidth="5"
            fill="none"
            opacity="0.35"
          />
          <circle cx="150" cy="140" r="10" fill={from} stroke="#1e1b2e" strokeWidth="4" />
          <circle cx="260" cy="90" r="6" fill={to} stroke="#1e1b2e" strokeWidth="4" />
          <path d="M1080 300 l 8 18 18 8 -18 8 -8 18 -8 -18 -18 -8 18 -8 Z" fill={from} stroke="#1e1b2e" strokeWidth="4" />
        </svg>
      )}
      {/* lebur ke kertas di bawah agar judul terbaca */}
      <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/70 to-transparent" />
    </div>
  );
}
