import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Preview sandbox memakai host *.e2b.app — izinkan agar HMR & aset dev tidak diblokir.
  allowedDevOrigins: ["*.e2b.app", "localhost", "127.0.0.1"],
  images: {
    // Provider remote boleh mengirim URL poster dari CDN-nya sendiri.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
