// filepath: src/app/(storefront)/products/[slug]/page.tsx

import { preloadQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { MarketplaceProductPageClient } from "./MarketplaceProductPageClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const preloaded = await preloadQuery(api.products.queries.getBySlug, { slug });
    // @ts-expect-error — access internal preloaded value for metadata
    const data = preloaded?._preloaded?.value?.data;
    if (data) {
      return {
        title: data.title,
        description: data.short_description ?? `Achetez ${data.title} sur Pixel-Mart`,
        openGraph: {
          title: data.title,
          description: data.short_description ?? `Achetez ${data.title}`,
          images: data.images?.[0] ? [{ url: data.images[0] }] : [],
        },
      };
    }
  } catch {
    // fallback below
  }
  return {
    title: "Produit",
    description: "Découvrez ce produit sur Pixel-Mart",
  };
}

export default async function MarketplaceProductPage({ params }: Props) {
  const { slug } = await params;

  const preloadedProduct = await preloadQuery(api.products.queries.getBySlug, { slug });

  return (
    <MarketplaceProductPageClient preloadedProduct={preloadedProduct} slug={slug} />
  );
}
