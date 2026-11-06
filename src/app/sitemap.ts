import type { MetadataRoute } from "next";
import { getProvider } from "@/lib/provider";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://captnime.app";
  const provider = getProvider();
  const slugs = await provider.allSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/browse`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/schedule`, changeFrequency: "daily", priority: 0.7 },
  ];

  const animeRoutes: MetadataRoute.Sitemap = [];
  for (const slug of slugs) {
    const anime = await provider.getBySlug(slug);
    if (!anime) continue;
    animeRoutes.push({
      url: `${base}/anime/${slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    const latest = anime.episodes.at(-1);
    if (latest) {
      animeRoutes.push({
        url: `${base}/watch/${slug}/${latest.number}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return [...staticRoutes, ...animeRoutes];
}
