import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Captnime — kembali ke beranda"
      className={cn("group flex items-center gap-2", className)}
    >
      <span className="grid size-8 place-items-center rounded-xl border-2 border-ink bg-coral shadow-[3px_3px_0_0_var(--color-ink)] transition-transform group-hover:-rotate-6">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path d="M9 6.5v11l8.5-5.5L9 6.5Z" fill="white" />
        </svg>
      </span>
      <span className="text-[17px] font-black tracking-tight text-ink">
        capt<span className="text-coral-dark">nime</span>
      </span>
    </Link>
  );
}
