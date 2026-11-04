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

  if (pathname.startsWith("/watch/")) return null;

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
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
                  "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-gold" : "text-text-3",
                )}
              >
                <Icon className="size-[18px]" />
                {tab.label}
                {active && (
                  <span className="absolute inset-x-0 top-0 mx-auto h-0.5 w-8 rounded-full bg-gold" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
