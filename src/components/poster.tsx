import { cn } from "@/lib/utils";

/**
 * Poster prosedural: key art minimal dari palet tiap judul.
 *
 * Untuk tema gelap sinematik, bentuknya dibuat lapang dengan garis tipis
 * transparan (bukan outline tebal) supaya terbaca sebagai artwork, bukan ikon.
 */

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) % 100000;
  }
  return h;
}

const STROKE = "rgba(255,255,255,0.22)";

interface SceneProps {
  variant: number;
  from: string;
  to: string;
  seed: number;
}

function Scene({ variant, from, to, seed }: SceneProps) {
  const cx = 50 + (seed % 70);
  const cy = 62 + (seed % 26);

  return (
    <svg
      viewBox="0 0 200 300"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={`sky-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} stopOpacity="0.95" />
          <stop offset="100%" stopColor={from} stopOpacity="0.45" />
        </linearGradient>
        <radialGradient id={`glow-${seed}`} cx="50%" cy="30%" r="65%">
          <stop offset="0%" stopColor={to} stopOpacity="0.55" />
          <stop offset="100%" stopColor={to} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="200" height="300" fill="#0b0d13" />
      <rect width="200" height="300" fill={`url(#sky-${seed})`} opacity="0.55" />
      <rect width="200" height="300" fill={`url(#glow-${seed})`} />

      {variant === 0 && (
        <>
          <circle cx={cx} cy={cy} r="30" fill={to} opacity="0.9" />
          <circle cx={cx} cy={cy} r="44" fill="none" stroke={STROKE} strokeWidth="1" />
          <path
            d={`M-10 300 Q ${60 + (seed % 30)} 205 120 300 Z`}
            fill="#0b0d13"
            opacity="0.72"
          />
          <path
            d={`M80 300 Q 150 215 215 300 Z`}
            fill={from}
            opacity="0.5"
            stroke={STROKE}
            strokeWidth="1"
          />
        </>
      )}

      {variant === 1 && (
        <>
          <circle cx={cx} cy={cy} r="26" fill={to} opacity="0.92" />
          <circle cx={cx + 12} cy={cy - 6} r="24" fill="#0b0d13" opacity="0.9" />
          {[
            [32, 58],
            [166, 92],
            [58, 122],
            [138, 40],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill="#ffffff" opacity="0.8" />
          ))}
          <path d="M-10 300 L 44 208 L 96 300 Z" fill="#0b0d13" opacity="0.8" />
          <path d="M70 300 L 132 196 L 200 300 Z" fill={to} opacity="0.35" stroke={STROKE} strokeWidth="1" />
        </>
      )}

      {variant === 2 && (
        <>
          <circle cx={cx} cy={cy} r="24" fill={to} opacity="0.85" />
          <path
            d="M-10 196 q 26 -14 52 0 t 52 0 t 52 0 t 52 0 V 300 H -10 Z"
            fill={to}
            opacity="0.32"
            stroke={STROKE}
            strokeWidth="1"
          />
          <path
            d="M-10 236 q 26 -14 52 0 t 52 0 t 52 0 t 52 0 V 300 H -10 Z"
            fill="#0b0d13"
            opacity="0.72"
          />
        </>
      )}

      {variant === 3 && (
        <>
          <circle cx={cx} cy={cy - 10} r="22" fill={to} opacity="0.8" />
          <rect x="26" y="168" width="34" height="132" fill="#0b0d13" opacity="0.9" />
          <rect x="70" y="132" width="40" height="168" fill={from} opacity="0.75" />
          <rect x="120" y="186" width="36" height="114" fill="#0b0d13" opacity="0.9" />
          {[
            [34, 180],
            [46, 180],
            [78, 146],
            [90, 146],
            [78, 170],
            [90, 170],
            [128, 198],
            [140, 198],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="7" height="9" fill={to} opacity="0.85" />
          ))}
        </>
      )}

      {variant === 4 && (
        <>
          <circle cx="100" cy="118" r="62" fill="none" stroke={STROKE} strokeWidth="1" />
          <circle cx="100" cy="118" r="40" fill="none" stroke={to} strokeWidth="7" opacity="0.85" />
          <circle cx="100" cy="118" r="16" fill={to} opacity="0.95" />
          <path d="M-10 300 Q 62 224 120 300 Z" fill="#0b0d13" opacity="0.8" />
        </>
      )}

      {/* vignette */}
      <rect width="200" height="300" fill="url(#vig)" />
      <defs>
        <radialGradient id="vig" cx="50%" cy="45%" r="72%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>
      </defs>
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
  sm: "text-[10.5px] leading-tight",
  md: "text-[12px] leading-tight",
  lg: "text-sm leading-tight sm:text-base",
} as const;

export function Poster({
  anime,
  className,
  hideTitle = false,
  titleSize = "md",
  rounded = "rounded-lg",
  priority = false,
}: PosterProps) {
  const [from, to] = anime.palette;
  const seed = hash(anime.title);
  const variant = seed % 5;

  return (
    <div className={cn("relative isolate overflow-hidden bg-surface", rounded, className)}>
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
        <>
          <span aria-hidden className="scrim-b absolute inset-x-0 bottom-0 h-1/2" />
          <div className="absolute inset-x-0 bottom-0 p-2.5">
            {anime.type && (
              <span className="mb-0.5 block text-[8.5px] font-semibold uppercase tracking-[0.14em] text-text-2">
                {anime.type}
              </span>
            )}
            <h3 className={cn("font-semibold text-text", TITLE_SIZE[titleSize])}>
              {anime.title}
            </h3>
          </div>
        </>
      )}
    </div>
  );
}

/** Latar lebar untuk hero & header halaman detail. */
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
  const seed = hash(anime.title ?? "captnime");

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {anime.banner ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={anime.banner}
            alt=""
            className="animate-slow-zoom h-full w-full object-cover"
          />
        </>
      ) : (
        <svg
          viewBox="0 0 1440 720"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          aria-hidden
        >
          <defs>
            <linearGradient id="heroSky" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0%" stopColor={from} stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0b0d13" stopOpacity="1" />
            </linearGradient>
            <radialGradient id="heroGlow" cx="72%" cy="34%" r="48%">
              <stop offset="0%" stopColor={to} stopOpacity="0.7" />
              <stop offset="100%" stopColor={to} stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="1440" height="720" fill="#0b0d13" />
          <rect width="1440" height="720" fill="url(#heroSky)" />
          <rect width="1440" height="720" fill="url(#heroGlow)" />

          <circle
            cx={1040 + (seed % 90)}
            cy="210"
            r="150"
            fill={to}
            opacity="0.22"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1.5"
          />

          {/* siluet lanskap */}
          <path
            d="M-40 720 L 260 380 L 520 720 Z"
            fill="#0b0d13"
            opacity="0.85"
          />
          <path
            d="M420 720 L 820 300 L 1240 720 Z"
            fill={from}
            opacity="0.45"
          />
          <path
            d="M980 720 L 1300 430 L 1560 720 Z"
            fill="#0b0d13"
            opacity="0.9"
          />

          {/* garis horizon tipis */}
          <path
            d="M0 560 h 1440"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        </svg>
      )}

      <div className="scrim-l absolute inset-0" />
      <div className="scrim-b absolute inset-0" />
    </div>
  );
}
