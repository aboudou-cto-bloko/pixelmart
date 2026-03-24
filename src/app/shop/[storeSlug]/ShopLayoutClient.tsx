"use client";

// filepath: src/app/shop/[storeSlug]/ShopLayoutClient.tsx

import { usePreloadedQuery, type Preloaded } from "convex/react";
import { notFound } from "next/navigation";
import type { api } from "../../../../convex/_generated/api";
import {
  MetaPixelProvider,
  ShopCartProvider,
} from "@/components/vendor-shop/providers";
import { ShopHeader } from "@/components/vendor-shop/organisms/ShopHeader";
import { ShopFooter } from "@/components/vendor-shop/organisms/ShopFooter";
import { Toaster } from "@/components/ui/sonner";

interface ShopLayoutClientProps {
  children: React.ReactNode;
  storeSlug: string;
  preloadedConfig: Preloaded<typeof api.meta.queries.getPublicConfig>;
}

export function ShopLayoutClient({
  children,
  storeSlug,
  preloadedConfig,
}: ShopLayoutClientProps) {
  const config = usePreloadedQuery(preloadedConfig);

  // Store non trouvé, inactif, ou vendor shop désactivé → 404
  if (!config || !config.vendorShopEnabled) {
    notFound();
  }

  return (
    <MetaPixelProvider
      pixelId={config.pixelId}
      testEventCode={config.testEventCode}
    >
      <ShopCartProvider storeSlug={storeSlug}>
        <div
          className="flex min-h-screen flex-col"
          style={
            {
              "--shop-primary": config.primaryColor,
            } as React.CSSProperties
          }
        >
          <ShopHeader
            storeName={config.storeName}
            storeSlug={storeSlug}
            logoUrl={config.logoUrl}
          />
          <main className="flex-1">
            <div className="container mx-auto px-4 py-6">{children}</div>
          </main>
          <ShopFooter storeName={config.storeName} storeSlug={storeSlug} />
          <Toaster position="bottom-right" />
        </div>
      </ShopCartProvider>
    </MetaPixelProvider>
  );
}
