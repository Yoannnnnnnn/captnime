import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Captnime — kembali ke beranda"
      className={cn("flex items-center gap-2", className)}
    >
      <span className="grid size-8 place-items-center rounded-md bg-gold">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path d="M9 6.5v11l8.5-5.5L9 6.5Z" fill="#08090d" />
        </svg>
      </span>
      <span className="text-[17px] font-bold tracking-tight text-text">
        captnime
      </span>
    </Link>
  );
}
