// filepath: src/app/shop/[storeSlug]/layout.tsx

import { preloadQuery, fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { ShopLayoutClient } from "./ShopLayoutClient";
import { ChatwayScript } from "@/components/atoms/ChatwayScript";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pixel-mart-bj.com";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { storeSlug } = await params;

  try {
    const config = await fetchQuery(api.meta.queries.getPublicConfig, {
      storeSlug,
    });

    if (config) {
      const storeName = config.storeName;
      const description =
        config.storeDescription ??
        `Découvrez les produits de ${storeName} sur Pixel-Mart`;
      const storeUrl = `${siteUrl}/shop/${storeSlug}`;

      return {
        title: {
          template: `%s | ${storeName}`,
          default: storeName,
        },
        description,
        openGraph: {
          type: "website",
          locale: "fr_FR",
          url: storeUrl,
          siteName: "Pixel-Mart",
          title: storeName,
          description,
          images: config.logoUrl
            ? [{ url: config.logoUrl, alt: storeName }]
            : [{ url: "/og-image.png", alt: "Pixel-Mart" }],
        },
        twitter: {
          card: "summary",
          title: storeName,
          description,
          images: config.logoUrl ? [config.logoUrl] : ["/og-image.png"],
        },
        alternates: {
          canonical: storeUrl,
        },
      };
    }
  } catch {
    // Fallback si le store n'existe pas
  }

  return {
    title: {
      template: `%s | Boutique sur Pixel-Mart`,
      default: `Boutique | Pixel-Mart`,
    },
    description: `Découvrez les produits de cette boutique en ligne sur Pixel-Mart`,
  };
}

export default async function ShopLayout({ children, params }: LayoutProps) {
  const { storeSlug } = await params;

  const preloadedConfig = await preloadQuery(api.meta.queries.getPublicConfig, {
    storeSlug,
  });

  return (
    <>
      <ShopLayoutClient storeSlug={storeSlug} preloadedConfig={preloadedConfig}>
        {children}
      </ShopLayoutClient>
      <ChatwayScript />
    </>
  );
}
