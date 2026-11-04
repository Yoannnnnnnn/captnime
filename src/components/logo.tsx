import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Captnime — kembali ke beranda"
      className={cn("group flex items-center gap-2", className)}
    >
      <span className="relative grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-glow shadow-[0_6px_20px_-6px_rgba(255,61,104,0.9)]">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path d="M9 6.5v11l8.5-5.5L9 6.5Z" fill="white" />
        </svg>
        <span className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
      </span>
      <span className="text-[17px] font-black tracking-tight text-white">
        capt<span className="text-brand-500">nime</span>
      </span>
    </Link>
  );
}
