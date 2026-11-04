"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { GENRE_ICONS, TYPE_LIST } from "@/lib/data/catalog";
import type { GenreInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "semua", label: "Semua Status" },
  { value: "ongoing", label: "Sedang Tayang" },
  { value: "completed", label: "Tamat" },
  { value: "upcoming", label: "Segera" },
];

const SORT_OPTIONS = [
  { value: "populer", label: "Terpopuler" },
  { value: "terbaru", label: "Terbaru" },
  { value: "rating", label: "Rating Tertinggi" },
  { value: "judul", label: "A–Z" },
];

export function FilterBar({ genres }: { genres: GenreInfo[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [term, setTerm] = useState(params.get("q") ?? "");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setTerm(params.get("q") ?? "");
  }, [params]);

  const current = {
    genre: params.get("genre") ?? "semua",
    status: params.get("status") ?? "semua",
    type: params.get("type") ?? "semua",
    sort: params.get("sort") ?? "populer",
  };

  const push = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (!v || v === "semua") next.delete(k);
      else next.set(k, v);
    });
    next.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    push({ q: term.trim() || undefined });
  };

  const activeCount = [
    current.genre !== "semua",
    current.status !== "semua",
    current.type !== "semua",
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <form onSubmit={submitSearch} className="flex-1">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-ink-850 px-3 transition focus-within:border-brand-500/60">
            <Search className="size-4 shrink-0 text-mist-400" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Cari judul, genre, atau studio…"
              aria-label="Cari anime"
              className="h-full w-full bg-transparent text-sm text-mist-100 placeholder:text-mist-400/80 focus:outline-none"
            />
            {term && (
              <button
                type="button"
                onClick={() => {
                  setTerm("");
                  push({ q: undefined });
                }}
                aria-label="Hapus pencarian"
                className="grid size-6 place-items-center rounded-full bg-white/10 text-mist-300"
              >
                <X className="size-3" />
              </button>
            )}
          </label>
        </form>

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className={cn(
            "relative flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-bold transition",
            showFilters || activeCount > 0
              ? "border-brand-500/60 bg-brand-500/12 text-brand-400"
              : "border-white/10 bg-ink-850 text-mist-200 hover:bg-ink-800",
          )}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SlidersHorizontal className="size-4" />
          )}
          Filter
          {activeCount > 0 && (
            <span className="grid size-4 place-items-center rounded-full bg-brand-500 text-[9px] font-black text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="animate-slide-down space-y-4 rounded-xl border border-white/8 bg-ink-850/80 p-4">
          <Field label="Status">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  active={current.status === opt.value}
                  onClick={() => push({ status: opt.value })}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Tipe">
            <div className="flex flex-wrap gap-1.5">
              <Chip
                active={current.type === "semua"}
                onClick={() => push({ type: "semua" })}
              >
                Semua
              </Chip>
              {TYPE_LIST.map((t) => (
                <Chip key={t} active={current.type === t} onClick={() => push({ type: t })}>
                  {t}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Genre">
            <div className="flex flex-wrap gap-1.5">
              <Chip
                active={current.genre === "semua"}
                onClick={() => push({ genre: "semua" })}
              >
                Semua Genre
              </Chip>
              {genres.map((g) => (
                <Chip
                  key={g.slug}
                  active={current.genre === g.name}
                  onClick={() => push({ genre: g.name })}
                >
                  <span className="mr-1" aria-hidden>
                    {GENRE_ICONS[g.name] ?? "✧"}
                  </span>
                  {g.name}
                </Chip>
              ))}
            </div>
          </Field>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-mist-500">
          Urutkan
        </span>
        {SORT_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            active={current.sort === opt.value}
            onClick={() => push({ sort: opt.value })}
          >
            {opt.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-mist-400">
        {label}
      </p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
        active
          ? "border-brand-500/70 bg-brand-500/15 text-brand-400"
          : "border-white/10 bg-white/[0.04] text-mist-300 hover:border-white/25 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
