import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Server action membawa berkas unggahan; batas bawaan Next hanya 1 MB.
  // Samakan dengan CAPTNIME_UPLOAD_MAX_MB (default 512 MB).
  experimental: {
    serverActions: { bodySizeLimit: "512mb" },
  },
  poweredByHeader: false,
  // Build produksi memakai folder cache terpisah (.next-build) agar tidak
  // merusak cache `next dev` saat keduanya dijalankan di mesin yang sama.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Preview sandbox memakai host *.e2b.app — izinkan agar HMR & aset dev tidak diblokir.
  allowedDevOrigins: ["*.e2b.app", "localhost", "127.0.0.1"],
  images: {
    // Provider remote boleh mengirim URL poster dari CDN-nya sendiri.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
