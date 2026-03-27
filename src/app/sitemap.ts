// filepath: src/app/sitemap.ts

import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pixel-mart.app";

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Dynamic product pages — marketplace
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await fetchQuery(api.products.queries.listLatest, {
      limit: 50,
    });
    productRoutes = (products ?? []).map((p) => ({
      url: `${siteUrl}/products/${p.slug}`,
      lastModified: new Date(p._creationTime),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Sitemap still works without products
  }

  // Dynamic store pages
  let storeRoutes: MetadataRoute.Sitemap = [];
  try {
    const stores = await fetchQuery(api.stores.queries.listActive, {
      limit: 50,
    });
    storeRoutes = (stores ?? []).map((s) => ({
      url: `${siteUrl}/shop/${s.slug}`,
      lastModified: new Date(s._creationTime),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // Sitemap still works without stores
  }

  return [...staticRoutes, ...productRoutes, ...storeRoutes];
}
