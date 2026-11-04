"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, CalendarDays, Compass, House, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Beranda", icon: House, code: "01" },
  { href: "/browse", label: "Jelajah", icon: Compass, code: "02" },
  { href: "/schedule", label: "Jadwal", icon: CalendarDays, code: "03" },
  { href: "/my-list", label: "Daftar Saya", icon: Bookmark, code: "04" },
];

export function SideNav({ genres }: { genres: string[] }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[228px] flex-col border-r border-line bg-bg lg:flex">
      <div className="border-b border-line px-5 py-4">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scroll-thin" aria-label="Navigasi utama">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-3">
          Menu
        </p>
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] transition-colors",
                    active
                      ? "bg-surface text-text"
                      : "text-text-2 hover:bg-surface/60 hover:text-text",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-gold" : "text-text-3",
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-[9px] font-medium tabular-nums text-text-3">
                    {item.code}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-3">
          Genre
        </p>
        <ul className="space-y-0.5">
          {genres.slice(0, 12).map((g) => (
            <li key={g}>
              <Link
                href={`/browse?genre=${encodeURIComponent(g)}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-[12.5px] text-text-2 transition-colors hover:bg-surface/60 hover:text-text"
              >
                {g}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-line p-3">
        <Link
          href="/browse"
          className="flex items-center gap-2 rounded-md border border-line px-2.5 py-2 text-[12px] text-text-2 transition-colors hover:border-line-2 hover:text-text"
        >
          <Search className="size-3.5" />
          Cari judul…
        </Link>
        <p className="mt-2.5 px-1 text-[10px] leading-relaxed text-text-3">
          Katalog orisinal. Sub Indo tersedia di setiap episode.
        </p>
      </div>
    </aside>
  );
}
