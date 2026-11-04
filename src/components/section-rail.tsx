"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionRailProps {
  title: string;
  subtitle?: string;
  href?: string;
  children: ReactNode;
  /** Tampilkan tombol panah (desktop). */
  scrollable?: boolean;
  className?: string;
  accent?: string;
}

export function SectionRail({
  title,
  subtitle,
  href,
  children,
  scrollable = true,
  className,
  accent,
}: SectionRailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 240), behavior: "smooth" });
  };

  return (
    <section className={cn("relative", className)}>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white sm:text-xl">
            {accent && <span aria-hidden className="text-xl">{accent}</span>}
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-mist-400 sm:text-[13px]">{subtitle}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {href && (
            <Link
              href={href}
              className="group hidden items-center gap-1 text-xs font-semibold text-mist-300 transition-colors hover:text-brand-400 sm:flex"
            >
              Lihat semua
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          {scrollable && (
            <div className="hidden gap-1 md:flex">
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                disabled={atStart}
                aria-label="Geser ke kiri"
                className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-mist-200 transition enabled:hover:border-white/25 enabled:hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                disabled={atEnd}
                aria-label="Geser ke kanan"
                className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-mist-200 transition enabled:hover:border-white/25 enabled:hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={ref}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
      >
        {children}
      </div>
    </section>
  );
}
