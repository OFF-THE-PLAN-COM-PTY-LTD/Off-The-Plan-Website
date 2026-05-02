import type { MetadataRoute } from "next";
import { mockDevelopments, mockJournalArticles, mockDevelopers } from "@/lib/mock-data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://offtheplan.com.au";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/map`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/journal`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/developers`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/resources`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${BASE_URL}/list-a-development`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // TODO: Replace mock data with Supabase query:
  // const { data } = await supabase.from('developments').select('slug, updated_at').eq('is_published', true)
  const developmentRoutes: MetadataRoute.Sitemap = mockDevelopments
    .filter((d) => d.is_published)
    .map((d) => ({
      url: `${BASE_URL}/developments/${d.slug}`,
      lastModified: d.updated_at ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  // TODO: Replace mock data with Supabase query:
  // const { data } = await supabase.from('journal_articles').select('slug, published_at').eq('is_published', true)
  const journalRoutes: MetadataRoute.Sitemap = mockJournalArticles
    .filter((a) => a.is_published)
    .map((a) => ({
      url: `${BASE_URL}/journal/${a.slug}`,
      lastModified: a.published_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  // TODO: Replace mock data with Supabase query:
  // const { data } = await supabase.from('developers').select('slug, created_at').eq('is_published', true)
  const developerRoutes: MetadataRoute.Sitemap = mockDevelopers
    .filter((d) => d.is_published)
    .map((d) => ({
      url: `${BASE_URL}/developers/${d.slug}`,
      lastModified: d.created_at ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [...staticRoutes, ...developmentRoutes, ...journalRoutes, ...developerRoutes];
}
