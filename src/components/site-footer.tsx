import Link from "next/link";
import { Logo } from "@/components/logo";
import { GENRE_ICONS } from "@/lib/data/catalog";
import { isDemoMode } from "@/lib/provider";

const KATEGORI = ["Aksi", "Fantasi", "Romansa", "Sci-Fi", "Slice of Life", "Misteri"];

export function SiteFooter() {
  const demo = isDemoMode();

  return (
    <footer className="mt-14 border-t-2 border-ink bg-paper-2 pb-20 md:pb-0">
      <div className="container-page py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[13px] font-semibold leading-relaxed text-ink-soft">
              Platform streaming anime dengan katalog rapi dan pengalaman menonton
              yang nyaman — di ponsel maupun desktop.
            </p>
            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-ink-mute">
              Subtitle Indonesia di setiap episode. Kualitas hingga 1080p.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-ink">
              Jelajahi
            </h3>
            <ul className="space-y-2 text-[13px] font-semibold text-ink-soft">
              <li><Link href="/browse" className="hover:text-coral-dark">Semua Anime</Link></li>
              <li><Link href="/browse?status=ongoing" className="hover:text-coral-dark">Sedang Tayang</Link></li>
              <li><Link href="/browse?status=completed" className="hover:text-coral-dark">Sudah Tamat</Link></li>
              <li><Link href="/schedule" className="hover:text-coral-dark">Jadwal Rilis</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-ink">
              Genre Populer
            </h3>
            <ul className="space-y-2 text-[13px] font-semibold text-ink-soft">
              {KATEGORI.map((g) => (
                <li key={g}>
                  <Link href={`/browse?genre=${encodeURIComponent(g)}`} className="hover:text-coral-dark">
                    <span className="mr-1.5">{GENRE_ICONS[g] ?? "✧"}</span>
                    {g}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-ink">
              Tentang
            </h3>
            <ul className="space-y-2 text-[13px] font-semibold text-ink-soft">
              <li><Link href="/my-list" className="hover:text-coral-dark">Daftar Saya</Link></li>
              <li><span className="cursor-default">Pusat Bantuan</span></li>
              <li><span className="cursor-default">Kebijakan Privasi</span></li>
              <li><span className="cursor-default">Ketentuan Layanan</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t-2 border-dashed border-ink/25 pt-6">
          {demo && (
            <p className="mb-4 rounded-xl border-2 border-ink bg-mustard/40 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-ink">
              <strong className="font-black">Mode demo.</strong> Seluruh judul &
              episode di sini adalah katalog orisinal untuk peragaan produk. Video
              contoh memakai sample stream publik yang disediakan untuk pengujian
              (Blender Open Movies / test-streams.mux.dev). Ganti sumbernya lewat
              provider resmi berlisensi.
            </p>
          )}
          <div className="flex flex-col gap-2 text-[11px] font-semibold text-ink-mute sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Captnime. Dibangun dengan Next.js.</p>
            <p>Sub Indo • 1080p • Tanpa iklan pop-up</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
