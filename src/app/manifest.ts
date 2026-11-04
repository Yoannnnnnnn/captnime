import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Captnime — Streaming Anime Sub Indo",
    short_name: "Captnime",
    description:
      "Nonton anime subtitle Indonesia dengan antarmuka cepat, riwayat tontonan tersimpan, dan kualitas hingga 1080p.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff7e9",
    theme_color: "#fff7e9",
    lang: "id",
    categories: ["entertainment", "video"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Jelajah Katalog", url: "/browse" },
      { name: "Jadwal Rilis", url: "/schedule" },
      { name: "Daftar Saya", url: "/my-list" },
    ],
  };
}
