#!/usr/bin/env node
/**
 * Periksa konfigurasi email Mailjet tanpa membuka aplikasi.
 *
 *   npm run cek-email
 *   npm run cek-email -- --to=alamat@lain.com
 *   npm run cek-email -- --dry      # hanya periksa konfigurasi, tidak mengirim
 *
 * Kegunaannya: memisahkan masalah kredensial/pengirim Mailjet dari masalah
 * aplikasi. Kalau skrip ini bisa mengirim, berarti sisa masalahnya ada di
 * `.env.local` aplikasi atau di alur pendaftaran — bukan di Mailjet.
 *
 * Sengaja berdiri sendiri (tanpa impor dari src/) dan tanpa dependensi, agar
 * bisa dijalankan sebelum aplikasi berhasil di-build. Nilai rahasia tidak
 * pernah dicetak.
 */

import fs from "node:fs";
import path from "node:path";

const ENDPOINT_DEFAULT = "https://api.mailjet.com/v3.1/send";

/* ---------------------------- pembacaan .env ---------------------------- */

/** Parser sederhana: KEY=VALUE, abaikan komentar dan tanda kutip pembungkus. */
function readEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadEnv() {
  const cwd = process.cwd();
  // Urutan meniru Next.js: .env.local menang atas .env; process.env menang atas file.
  const fromFile = { ...readEnvFile(path.join(cwd, ".env")), ...readEnvFile(path.join(cwd, ".env.local")) };
  const pick = (key) => (process.env[key] ?? fromFile[key] ?? "").trim();
  return {
    key: pick("MJ_APIKEY_PUBLIC"),
    secret: pick("MJ_APIKEY_PRIVATE"),
    from: pick("CAPTNIME_MAIL_FROM"),
    fromName: pick("CAPTNIME_MAIL_FROM_NAME") || "Captnime",
    sandbox: pick("CAPTNIME_MAIL_SANDBOX") === "1",
    endpoint: pick("CAPTNIME_MAILJET_ENDPOINT") || ENDPOINT_DEFAULT,
    files: [".env", ".env.local"].filter((f) => fs.existsSync(path.join(cwd, f))),
  };
}

/* ------------------------------ pemeriksaan ----------------------------- */

const PLACEHOLDER_PREFIX = /^(changeme|ganti|isi|contoh|example|your|placeholder)/i;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function placeholder(value) {
  const v = value.toLowerCase();
  if (/x{4,}/.test(v)) return true;
  if (PLACEHOLDER_PREFIX.test(v)) return true;
  if (v.startsWith("alamat-")) return true;
  return false;
}

function masalah(env) {
  if (!env.key || !env.secret || !env.from) {
    return "salah satu dari MJ_APIKEY_PUBLIC / MJ_APIKEY_PRIVATE / CAPTNIME_MAIL_FROM masih kosong";
  }
  if ([env.key, env.secret, env.from].some(placeholder)) {
    return "nilainya masih placeholder dari .env.example (mis. \"xxxx\") — ganti dengan nilai asli";
  }
  if (!EMAIL_SHAPE.test(env.from)) {
    return `CAPTNIME_MAIL_FROM bukan alamat email yang sah: ${env.from}`;
  }
  return null;
}

const mask = (value) =>
  value.length <= 6 ? "***" : `${value.slice(0, 4)}${"*".repeat(Math.min(8, value.length - 4))}`;

/* --------------------------------- main -------------------------------- */

const args = process.argv.slice(2);
const toArg = args.find((a) => a.startsWith("--to="))?.slice(5)?.trim();
const dry = args.includes("--dry");

const env = loadEnv();

console.log("Memeriksa konfigurasi email Captnime…\n");
console.log(`  Berkas env   : ${env.files.length ? env.files.join(", ") : "(tidak ada .env / .env.local)"}`);
console.log(`  API Key      : ${env.key ? mask(env.key) : "(kosong)"}`);
console.log(`  Secret Key   : ${env.secret ? "(terisi)" : "(kosong)"}`);
console.log(`  Pengirim     : ${env.from || "(kosong)"}`);
console.log(`  Endpoint     : ${env.endpoint}`);
console.log(`  SandboxMode  : ${env.sandbox ? "AKTIF — email tidak akan benar-benar dikirim" : "nonaktif"}`);

const problem = masalah(env);
if (problem) {
  console.error(`\n✗ Konfigurasi belum siap: ${problem}.`);
  console.error("  Isi nilainya di .env.local (lihat .env.example dan docs/EMAIL.md).");
  process.exit(1);
}

const target = toArg || env.from;
console.log(`  Tujuan uji   : ${target}\n`);

if (dry) {
  console.log("✓ Konfigurasi terbaca dan bentuknya wajar (--dry: tidak ada email dikirim).");
  process.exit(0);
}

const auth = Buffer.from(`${env.key}:${env.secret}`).toString("base64");
const payload = {
  Messages: [
    {
      From: { Email: env.from, Name: env.fromName },
      To: [{ Email: target, Name: "Uji Captnime" }],
      Subject: "Uji kirim Captnime",
      TextPart:
        "Kalau Anda membaca email ini, kredensial dan alamat pengirim Mailjet sudah benar.\n\n— Captnime",
      HTMLPart:
        '<p>Kalau Anda membaca email ini, kredensial dan alamat pengirim Mailjet sudah benar.</p><p>— Captnime</p>',
    },
  ],
};
if (env.sandbox) payload.SandboxMode = true;

console.log("Mengirim…");
try {
  const res = await fetch(env.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.text();

  if (!res.ok) {
    console.error(`\n✗ Mailjet menolak (HTTP ${res.status}).`);
    console.error(`  Balasan: ${body.slice(0, 400)}`);
    if (res.status === 401) {
      console.error("  Petunjuk: 401 = API Key/Secret Key salah atau tertukar (bukan email login).");
    } else if (res.status === 400) {
      console.error(
        "  Petunjuk: 400 = biasanya alamat pengirim belum divalidasi di Senders & Domains, atau bentuk payload ditolak.",
      );
    }
    process.exit(1);
  }

  console.log(`\n✓ Diterima Mailjet (HTTP ${res.status}).`);
  console.log(`  ${body.slice(0, 300)}`);
  if (env.sandbox) {
    console.log("\n  SandboxMode aktif: pesan divalidasi tetapi TIDAK dikirim ke kotak masuk.");
  } else {
    console.log(`\n  Periksa kotak masuk ${target} (dan folder spam) dalam beberapa detik.`);
  }
} catch (error) {
  console.error(`\n✗ Gagal menghubungi ${env.endpoint}: ${error.message}`);
  console.error("  Periksa koneksi internet, firewall, atau nilai CAPTNIME_MAILJET_ENDPOINT.");
  process.exit(1);
}
