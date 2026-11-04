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
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-line bg-bg/92 backdrop-blur-md"
            : "border-b border-transparent bg-gradient-to-b from-bg/85 to-transparent",
        )}
      >
        <div className="container-page flex h-16 items-center gap-4">
          <Logo />

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Navigasi utama">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded px-3 py-2 text-[13px] font-medium transition-colors",
                    active ? "text-text" : "text-text-2 hover:text-text",
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gold" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <form onSubmit={submit} className="hidden sm:block">
              <label className="flex h-9 w-52 items-center gap-2 rounded-md border border-line bg-surface/80 pl-2.5 transition-colors focus-within:border-line-2 focus-within:bg-surface">
                <Search className="size-4 shrink-0 text-text-3" />
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Cari anime"
                  aria-label="Cari anime"
                  className="h-full w-full bg-transparent pr-2.5 text-[13px] text-text placeholder:text-text-3 focus:outline-none"
                />
              </label>
            </form>

            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Cari"
              aria-expanded={searchOpen}
              className="grid size-9 place-items-center rounded-md border border-line text-text-2 sm:hidden"
            >
              {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
            </button>

            <Link
              href="/my-list"
              className="hidden h-9 items-center gap-1.5 rounded-md bg-gold px-3.5 text-[13px] font-semibold text-bg transition-colors hover:bg-gold-2 md:flex"
            >
              <Bookmark className="size-3.5" />
              Daftar Saya
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Buka menu"
              className="grid size-9 place-items-center rounded-md border border-line text-text-2 md:hidden"
            >
              <Menu className="size-4" />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="animate-slide-down border-t border-line bg-bg px-4 pb-3 pt-2 sm:hidden">
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
        <div className="fixed inset-0 z-[60] md:hidden">
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
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-surface-2 text-text" : "text-text-2 hover:bg-surface-2",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-text-3">
              Captnime menyajikan katalog orisinal. Lapisan provider bisa diarahkan
              ke sumber resmi berlisensi milik Anda.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
