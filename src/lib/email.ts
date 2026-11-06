import { headers } from "next/headers";

/**
 * Pengiriman email transaksional lewat Mailjet Send API v3.1.
 *
 * Sengaja tanpa SDK: cukup `fetch`. Dengan begitu tidak ada dependensi baru
 * dan pengujian lokal bisa memakai server tiruan lewat
 * `CAPTNIME_MAILJET_ENDPOINT` (sama seperti cara `CAPTNIME_ANILIST_ENDPOINT`
 * dipakai untuk metadata).
 *
 * Env yang dibaca:
 *   MJ_APIKEY_PUBLIC       API Key (username Basic auth; bukan email)
 *   MJ_APIKEY_PRIVATE      Secret Key (password Basic auth)
 *   CAPTNIME_MAIL_FROM     alamat pengirim yang SUDAH divalidasi di Mailjet
 *   CAPTNIME_MAIL_FROM_NAME  nama tampilan pengirim (opsional)
 *   CAPTNIME_APP_URL       basis tautan di dalam email, mis. https://captnime.id
 *   CAPTNIME_MAILJET_ENDPOINT  hanya untuk uji lokal / proxy
 *   CAPTNIME_MAIL_SANDBOX="1"  aktifkan SandboxMode Mailjet (validasi tanpa kirim)
 *
 * Bila kredensial kosong, `sendEmail` mengembalikan `{ ok: false, skipped: true }`
 * dan pemanggil menampilkan pesan yang ramah — bukan error 500.
 */

const DEFAULT_ENDPOINT = "https://api.mailjet.com/v3.1/send";

export interface EmailMessage {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  ok: boolean;
  /** True bila email tidak dicoba kirim karena kredensial belum diisi. */
  skipped?: boolean;
  error?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.MJ_APIKEY_PUBLIC?.trim() &&
      process.env.MJ_APIKEY_PRIVATE?.trim() &&
      process.env.CAPTNIME_MAIL_FROM?.trim(),
  );
}

/** Alamat pengirim yang dipakai (sudah harus tervalidasi di akun Mailjet). */
export function senderAddress(): string {
  return process.env.CAPTNIME_MAIL_FROM?.trim() || "no-reply@localhost";
}

/**
 * Basis URL untuk tautan di dalam email. Email dibuka di perangkat lain, jadi
 * tautan relatif tidak mungkin dipakai: harus absolut.
 *
 * Urutan: CAPTNIME_APP_URL (paling benar untuk produksi) → header permintaan
 * saat ini → localhost sebagai cadangan pengembangan.
 */
export async function appBaseUrl(): Promise<string> {
  const configured = process.env.CAPTNIME_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    /* di luar konteks permintaan (mis. skrip) — pakai cadangan */
  }

  return "http://localhost:3000";
}

export async function absoluteUrl(path: string): Promise<string> {
  const base = await appBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Kirim satu email. Tidak pernah melempar error: kegagalan jaringan atau
 * respons Mailjet bukan alasan menggagalkan pendaftaran pengguna.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.warn("[email] dilewati — MJ_APIKEY_PUBLIC/MJ_APIKEY_PRIVATE/CAPTNIME_MAIL_FROM belum diisi.");
    return { ok: false, skipped: true, error: "belum-dikonfigurasi" };
  }

  const endpoint = process.env.CAPTNIME_MAILJET_ENDPOINT?.trim() || DEFAULT_ENDPOINT;
  const auth = Buffer.from(
    `${process.env.MJ_APIKEY_PUBLIC!.trim()}:${process.env.MJ_APIKEY_PRIVATE!.trim()}`,
  ).toString("base64");

  const payload: Record<string, unknown> = {
    Messages: [
      {
        From: {
          Email: senderAddress(),
          Name: process.env.CAPTNIME_MAIL_FROM_NAME?.trim() || "Captnime",
        },
        To: [{ Email: message.to, ...(message.toName ? { Name: message.toName } : {}) }],
        Subject: message.subject,
        TextPart: message.text,
        HTMLPart: message.html,
      },
    ],
  };

  if (process.env.CAPTNIME_MAIL_SANDBOX === "1") payload.SandboxMode = true;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[email] Mailjet menolak (${res.status}): ${detail.slice(0, 300)}`);
      return { ok: false, error: `http-${res.status}` };
    }

    return { ok: true };
  } catch (error) {
    console.error("[email] gagal menghubungi Mailjet:", (error as Error).message);
    return { ok: false, error: "jaringan" };
  }
}

/* ------------------------------------------------------------------ */
/* Templat                                                            */
/* ------------------------------------------------------------------ */

const COLORS = {
  bg: "#f5f6fa",
  card: "#ffffff",
  text: "#11141c",
  text2: "#5a6274",
  line: "#e3e6ef",
  gold: "#a67400",
};

function layout(input: { title: string; body: string; footer: string }): string {
  return `<!doctype html>
<html lang="id"><body style="margin:0;padding:24px 12px;background:${COLORS.bg};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:${COLORS.card};border:1px solid ${COLORS.line};border-radius:14px;">
    <tr><td style="padding:24px 26px 8px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${COLORS.gold};font-weight:700;">Captnime</p>
      <h1 style="margin:8px 0 0;font-size:20px;line-height:1.3;color:${COLORS.text};">${input.title}</h1>
    </td></tr>
    <tr><td style="padding:12px 26px 4px;font-size:14px;line-height:1.65;color:${COLORS.text2};">
      ${input.body}
    </td></tr>
    <tr><td style="padding:18px 26px 24px;border-top:1px solid ${COLORS.line};margin-top:16px;font-size:12px;line-height:1.6;color:${COLORS.text2};">
      ${input.footer}
    </td></tr>
  </table>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:20px 0;"><a href="${href}" style="display:inline-block;background:${COLORS.gold};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:8px;">${label}</a></p>`;
}

export function verificationEmail(input: { name: string; url: string; hours: number }) {
  return {
    subject: "Verifikasi email Captnime Anda",
    html: layout({
      title: `Halo ${input.name}, satu langkah lagi`,
      body: `<p style="margin:0;">Konfirmasi alamat email ini untuk mengaktifkan sinkronisasi daftar tonton dan riwayat tontonan Anda antar perangkat.</p>
        ${button(input.url, "Verifikasi email saya")}
        <p style="margin:0;">Tautan berlaku ${input.hours} jam dan hanya bisa dipakai sekali.</p>`,
      footer: `Kalau Anda tidak merasa membuat akun Captnime, abaikan email ini — tidak ada yang berubah.<br><br>
        Tombol tidak berfungsi? Salin tautan berikut ke peramban:<br>
        <span style="word-break:break-all;color:${COLORS.text2};">${input.url}</span>`,
    }),
    text: `Halo ${input.name},

Konfirmasi alamat email ini untuk mengaktifkan sinkronisasi daftar tonton dan
riwayat tontonan Anda antar perangkat.

${input.url}

Tautan berlaku ${input.hours} jam dan hanya bisa dipakai sekali.
Kalau Anda tidak merasa membuat akun Captnime, abaikan email ini.

— Captnime`,
  };
}

export function resetEmail(input: { name: string; url: string; minutes: number }) {
  return {
    subject: "Atur ulang kata sandi Captnime",
    html: layout({
      title: "Atur ulang kata sandi",
      body: `<p style="margin:0;">Halo ${input.name}, kami menerima permintaan untuk mengatur ulang kata sandi akun Captnime Anda.</p>
        ${button(input.url, "Buat kata sandi baru")}
        <p style="margin:0;">Tautan berlaku ${input.minutes} menit dan hanya bisa dipakai sekali. Semua sesi lain akan dikeluarkan setelah kata sandi diganti.</p>`,
      footer: `Tidak meminta reset? Abaikan email ini — kata sandi Anda tidak berubah.<br><br>
        Tombol tidak berfungsi? Salin tautan berikut ke peramban:<br>
        <span style="word-break:break-all;">${input.url}</span>`,
    }),
    text: `Halo ${input.name},

Kami menerima permintaan untuk mengatur ulang kata sandi akun Captnime Anda.

${input.url}

Tautan berlaku ${input.minutes} menit dan hanya bisa dipakai sekali.
Semua sesi lain akan dikeluarkan setelah kata sandi diganti.
Tidak meminta reset? Abaikan email ini — kata sandi Anda tidak berubah.

— Captnime`,
  };
}
