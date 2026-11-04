"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, CalendarDays, Compass, House } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/browse", label: "Jelajah", icon: Compass },
  { href: "/schedule", label: "Jadwal", icon: CalendarDays },
  { href: "/my-list", label: "Saya", icon: Bookmark },
];

export function MobileTabBar() {
  const pathname = usePathname();

  // Player butuh ruang penuh — sembunyikan tab bar saat menonton.
  if (pathname.startsWith("/watch/")) return null;

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
                  active ? "text-brand-400" : "text-mist-400",
                )}
              >
                <span className="relative">
                  <Icon className="size-[18px]" />
                  {active && (
                    <span className="absolute -top-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand-500" />
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
