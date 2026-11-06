"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, X, Bookmark, CalendarDays, Compass, House, LogIn, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { useSession } from "@/components/session-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/browse", label: "Jelajah", icon: Compass },
  { href: "/schedule", label: "Jadwal", icon: CalendarDays },
  { href: "/my-list", label: "Daftar Saya", icon: Bookmark },
];

/**
 * Header hanya untuk layar kecil. Di desktop, navigasi ditangani SideNav
 * sehingga tidak ada dua sistem navigasi yang bersaing.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [term, setTerm] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [menuOpen]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    router.push(q ? `/browse?q=${encodeURIComponent(q)}` : "/browse");
    setSearchOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-300 lg:hidden",
          scrolled
            ? "border-b border-line bg-bg/95 backdrop-blur-md"
            : "bg-gradient-to-b from-bg/90 to-transparent",
        )}
      >
        <div className="flex h-14 items-center gap-3 px-4">
          <Logo />

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Cari"
              aria-expanded={searchOpen}
              className="grid size-9 place-items-center rounded-md border border-line text-text-2"
            >
              {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Buka menu"
              className="grid size-9 place-items-center rounded-md border border-line text-text-2"
            >
              <Menu className="size-4" />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="animate-slide-down border-t border-line bg-bg px-4 pb-3 pt-2">
            <form onSubmit={submit} className="flex items-center gap-2">
              <label className="flex h-10 flex-1 items-center gap-2 rounded-md border border-line bg-surface px-3">
                <Search className="size-4 text-text-3" />
                <input
                  autoFocus
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Cari judul, genre, atau studio"
                  aria-label="Cari anime"
                  className="h-full w-full bg-transparent text-sm text-text placeholder:text-text-3 focus:outline-none"
                />
              </label>
              <button
                type="submit"
                className="h-10 rounded-md bg-gold px-4 text-sm font-semibold text-bg"
              >
                Cari
              </button>
            </form>
          </div>
        )}
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
          />
          <div className="animate-slide-down absolute inset-x-3 top-3 rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Tutup"
                className="grid size-9 place-items-center rounded-md border border-line text-text-2"
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="mt-4 space-y-0.5" aria-label="Navigasi seluler">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                      active ? "bg-surface-2 text-text" : "text-text-2 hover:bg-surface-2",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-line pt-3">
              {!loading && user ? (
                <Link
                  href="/akun"
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
                >
                  <UserRound className="size-4" />
                  <span className="flex-1 truncate">Akun {user.name}</span>
                </Link>
              ) : !loading ? (
                <Link
                  href="/masuk"
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
                >
                  <LogIn className="size-4" />
                  <span className="flex-1">Masuk</span>
                  <span className="text-[11px] text-gold">Daftar gratis</span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
