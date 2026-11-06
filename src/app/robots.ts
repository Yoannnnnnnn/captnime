import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/my-list", "/akun", "/masuk", "/daftar", "/admin", "/api/"],
      },
    ],
    sitemap: "https://captnime.app/sitemap.xml",
  };
}
