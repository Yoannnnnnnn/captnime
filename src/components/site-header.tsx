"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, X, Bookmark, CalendarDays, Compass, House } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Beranda", icon: House },
  { href: "/browse", label: "Jelajah", icon: Compass },
  { href: "/schedule", label: "Jadwal", icon: CalendarDays },
  { href: "/my-list", label: "Daftar Saya", icon: Bookmark },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [term, setTerm] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-white/8 bg-ink-950/85 backdrop-blur-xl"
            : "bg-gradient-to-b from-ink-950/90 via-ink-950/40 to-transparent",
        )}
      >
        <div className="container-page flex h-16 items-center gap-3">
          <Logo />

          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors",
                    active
                      ? "text-white"
                      : "text-mist-400 hover:text-mist-100",
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Search desktop */}
            <form onSubmit={submit} className="hidden md:block">
              <label className="group relative flex h-9 w-56 items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-3 transition-all focus-within:w-72 focus-within:border-brand-500/60 focus-within:bg-white/8">
                <Search className="size-4 shrink-0 text-mist-400" />
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Cari anime…"
                  aria-label="Cari anime"
                  className="h-full w-full bg-transparent pr-3 text-[13px] text-mist-100 placeholder:text-mist-400/80 focus:outline-none"
                />
              </label>
            </form>

            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Cari"
              aria-expanded={searchOpen}
              className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-mist-200 md:hidden"
            >
              {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
            </button>

            <Link
              href="/my-list"
              className="hidden h-9 items-center gap-1.5 rounded-full bg-brand-500 px-4 text-[13px] font-bold text-white shadow-[0_8px_24px_-10px_rgba(255,61,104,1)] transition hover:bg-brand-600 sm:flex"
            >
              <Bookmark className="size-3.5" />
              Daftar Saya
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Buka menu"
              className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-mist-200 lg:hidden"
            >
              <Menu className="size-4" />
            </button>
          </div>
        </div>

        {/* Search mobile */}
        {searchOpen && (
          <div className="animate-slide-down border-t border-white/8 bg-ink-950/95 px-4 pb-3 pt-2 md:hidden">
            <form onSubmit={submit} className="flex items-center gap-2">
              <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
                <Search className="size-4 text-mist-400" />
                <input
                  autoFocus
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Cari judul, genre, atau studio…"
                  aria-label="Cari anime"
                  className="h-full w-full bg-transparent text-sm text-mist-100 placeholder:text-mist-400/80 focus:outline-none"
                />
              </label>
              <button
                type="submit"
                className="h-10 rounded-xl bg-brand-500 px-4 text-sm font-bold text-white"
              >
                Cari
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Drawer menu mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="animate-slide-down absolute inset-x-3 top-3 rounded-2xl border border-white/10 bg-ink-850 p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Tutup"
                className="grid size-9 place-items-center rounded-full bg-white/5 text-mist-200"
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="mt-4 space-y-1" aria-label="Navigasi seluler">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
                      active
                        ? "bg-brand-500/15 text-brand-400"
                        : "text-mist-200 hover:bg-white/5",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <p className="mt-4 border-t border-white/8 pt-3 text-[11px] leading-relaxed text-mist-400">
              Captnime menyajikan katalog orisinal. Lapisan provider bisa diarahkan
              ke sumber resmi berlisensi milik Anda.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
