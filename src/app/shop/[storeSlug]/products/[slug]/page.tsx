// filepath: src/app/shop/[storeSlug]/products/[slug]/page.tsx

import { preloadQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { ShopProductPageClient } from "./ShopProductPageClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ storeSlug: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await preloadQuery(api.products.queries.getBySlug, { slug });
    // @ts-expect-error — preloadQuery returns opaque type; access via _preloaded for metadata
    const data = product?._preloaded?.value?.data;
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

export default async function ShopProductPage({ params }: Props) {
  const { storeSlug, slug } = await params;

  const [preloadedProduct, preloadedStore] = await Promise.all([
    preloadQuery(api.products.queries.getBySlug, { slug }),
    preloadQuery(api.stores.queries.getBySlug, { slug: storeSlug }),
  ]);

  return (
    <ShopProductPageClient
      preloadedProduct={preloadedProduct}
      preloadedStore={preloadedStore}
      storeSlug={storeSlug}
      slug={slug}
    />
  );
}
