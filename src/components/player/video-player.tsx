"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Settings,
  SkipBack,
  SkipForward,
  Subtitles,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { Anime, Episode, StreamServer, Subtitle } from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";
import { saveProgress } from "@/lib/user-store";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

interface VideoPlayerProps {
  anime: Anime;
  episode: Episode;
  /** Episode berikutnya (bila ada) untuk auto-next. */
  nextEpisode?: Episode;
  nextHref?: string;
}

export function VideoPlayer({
  anime,
  episode,
  nextEpisode,
  nextHref,
}: VideoPlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [serverIndex, setServerIndex] = useState(0);
  const server: StreamServer | undefined = episode.servers[serverIndex];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(episode.duration);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [panel, setPanel] = useState<"none" | "settings" | "subtitle">("none");
  const [subtitlesOn, setSubtitlesOn] = useState(
    episode.subtitles.some((s) => s.default) || episode.subtitles.length > 0,
  );
  const [fullscreen, setFullscreen] = useState(false);
  const [resumeFrom, setResumeFrom] = useState<number | null>(null);
  const [ended, setEnded] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState<number | null>(null);

  const defaultSubtitle = useMemo(
    () => episode.subtitles.find((s) => s.default) ?? episode.subtitles[0],
    [episode.subtitles],
  );
  const [activeSubtitle, setActiveSubtitle] = useState<Subtitle | undefined>(
    defaultSubtitle,
  );

  /* --------------------------------------------------------------- */
  /* Muat sumber video (HLS atau MP4)                                 */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !server) return;

    let disposed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hls: any = null;

    setLoading(true);
    setError(null);
    setEnded(false);

    const load = async () => {
      if (server.type === "hls") {
        const Hls = (await import("hls.js")).default;
        if (disposed) return;

        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, lowLatencyMode: false });
          hls.loadSource(server.url);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, (_e: unknown, data: { fatal?: boolean }) => {
            if (data?.fatal) {
              setError(
                "Server ini tidak merespons. Coba server lain di bawah pemutar.",
              );
              setLoading(false);
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = server.url;
        } else {
          setError("Peramban ini tidak mendukung streaming HLS.");
          setLoading(false);
        }
      } else {
        video.src = server.url;
      }
    };

    void load();

    return () => {
      disposed = true;
      if (hls) hls.destroy();
      if (video) {
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [server]);

  /* --------------------------------------------------------------- */
  /* Simpan progres ke penyimpanan lokal                              */
  /* --------------------------------------------------------------- */
  const persist = useCallback(
    (position: number, total: number) => {
      if (!Number.isFinite(position) || position < 3 || !total) return;
      saveProgress({
        slug: anime.slug,
        title: anime.title,
        episode: episode.number,
        position,
        duration: total,
        palette: anime.palette,
        motif: anime.motif,
        poster: anime.poster,
        totalEpisodes: anime.totalEpisodes,
      });
    },
    [anime, episode.number],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && !video.ended) {
        persist(video.currentTime, video.duration || episode.duration);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [persist, episode.duration]);

  useEffect(() => {
    const onLeave = () => {
      const video = videoRef.current;
      if (video) persist(video.currentTime, video.duration || episode.duration);
    };
    window.addEventListener("beforeunload", onLeave);
    return () => {
      onLeave();
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [persist, episode.duration]);

  /* --------------------------------------------------------------- */
  /* Kontrol auto-hide                                                */
  /* --------------------------------------------------------------- */
  const pokeControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        setControlsVisible(false);
        setPanel("none");
      }
    }, 3200);
  }, []);

  useEffect(() => {
    pokeControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pokeControls]);

  /* --------------------------------------------------------------- */
  /* Aksi pemutar                                                     */
  /* --------------------------------------------------------------- */
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => {
        setError("Video gagal diputar. Tekan putar sekali lagi atau ganti server.");
      });
    } else {
      video.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    const target = Math.min(Math.max(0, time), video.duration || Infinity);
    video.currentTime = target;
    setCurrentTime(target);
  }, []);

  const skip = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (!video) return;
      seek(video.currentTime + delta);
      pokeControls();
    },
    [seek, pokeControls],
  );

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const changeVolume = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    const next = Math.min(1, Math.max(0, value));
    video.volume = next;
    video.muted = next === 0;
    setVolume(next);
    setMuted(next === 0);
  };

  const toggleFullscreen = async () => {
    const shell = shellRef.current;
    if (!shell) return;
    try {
      if (!document.fullscreenElement) {
        await shell.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* diabaikan — sebagian peramban memblokir */
    }
  };

  const togglePip = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      setError("Mode picture-in-picture tidak didukung peramban ini.");
    }
  };

  /* --------------------------------------------------------------- */
  /* Event video native                                               */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      setLoading(false);
      setDuration(video.duration || episode.duration);
      // Tawarkan resume bila posisi tersimpan > 20 detik dan belum selesai
      try {
        const raw = window.localStorage.getItem("captnime:v1:history");
        if (!raw) return;
        const list = JSON.parse(raw) as { slug: string; episode: number; position: number }[];
        const found = list.find(
          (h) => h.slug === anime.slug && h.episode === episode.number,
        );
        if (found && found.position > 20 && found.position < (video.duration || 1e9) - 30) {
          setResumeFrom(found.position);
        }
      } catch {
        /* ignore */
      }
    };
    const onTime = () => setCurrentTime(video.currentTime);
    const onPlay = () => {
      setIsPlaying(true);
      setEnded(false);
      pokeControls();
    };
    const onPause = () => {
      setIsPlaying(false);
      setControlsVisible(true);
      persist(video.currentTime, video.duration || episode.duration);
    };
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    const onError = () => {
      setLoading(false);
      setError("Gagal memuat video. Coba server lain di bawah pemutar.");
    };
    const onEnded = () => {
      setIsPlaying(false);
      setEnded(true);
      persist(video.duration, video.duration);
      if (nextHref) setAutoNextCountdown(6);
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("progress", onProgress);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
      video.removeEventListener("ended", onEnded);
    };
  }, [anime.slug, episode.number, episode.duration, nextHref, persist, pokeControls]);

  /* Auto-next countdown */
  useEffect(() => {
    if (autoNextCountdown === null || !nextHref) return;
    if (autoNextCountdown <= 0) {
      router.push(nextHref);
      return;
    }
    const t = setTimeout(() => setAutoNextCountdown((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [autoNextCountdown, nextHref, router]);

  /* Fullscreen state */
  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  /* Subtitle track on/off */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const tracks = video.textTracks;
    for (let i = 0; i < tracks.length; i += 1) {
      const track = tracks[i];
      const isActive =
        subtitlesOn && activeSubtitle && track.language === activeSubtitle.lang;
      track.mode = isActive ? "showing" : "hidden";
    }
  }, [subtitlesOn, activeSubtitle, server, episode.number]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowright":
          e.preventDefault();
          skip(10);
          break;
        case "arrowleft":
          e.preventDefault();
          skip(-10);
          break;
        case "arrowup":
          e.preventDefault();
          changeVolume(volume + 0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          changeVolume(volume - 0.1);
          break;
        case "f":
          void toggleFullscreen();
          break;
        case "m":
          toggleMute();
          break;
        case "c":
          setSubtitlesOn((s) => !s);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [togglePlay, skip, volume, toggleFullscreen]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  const applyResume = () => {
    if (resumeFrom) {
      seek(resumeFrom);
      void videoRef.current?.play();
    }
    setResumeFrom(null);
  };

  return (
    <div className="space-y-3">
      <div
        ref={shellRef}
        onMouseMove={pokeControls}
        onTouchStart={pokeControls}
        className={cn(
          "group/player relative isolate aspect-video w-full overflow-hidden bg-black ring-1 ring-white/10",
          fullscreen ? "rounded-none" : "rounded-xl sm:rounded-2xl",
        )}
      >
        <video
          ref={videoRef}
          key={`${anime.slug}-${episode.number}-${server?.id ?? "none"}`}
          className="h-full w-full bg-black"
          playsInline
          preload="metadata"
          onClick={togglePlay}
        >
          {episode.subtitles.map((sub) => (
            <track
              key={sub.lang}
              kind="subtitles"
              src={sub.src}
              srcLang={sub.lang}
              label={sub.label}
              default={sub.lang === defaultSubtitle?.lang}
            />
          ))}
        </video>

        {/* Tombol play besar saat pause */}
        {!isPlaying && !loading && !error && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Putar"
            className="absolute inset-0 z-10 grid place-items-center bg-black/25 transition hover:bg-black/15"
          >
            <span className="grid size-16 place-items-center rounded-full bg-brand-500/95 shadow-[0_0_50px_rgba(255,61,104,0.55)] sm:size-20">
              <Play className="size-7 translate-x-[2px] fill-white text-white sm:size-9" />
            </span>
          </button>
        )}

        {/* Loading */}
        {loading && !error && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/50 px-5 py-4 backdrop-blur-sm">
              <Loader2 className="size-6 animate-spin text-brand-400" />
              <span className="text-[11px] font-semibold text-text">
                Memuat {server?.quality ?? ""} • {server?.label ?? "server"}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/80 p-6 text-center">
            <div className="max-w-sm">
              <p className="text-sm font-bold text-white">Tidak bisa memutar video</p>
              <p className="mt-1 text-xs leading-relaxed text-text-2">{error}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setServerIndex((i) => (i + 1) % Math.max(1, episode.servers.length));
                  }}
                  className="rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white"
                >
                  Ganti server
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    const video = videoRef.current;
                    if (video) {
                      video.load();
                      void video.play().catch(() => undefined);
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-text"
                >
                  <RotateCcw className="size-3.5" /> Coba lagi
                </button>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-text-3">
                Video demo memakai sample stream publik, jadi butuh koneksi
                internet. Pada implementasi produksi, sumber ini diganti CDN Anda.
              </p>
            </div>
          </div>
        )}

        {/* Resume prompt */}
        {resumeFrom !== null && (
          <div className="absolute inset-x-3 bottom-24 z-20 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-white/15 bg-ink-850/95 p-3 shadow-xl backdrop-blur">
            <p className="flex-1 text-[12px] leading-snug text-text">
              Lanjutkan dari{" "}
              <span className="font-bold text-white">{formatDuration(resumeFrom)}</span>?
            </p>
            <button
              type="button"
              onClick={applyResume}
              className="rounded-full bg-brand-500 px-3 py-1.5 text-[11px] font-bold text-white"
            >
              Lanjut
            </button>
            <button
              type="button"
              onClick={() => setResumeFrom(null)}
              aria-label="Tutup"
              className="grid size-7 place-items-center rounded-full bg-white/10 text-text-2"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Auto next */}
        {ended && nextHref && (
          <div className="absolute inset-x-3 bottom-24 z-20 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-white/15 bg-ink-850/95 p-3 shadow-xl backdrop-blur">
            <p className="flex-1 text-[12px] leading-snug text-text">
              Episode berikutnya dalam{" "}
              <span className="font-bold text-brand-400">{autoNextCountdown ?? 0}</span>{" "}
              detik
            </p>
            <button
              type="button"
              onClick={() => router.push(nextHref)}
              className="rounded-full bg-brand-500 px-3 py-1.5 text-[11px] font-bold text-white"
            >
              Tonton sekarang
            </button>
            <button
              type="button"
              onClick={() => setAutoNextCountdown(null)}
              aria-label="Batal"
              className="grid size-7 place-items-center rounded-full bg-white/10 text-text-2"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* ===================== Kontrol ===================== */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-2 pt-10 transition-opacity duration-300 sm:px-4",
            controlsVisible ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          {/* Seek bar */}
          <div className="group/seek relative flex h-5 items-center">
            <div className="absolute inset-x-0 h-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-white/30"
                style={{ width: `${bufferPercent}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.5}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Posisi video"
              className="absolute inset-x-0 h-5 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(255,61,104,0.25)] [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand-500"
            />
            <div
              className="pointer-events-none absolute inset-x-0 h-1 overflow-hidden rounded-full"
              aria-hidden
            >
              <div className="h-full bg-brand-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-1 flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Jeda" : "Putar"}
              className="grid size-9 place-items-center rounded-full text-white transition hover:bg-white/10"
            >
              {isPlaying ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="size-5 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skip(-10)}
              aria-label="Mundur 10 detik"
              className="hidden size-8 place-items-center rounded-full text-text transition hover:bg-white/10 hover:text-white sm:grid"
            >
              <SkipBack className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => skip(10)}
              aria-label="Maju 10 detik"
              className="hidden size-8 place-items-center rounded-full text-text transition hover:bg-white/10 hover:text-white sm:grid"
            >
              <SkipForward className="size-4" />
            </button>

            <div className="group/vol flex items-center">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Bunyikan" : "Bisukan"}
                className="grid size-8 place-items-center rounded-full text-text transition hover:bg-white/10 hover:text-white"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="size-4" />
                ) : volume < 0.5 ? (
                  <Volume1 className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                aria-label="Volume"
                className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30 opacity-0 transition-all duration-300 group-hover/vol:w-16 group-hover/vol:opacity-100 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>

            <span className="ml-0.5 font-mono text-[11px] font-semibold tabular-nums text-text">
              {formatDuration(currentTime)}{" "}
              <span className="text-text-3">/ {formatDuration(duration)}</span>
            </span>

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
              {/* Subtitle */}
              <button
                type="button"
                onClick={() => {
                  if (panel === "subtitle") {
                    setPanel("none");
                  } else {
                    setPanel("subtitle");
                    setSubtitlesOn(true);
                  }
                }}
                aria-label="Subtitle"
                aria-pressed={subtitlesOn}
                className={cn(
                  "grid size-8 place-items-center rounded-full transition hover:bg-white/10",
                  subtitlesOn ? "text-brand-400" : "text-text-2",
                )}
              >
                <Subtitles className="size-4" />
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => setPanel((p) => (p === "settings" ? "none" : "settings"))}
                aria-label="Pengaturan"
                className="grid size-8 place-items-center rounded-full text-text transition hover:bg-white/10 hover:text-white"
              >
                <Settings className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => void togglePip()}
                aria-label="Picture in picture"
                className="hidden size-8 place-items-center rounded-full text-text transition hover:bg-white/10 hover:text-white sm:grid"
              >
                <PictureInPicture2 className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                aria-label={fullscreen ? "Keluar layar penuh" : "Layar penuh"}
                className="grid size-8 place-items-center rounded-full text-text transition hover:bg-white/10 hover:text-white"
              >
                {fullscreen ? (
                  <Minimize className="size-4" />
                ) : (
                  <Maximize className="size-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ===================== Panel subtitle ===================== */}
        {panel === "subtitle" && (
          <div className="absolute bottom-16 right-3 z-40 w-56 rounded-xl border border-white/12 bg-ink-850/97 p-2 shadow-2xl backdrop-blur sm:right-4">
            <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-2">
              Subtitle
            </p>
            <button
              type="button"
              onClick={() => {
                setSubtitlesOn(false);
                setPanel("none");
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[12px] font-semibold transition hover:bg-white/8",
                !subtitlesOn ? "text-brand-400" : "text-text",
              )}
            >
              Nonaktif {!subtitlesOn && "✓"}
            </button>
            {episode.subtitles.map((sub) => (
              <button
                key={sub.lang}
                type="button"
                onClick={() => {
                  setActiveSubtitle(sub);
                  setSubtitlesOn(true);
                  setPanel("none");
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[12px] font-semibold transition hover:bg-white/8",
                  subtitlesOn && activeSubtitle?.lang === sub.lang
                    ? "text-brand-400"
                    : "text-text",
                )}
              >
                {sub.label}
                <span className="text-[10px] uppercase text-text-3">{sub.lang}</span>
              </button>
            ))}
          </div>
        )}

        {/* ===================== Panel pengaturan ===================== */}
        {panel === "settings" && (
          <div className="absolute bottom-16 right-3 z-40 w-60 rounded-xl border border-white/12 bg-ink-850/97 p-2 shadow-2xl backdrop-blur sm:right-4">
            <div className="px-2 pb-1 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-2">
                Kecepatan
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSpeed(s);
                      const video = videoRef.current;
                      if (video) video.playbackRate = s;
                    }}
                    className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-bold transition",
                      speed === s
                        ? "bg-brand-500 text-white"
                        : "bg-white/8 text-text hover:bg-white/14",
                    )}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 border-t border-white/8 px-2 pb-1 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-2">
                Kualitas
              </p>
              <p className="mt-1 text-[11px] leading-snug text-text-2">
                Mengikuti server aktif:{" "}
                <span className="font-bold text-white">
                  {server?.quality ?? "auto"}
                </span>
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-text-3">
                Ganti kualitas dengan memilih server lain di bawah pemutar.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===================== Bar server ===================== */}
      <div className="rounded-xl border border-white/8 bg-ink-850/70 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-text-2">
            Server
          </span>
          {episode.servers.length === 0 && (
            <span className="text-[12px] text-text-2">Belum ada sumber video.</span>
          )}
          {episode.servers.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServerIndex(i)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition",
                i === serverIndex
                  ? "border-brand-500/70 bg-brand-500/15 text-brand-400"
                  : "border-white/10 bg-white/5 text-text hover:border-white/25 hover:bg-white/10",
              )}
            >
              {s.label}
              <span className="rounded bg-white/10 px-1 py-0.5 text-[9px] uppercase text-text-2">
                {s.quality}
              </span>
            </button>
          ))}
          {episode.subtitles.length > 0 && (
            <span className="ml-auto flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-cyan-glow">
              <Subtitles className="size-3" />
              Sub {activeSubtitle?.label ?? "Indonesia"}
            </span>
          )}
        </div>
      </div>

      {/* Info episode kecil */}
      <p className="px-1 text-[11px] text-text-3">
        Pintasan: <kbd className="rounded bg-white/8 px-1">spasi</kbd> putar/jeda ·{" "}
        <kbd className="rounded bg-white/8 px-1">←</kbd>
        <kbd className="rounded bg-white/8 px-1">→</kbd> ±10s ·{" "}
        <kbd className="rounded bg-white/8 px-1">F</kbd> layar penuh ·{" "}
        <kbd className="rounded bg-white/8 px-1">C</kbd> subtitle ·{" "}
        <kbd className="rounded bg-white/8 px-1">M</kbd> suara
        {nextEpisode && ` · Berikutnya: Episode ${nextEpisode.number}`}
      </p>
    </div>
  );
}
