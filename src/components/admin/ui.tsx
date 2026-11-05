import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-md border border-line bg-surface-2 px-3 py-2 text-sm text-text " +
  "placeholder:text-text-3 outline-none transition-colors focus:border-gold";

export const labelClass =
  "block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-text-3";

export const btnPrimary =
  "btn-sticker bg-gold px-4 py-2 text-sm text-bg hover:bg-gold-2";

export const btnGhost =
  "btn-sticker border border-line bg-surface-2 px-4 py-2 text-sm text-text-2 hover:border-line-2 hover:text-text";

export const btnDanger =
  "btn-sticker border border-coral/40 bg-coral/10 px-3 py-1.5 text-xs text-coral hover:bg-coral/20";

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-text-3">{hint}</span> : null}
    </label>
  );
}

/** Blok bersekat dengan nomor urut, mengikuti bahasa visual halaman publik. */
export function Panel({
  index,
  title,
  description,
  children,
  className,
}: {
  index?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("sticker p-4 sm:p-5", className)}>
      <header className="mb-4 flex items-baseline gap-3 border-b border-line pb-3">
        {index ? (
          <span className="font-mono text-[11px] tabular-nums text-gold">{index}</span>
        ) : null}
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-text">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[12px] leading-relaxed text-text-3">{description}</p>
          ) : null}
        </div>
      </header>
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "mint" | "coral";
}) {
  const tones = {
    neutral: "border-line bg-surface-2 text-text-3",
    gold: "border-gold/40 bg-gold/10 text-gold",
    mint: "border-mint/40 bg-mint/10 text-mint",
    coral: "border-coral/40 bg-coral/10 text-coral",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Kotak pesan sukses/galat hasil redirect (?saved=1 / ?error=...). */
export function Notice({
  tone,
  children,
}: {
  tone: "ok" | "error";
  children: ReactNode;
}) {
  return (
    <p
      role="status"
      className={cn(
        "rounded-md border px-3 py-2 text-[12.5px]",
        tone === "ok"
          ? "border-mint/40 bg-mint/10 text-mint"
          : "border-coral/40 bg-coral/10 text-coral",
      )}
    >
      {children}
    </p>
  );
}
