import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getSitemapEntries } from "@/lib/content";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const { projects, categories } = getSitemapEntries();

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/projetos`, changeFrequency: "weekly", priority: 0.9 },
    ...categories.map((c) => ({ url: `${base}/projetos/categoria/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
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
