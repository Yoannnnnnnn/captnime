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
    const onScroll = () => setScrolled(window.scrollY > 8);
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
          "fixed inset-x-0 top-0 z-50 border-b-2 border-ink transition-colors duration-200",
          scrolled ? "bg-paper" : "bg-paper/92 backdrop-blur-sm",
        )}
      >
        <div className="container-page flex h-16 items-center gap-3">
          <Logo />

          <nav className="ml-3 hidden items-center gap-1.5 lg:flex" aria-label="Navigasi utama">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full border-2 px-3.5 py-1.5 text-[13px] font-extrabold transition",
                    active
                      ? "border-ink bg-mustard text-ink shadow-[2px_2px_0_0_var(--color-ink)]"
                      : "border-transparent text-ink-soft hover:border-ink hover:bg-card",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <form onSubmit={submit} className="hidden md:block">
              <label className="flex h-9 w-56 items-center gap-2 rounded-full border-2 border-ink bg-card pl-3 transition-all focus-within:w-72">
                <Search className="size-4 shrink-0 text-ink-soft" />
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Cari anime…"
                  aria-label="Cari anime"
                  className="h-full w-full bg-transparent pr-3 text-[13px] font-semibold text-ink placeholder:text-ink-mute focus:outline-none"
                />
              </label>
            </form>

            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Cari"
              aria-expanded={searchOpen}
              className="grid size-9 place-items-center rounded-full border-2 border-ink bg-card text-ink md:hidden"
            >
              {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
            </button>

            <Link
              href="/my-list"
              className="hidden h-9 items-center gap-1.5 rounded-full border-2 border-ink bg-coral px-4 text-[13px] font-extrabold text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition hover:-translate-y-0.5 sm:flex"
            >
              <Bookmark className="size-3.5" />
              Daftar Saya
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Buka menu"
              className="grid size-9 place-items-center rounded-full border-2 border-ink bg-card text-ink lg:hidden"
            >
              <Menu className="size-4" />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="animate-slide-down border-t-2 border-ink bg-paper px-4 pb-3 pt-2 md:hidden">
            <form onSubmit={submit} className="flex items-center gap-2">
              <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border-2 border-ink bg-card px-3">
                <Search className="size-4 text-ink-soft" />
                <input
                  autoFocus
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Cari judul, genre, atau studio…"
                  aria-label="Cari anime"
                  className="h-full w-full bg-transparent text-sm font-semibold text-ink placeholder:text-ink-mute focus:outline-none"
                />
              </label>
              <button
                type="submit"
                className="h-10 rounded-xl border-2 border-ink bg-coral px-4 text-sm font-extrabold text-ink shadow-[3px_3px_0_0_var(--color-ink)]"
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
            className="absolute inset-0 bg-ink/60"
          />
          <div className="animate-slide-down absolute inset-x-3 top-3 rounded-2xl border-2 border-ink bg-paper p-4 shadow-[6px_6px_0_0_var(--color-ink)]">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Tutup"
                className="grid size-9 place-items-center rounded-full border-2 border-ink bg-card text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
            <nav className="mt-4 space-y-1.5" aria-label="Navigasi seluler">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-sm font-extrabold transition",
                      active
                        ? "border-ink bg-mustard text-ink"
                        : "border-transparent text-ink-soft hover:border-ink hover:bg-card",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <p className="mt-4 border-t-2 border-dashed border-ink/25 pt-3 text-[11px] font-semibold leading-relaxed text-ink-mute">
              Captnime menyajikan katalog orisinal. Lapisan provider bisa diarahkan
              ke sumber resmi berlisensi milik Anda.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
