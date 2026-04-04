// filepath: src/app/(storefront)/products/[slug]/page.tsx

import { preloadQuery, fetchQuery, preloadedQueryResult } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { MarketplaceProductPageClient } from "./MarketplaceProductPageClient";
import type { Metadata } from "next";

export const revalidate = 3600; // Revalidation ISR toutes les heures

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pixel-mart-bj.com";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await fetchQuery(api.products.queries.getBySlug, { slug });
    if (product) {
      const productUrl = `${siteUrl}/products/${slug}`;
      const description =
        product.short_description ?? `Achetez ${product.title} sur Pixel-Mart`;
      const image = product.images?.[0];

      return {
        title: product.title,
        description,
        alternates: { canonical: productUrl },
        openGraph: {
          type: "website",
          locale: "fr_FR",
          url: productUrl,
          siteName: "Pixel-Mart",
          title: product.title,
          description,
          images: image ? [{ url: image, alt: product.title }] : [],
        },
        twitter: {
          card: "summary_large_image",
          title: product.title,
          description,
          images: image ? [image] : [],
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

  const preloadedProduct = await preloadQuery(api.products.queries.getBySlug, {
    slug,
  });

  const product = preloadedQueryResult(preloadedProduct);

  const preloadedUpsell = product?.store
    ? await preloadQuery(api.products.queries.listOthersByStore, {
        storeId: product.store._id,
        excludeProductId: product._id,
      })
    : null;

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.short_description ?? product.title,
        image: product.images ?? [],
        url: `${siteUrl}/products/${slug}`,
        offers: {
          "@type": "Offer",
          priceCurrency: "XOF",
          price: product.price,
          availability:
            (product.quantity ?? 0) > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
        ...(product.avg_rating !== null &&
        product.avg_rating !== undefined &&
        product.review_count !== null &&
        product.review_count !== undefined
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.avg_rating.toFixed(1),
                reviewCount: product.review_count,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <MarketplaceProductPageClient
        preloadedProduct={preloadedProduct}
        preloadedUpsell={preloadedUpsell}
        slug={slug}
      />
    </>
  );
}
