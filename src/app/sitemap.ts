import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getSitemapEntries } from "@/server/queries/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { projects } = await getSitemapEntries();

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/projetos`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/sobre`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/contato`, changeFrequency: "yearly", priority: 0.7 },
    ...projects.map((p) => ({
      url: `${base}/projetos/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
