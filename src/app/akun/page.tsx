import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, Clock3, KeyRound, LogOut, MailCheck, MailWarning, ShieldCheck } from "lucide-react";
import { cookies } from "next/headers";
import {
  changePasswordAction,
  createRecoveryCodeAction,
  deleteAccountAction,
  dismissRecoveryCodeAction,
  logoutAction,
  logoutOthersAction,
  resendVerificationAction,
} from "@/app/auth-actions";
import { requireUser } from "@/lib/auth-user";
import { isEmailConfigured } from "@/lib/email";
import {
  accountStats,
  listProgress,
  listWatchlist,
} from "@/lib/db/accounts";
import { getProvider } from "@/lib/provider";
import { formatDate, padEpisode, timeAgo } from "@/lib/utils";
import {
  Badge,
  Notice,
  btnDanger,
  btnGhost,
  btnPrimary,
  inputClass,
  labelClass,
} from "@/components/admin/ui";


export const metadata: Metadata = {
  title: "Akun Saya",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const NOTICES: Record<string, { tone: "ok" | "error"; text: string }> = {
  "sandi=1": { tone: "ok", text: "Kata sandi berhasil diperbarui." },
  "keluar=1": { tone: "ok", text: "Semua perangkat lain sudah dikeluarkan." },
  "error=sandi-lama": { tone: "error", text: "Kata sandi saat ini salah." },
  "error=sandi-pendek": { tone: "error", text: "Kata sandi baru minimal 8 karakter." },
  "error=sandi-beda": { tone: "error", text: "Konfirmasi kata sandi tidak cocok." },
  "error=hapus-sandi": { tone: "error", text: "Kata sandi salah — akun tidak dihapus." },
  "error=hapus-teks": { tone: "error", text: "Ketik HAPUS (huruf besar) untuk konfirmasi." },
  "verifikasi=dikirim": {
    tone: "ok",
    text: "Tautan verifikasi sudah dikirim. Berlaku 24 jam — periksa juga folder spam.",
  },
  "verifikasi=berhasil": {
    tone: "ok",
    text: "Email berhasil diverifikasi. Sinkronisasi antar perangkat sekarang aktif.",
  },
  "verifikasi=sudah": { tone: "ok", text: "Email Anda memang sudah terverifikasi." },
  "verifikasi=gagal": {
    tone: "error",
    text: "Email verifikasi gagal dikirim. Coba lagi beberapa saat lagi.",
  },
  "verifikasi=belum-aktif": {
    tone: "error",
    text: "Pengiriman email belum diaktifkan di server ini, jadi tautan verifikasi tidak dikirim. Hubungi operator situs.",
  },
  "verifikasi=batas": {
    tone: "error",
    text: "Terlalu sering meminta tautan verifikasi. Coba lagi dalam 15 menit.",
  },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const user = await requireUser("/akun");
  const emailConfigured = isEmailConfigured();
  const recoveryCode = (await cookies()).get("captnime_recovery_code")?.value ?? null;
  const stats = accountStats(user.id);
  const [progress, watchlist] = [
    listProgress(user.id, 5),
    listWatchlist(user.id, 5),
  ];

  const provider = getProvider();
  const slugs = Array.from(
    new Set([...progress.map((p) => p.animeSlug), ...watchlist.map((w) => w.animeSlug)]),
  );
  const found = await Promise.all(slugs.map((slug) => provider.getBySlug(slug)));
  const titles = new Map(found.filter(Boolean).map((a) => [a!.slug, a!.title]));

  const noticeKey = Object.keys(NOTICES).find((key) => {
    const [param, value] = key.split("=");
    return one(param) === value;
  });
  const notice = noticeKey ? NOTICES[noticeKey] : null;

  return (
    <div className="container-page pb-16 pt-16 lg:pt-7">
      <header className="mb-6 border-b border-line pb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
          Akun
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text">
          Halo, {user.name}
        </h1>
        <p className="mt-1 text-[13px] text-text-2">
          Riwayat dan daftar tonton Anda tersimpan di akun ini dan ikut ke perangkat lain
          yang memakai akun yang sama.
        </p>
      </header>

      {notice ? <div className="mb-4"><Notice tone={notice.tone}>{notice.text}</Notice></div> : null}

      {user.emailVerified ? null : (
        <div className="mb-4 rounded-xl border border-gold/35 bg-gold/10 p-4">
          <p className="flex items-center gap-2 text-[12.5px] font-semibold text-gold">
            <MailWarning className="size-4" aria-hidden />
            Email belum diverifikasi
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-text-2">
            Akun tetap bisa dipakai untuk menonton. Yang belum aktif hanya sinkronisasi
            daftar tonton dan riwayat tontonan antar perangkat — datanya masih tersimpan
            di peramban ini.{" "}
            {emailConfigured ? (
              <>
                Tautan verifikasi dikirim ke{" "}
                <span className="text-text">{user.email}</span>.
              </>
            ) : (
              <>
                Pengiriman email belum diaktifkan di server ini, jadi tautan
                verifikasi tidak bisa dikirim ke{" "}
                <span className="text-text">{user.email}</span>.
              </>
            )}
          </p>
          <form action={resendVerificationAction} className="mt-3">
            <button type="submit" className={btnGhost}>
              <MailCheck className="size-3.5" aria-hidden />
              Kirim ulang tautan verifikasi
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* --- profil --- */}
        <section className="sticker p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-gold/15 font-mono text-lg font-semibold uppercase text-gold">
              {user.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-text">{user.name}</p>
              <p className="truncate text-[12.5px] text-text-3">{user.email}</p>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-[12.5px]">
            <div>
              <dt className="text-[10.5px] uppercase tracking-[0.14em] text-text-3">
                Bergabung
              </dt>
              <dd className="mt-0.5 text-text-2">{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] uppercase tracking-[0.14em] text-text-3">
                Status email
              </dt>
              <dd
                className={`mt-0.5 ${user.emailVerified ? "text-mint" : "text-gold"}`}
              >
                {user.emailVerified ? "Terverifikasi" : "Belum diverifikasi"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/my-list" className={btnPrimary}>
              <Bookmark className="size-4" aria-hidden />
              Buka Daftar Saya
            </Link>
            <form action={logoutAction}>
              <button type="submit" className={btnGhost}>
                <LogOut className="size-3.5" aria-hidden />
                Keluar
              </button>
            </form>
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-md border border-line bg-surface-2 px-3 py-2 text-[11.5px] leading-relaxed text-text-3">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-mint" aria-hidden />
            Kata sandi disimpan sebagai hash scrypt dengan salt acak. Sesi berakhir otomatis
            setelah 30 hari, atau segera setelah Anda keluar.
          </p>
        </section>

        {/* --- ringkasan --- */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="sticker-sm px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-text-3">
                <Bookmark className="size-3" aria-hidden />
                Daftar tonton
              </p>
              <p className="mt-1 font-mono text-2xl tabular-nums text-text">
                {stats.watchlist}
              </p>
            </div>
            <div className="sticker-sm px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-text-3">
                <Clock3 className="size-3" aria-hidden />
                Judul ditonton
              </p>
              <p className="mt-1 font-mono text-2xl tabular-nums text-text">
                {stats.progress}
              </p>
            </div>
          </div>

          <section className="sticker p-4">
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-text-3">
              Terakhir ditonton
            </h2>
            {progress.length === 0 ? (
              <p className="text-[12.5px] text-text-3">
                Belum ada riwayat. Mulai menonton satu episode, progres akan tercatat di sini.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {progress.map((row) => (
                  <li key={row.animeSlug}>
                    <Link
                      href={`/watch/${row.animeSlug}/${row.episodeNumber}`}
                      className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-[12.5px] text-text-2 hover:bg-surface-2 hover:text-text"
                    >
                      <span className="font-mono text-[11px] text-gold">
                        E{padEpisode(row.episodeNumber)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {titles.get(row.animeSlug) ?? row.animeSlug}
                      </span>
                      <span className="text-[11px] text-text-3">
                        {timeAgo(row.updatedAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="sticker p-4">
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-text-3">
              Daftar tonton terbaru
            </h2>
            {watchlist.length === 0 ? (
              <p className="text-[12.5px] text-text-3">
                Belum ada judul tersimpan.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {watchlist.map((row) => (
                  <li key={row.animeSlug}>
                    <Link
                      href={`/anime/${row.animeSlug}`}
                      className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-[12.5px] text-text-2 hover:bg-surface-2 hover:text-text"
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {titles.get(row.animeSlug) ?? row.animeSlug}
                      </span>
                      <Badge>{timeAgo(row.addedAt)}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* ================= Keamanan akun ================= */}
      <section id="keamanan" className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="sticker p-5">
          <h2 className="text-sm font-semibold tracking-tight text-text">
            Ganti kata sandi
          </h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-text-3">
            Perlu kata sandi saat ini. Sesi di peramban lain tetap aktif — keluarkan
            terpisah bila perlu.
          </p>

          <form action={changePasswordAction} className="mt-3 space-y-3">
            <label className="block space-y-1.5">
              <span className={labelClass}>Kata sandi saat ini</span>
              <input
                type="password"
                name="current"
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={labelClass}>Kata sandi baru</span>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={labelClass}>Ulangi kata sandi baru</span>
              <input
                type="password"
                name="confirm"
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </label>
            <button type="submit" className={btnPrimary}>
              Simpan kata sandi
            </button>
          </form>

          <form action={logoutOthersAction} className="mt-4 border-t border-line pt-3">
            <button type="submit" className={btnGhost}>
              <LogOut className="size-3.5" aria-hidden />
              Keluarkan semua perangkat lain
            </button>
            <p className="mt-1.5 text-[11px] leading-relaxed text-text-3">
              Berguna bila Anda pernah masuk di komputer atau ponsel orang lain.
            </p>
          </form>
        </div>

        <div className="space-y-4">
          <div className="sticker p-5">
            <h2 className="text-sm font-semibold tracking-tight text-text">
              Lupa kata sandi nanti?
            </h2>
            <p className="mt-0.5 text-[12px] leading-relaxed text-text-3">
              Reset utama lewat tautan email di halaman lupa kata sandi. Kode ini
              menjadi jalan cadangan bila kotak masuk tidak bisa dibuka.
            </p>
            <div className="mt-3">
              {recoveryCode ? (
                <div className="rounded-md border border-mint/40 bg-mint/10 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-mint">
                    <ShieldCheck className="size-3.5" aria-hidden />
                    Simpan sekarang — hanya tampil sekali
                  </p>
                  <code className="mt-1.5 block select-all font-mono text-[14px] tracking-wider text-text">
                    {recoveryCode}
                  </code>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-text-3">
                    Setelah ditutup, kode tidak bisa ditampilkan lagi. Kalau hilang,
                    buat kode baru.
                  </p>
                  <form action={dismissRecoveryCodeAction} className="mt-2.5">
                    <button type="submit" className={btnGhost}>
                      Sudah saya simpan
                    </button>
                  </form>
                </div>
              ) : (
                <div className="rounded-md border border-line bg-surface-2/60 p-3">
                  <p className="text-[11.5px] leading-relaxed text-text-3">
                    Kode hanya ditampilkan sekali saat dibuat. Membuat kode baru
                    membatalkan kode lama.
                  </p>
                  <form action={createRecoveryCodeAction} className="mt-2.5">
                    <button type="submit" className={btnGhost}>
                      <KeyRound className="size-3.5" aria-hidden />
                      Buat kode pemulihan
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-coral/30 bg-coral/5 p-5">
            <h2 className="text-sm font-semibold tracking-tight text-coral">
              Hapus akun
            </h2>
            <p className="mt-0.5 text-[12px] leading-relaxed text-text-3">
              Menghapus akun sekaligus menghapus riwayat tontonan dan daftar tonton.
              Tindakan ini tidak bisa dibatalkan.
            </p>

            <form action={deleteAccountAction} className="mt-3 space-y-3">
              <label className="block space-y-1.5">
                <span className={labelClass}>Kata sandi</span>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1.5">
                <span className={labelClass}>Ketik HAPUS untuk konfirmasi</span>
                <input
                  name="confirmation"
                  required
                  placeholder="HAPUS"
                  className={inputClass}
                />
              </label>
              <button type="submit" className={btnDanger}>
                Hapus akun permanen
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
