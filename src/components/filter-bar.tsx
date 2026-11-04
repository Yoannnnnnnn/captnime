"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { TYPE_LIST } from "@/lib/data/catalog";
import type { GenreInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "semua", label: "Semua status" },
  { value: "ongoing", label: "Sedang tayang" },
  { value: "completed", label: "Tamat" },
  { value: "upcoming", label: "Segera" },
];

const SORT_OPTIONS = [
  { value: "populer", label: "Terpopuler" },
  { value: "terbaru", label: "Terbaru" },
  { value: "rating", label: "Rating tertinggi" },
  { value: "judul", label: "A–Z" },
];

export function FilterBar({ genres }: { genres: GenreInfo[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [term, setTerm] = useState(params.get("q") ?? "");

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

  const hasFilter =
    current.genre !== "semua" ||
    current.status !== "semua" ||
    current.type !== "semua" ||
    current.sort !== "populer" ||
    Boolean(params.get("q"));

  return (
    <div className="space-y-4">
      <form onSubmit={submitSearch}>
        <label className="flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-2.5">
          <Search className="size-3.5 shrink-0 text-text-3" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Cari judul"
            aria-label="Cari anime"
            className="h-full w-full bg-transparent text-[12.5px] text-text placeholder:text-text-3 focus:outline-none"
          />
          {term && (
            <button
              type="button"
              onClick={() => {
                setTerm("");
                push({ q: undefined });
              }}
              aria-label="Hapus pencarian"
              className="grid size-5 place-items-center rounded-full text-text-3 hover:text-text"
            >
              <X className="size-3" />
            </button>
          )}
        </label>
      </form>

      {isPending && (
        <p className="flex items-center gap-1.5 text-[11px] text-text-3">
          <Loader2 className="size-3 animate-spin" /> Memuat…
        </p>
      )}

      <Group title="Status">
        <ul className="-mx-2">
          {STATUS_OPTIONS.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => push({ status: opt.value })}
                aria-pressed={current.status === opt.value}
                className={cn(
                  "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[12.5px] transition-colors",
                  current.status === opt.value
                    ? "bg-surface text-text"
                    : "text-text-2 hover:bg-surface/60 hover:text-text",
                )}
              >
                {opt.label}
                {current.status === opt.value && (
                  <span className="size-1.5 rounded-full bg-gold" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Tipe">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={current.type === "semua"} onClick={() => push({ type: "semua" })}>
            Semua
          </Chip>
          {TYPE_LIST.map((t) => (
            <Chip key={t} active={current.type === t} onClick={() => push({ type: t })}>
              {t}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Genre">
        <ul className="-mx-2 max-h-64 overflow-y-auto pr-1 scroll-thin">
          <li>
            <button
              type="button"
              onClick={() => push({ genre: "semua" })}
              className={cn(
                "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[12.5px] transition-colors",
                current.genre === "semua"
                  ? "bg-surface text-text"
                  : "text-text-2 hover:bg-surface/60 hover:text-text",
              )}
            >
              Semua genre
            </button>
          </li>
          {genres.map((g) => (
            <li key={g.slug}>
              <button
                type="button"
                onClick={() => push({ genre: g.name })}
                className={cn(
                  "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[12.5px] transition-colors",
                  current.genre === g.name
                    ? "bg-surface text-text"
                    : "text-text-2 hover:bg-surface/60 hover:text-text",
                )}
              >
                {g.name}
                <span className="text-[10px] tabular-nums text-text-3">{g.total}</span>
              </button>
            </li>
          ))}
        </ul>
      </Group>

      <Group title="Urutkan">
        <div className="flex flex-wrap gap-1.5">
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
      </Group>

      {hasFilter && (
        <button
          type="button"
          onClick={() => {
            setTerm("");
            startTransition(() => router.push(pathname, { scroll: false }));
          }}
          className="text-[11.5px] text-text-3 underline decoration-line-2 underline-offset-2 hover:text-gold"
        >
          Reset semua filter
        </button>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-3">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-3">
        {title}
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
        "rounded border px-2 py-1 text-[11.5px] transition-colors",
        active
          ? "border-gold/50 bg-gold/10 text-gold"
          : "border-line text-text-2 hover:border-line-2 hover:text-text",
      )}
    >
      {children}
    </button>
  );
}
