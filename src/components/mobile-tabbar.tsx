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
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
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
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-extrabold transition-colors",
                  active ? "text-coral-dark" : "text-ink-mute",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-lg border-2 transition",
                    active
                      ? "border-ink bg-mustard text-ink shadow-[2px_2px_0_0_var(--color-ink)]"
                      : "border-transparent",
                  )}
                >
                  <Icon className="size-4" />
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
