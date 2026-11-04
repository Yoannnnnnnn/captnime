import Link from "next/link";
import { Logo } from "@/components/logo";
import { GENRE_ICONS } from "@/lib/data/catalog";
import { isDemoMode } from "@/lib/provider";

const KATEGORI = ["Aksi", "Fantasi", "Romansa", "Sci-Fi", "Slice of Life", "Misteri"];

export function SiteFooter() {
  const demo = isDemoMode();

  return (
    <footer className="mt-16 border-t border-white/8 bg-ink-900/60 pb-20 md:pb-0">
      <div className="container-page py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-mist-400">
              Platform streaming anime dengan antarmuka cepat, katalog rapi, dan
              pengalaman menonton yang nyaman — di ponsel maupun desktop.
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-mist-400/70">
              Subtitle Indonesia tersedia di setiap episode. Kualitas hingga 1080p.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-mist-300">
              Jelajahi
            </h3>
            <ul className="space-y-2 text-[13px] text-mist-400">
              <li><Link href="/browse" className="hover:text-brand-400">Semua Anime</Link></li>
              <li><Link href="/browse?status=ongoing" className="hover:text-brand-400">Sedang Tayang</Link></li>
              <li><Link href="/browse?status=completed" className="hover:text-brand-400">Sudah Tamat</Link></li>
              <li><Link href="/schedule" className="hover:text-brand-400">Jadwal Rilis</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-mist-300">
              Genre Populer
            </h3>
            <ul className="space-y-2 text-[13px] text-mist-400">
              {KATEGORI.map((g) => (
                <li key={g}>
                  <Link href={`/browse?genre=${encodeURIComponent(g)}`} className="hover:text-brand-400">
                    <span className="mr-1.5 text-mist-500">{GENRE_ICONS[g] ?? "✧"}</span>
                    {g}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-mist-300">
              Tentang
            </h3>
            <ul className="space-y-2 text-[13px] text-mist-400">
              <li><Link href="/my-list" className="hover:text-brand-400">Daftar Saya</Link></li>
              <li><span className="cursor-default">Pusat Bantuan</span></li>
              <li><span className="cursor-default">Kebijakan Privasi</span></li>
              <li><span className="cursor-default">Ketentuan Layanan</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/8 pt-6">
          {demo && (
            <p className="mb-4 rounded-xl border border-gold/25 bg-gold/8 px-3 py-2.5 text-[11px] leading-relaxed text-gold/90">
              <strong>Mode demo.</strong> Seluruh judul & episode di sini adalah
              katalog orisinal untuk peragaan produk. Video contoh memakai sample
              stream publik yang disediakan untuk pengujian (Blender Open Movies /
              test-streams.mux.dev). Ganti sumbernya lewat provider resmi berlisensi.
            </p>
          )}
          <div className="flex flex-col gap-2 text-[11px] text-mist-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Captnime. Dibangun dengan Next.js.</p>
            <p className="text-mist-400/70">
              Sub Indo • 1080p • Tanpa iklan pop-up
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
