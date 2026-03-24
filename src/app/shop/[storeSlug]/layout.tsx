// filepath: src/app/shop/[storeSlug]/layout.tsx

import { preloadQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { ShopLayoutClient } from "./ShopLayoutClient";
import type { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { storeSlug } = await params;

  // Tenter de récupérer le nom de la boutique pour les meta tags
  try {
    const config = await preloadQuery(api.meta.queries.getPublicConfig, {
      storeSlug,
    });
    // preloadQuery ne retourne pas directement la data, on met un titre générique
    void config;
  } catch {
    // Silencieux si le store n'existe pas
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
    <ShopLayoutClient storeSlug={storeSlug} preloadedConfig={preloadedConfig}>
      {children}
    </ShopLayoutClient>
  );
}
