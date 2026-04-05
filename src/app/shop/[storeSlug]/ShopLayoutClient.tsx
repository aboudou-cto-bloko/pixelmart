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
import { ScrollToTop } from "@/components/atoms/ScrollToTop";

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

  const isDark = config.themeMode === "dark";

  return (
    <MetaPixelProvider
      pixelId={config.pixelId}
      testEventCode={config.testEventCode}
      storeId={config.storeId}
    >
      <ShopCartProvider storeSlug={storeSlug}>
        <div
          data-theme-mode={config.themeMode ?? "light"}
          className="flex min-h-screen flex-col"
          style={
            {
              // --- Shop-specific variables ---
              ...config.themeCssVars,
              // --- Override Tailwind/shadcn CSS variables so that
              //     bg-background, bg-muted, bg-card, text-foreground,
              //     text-muted-foreground, border all respond to the theme ---
              "--background": "var(--shop-background)",
              "--foreground": "var(--shop-foreground)",
              "--card": "var(--shop-background)",
              "--card-foreground": "var(--shop-foreground)",
              "--popover": "var(--shop-background)",
              "--popover-foreground": "var(--shop-foreground)",
              "--primary": "var(--shop-primary)",
              "--primary-foreground": "var(--shop-primary-foreground)",
              "--muted": "var(--shop-muted)",
              "--muted-foreground": "var(--shop-muted-foreground)",
              "--border": "var(--shop-border)",
              "--input": "var(--shop-border)",
              "--radius": "var(--shop-radius)",
              // --- Apply theme immediately on the root element ---
              backgroundColor: "var(--shop-background)",
              color: "var(--shop-foreground)",
              fontFamily: "var(--shop-font-body)",
              colorScheme: isDark ? "dark" : "light",
            } as React.CSSProperties
          }
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
          >
            Passer au contenu principal
          </a>
          <ShopHeader
            storeName={config.storeName}
            storeSlug={storeSlug}
            logoUrl={config.logoUrl}
            isVerified={config.isVerified}
          />
          <main id="main-content" className="flex-1">
            <div className="container mx-auto px-4 py-6">{children}</div>
          </main>
          <ShopFooter
            storeName={config.storeName}
            storeSlug={storeSlug}
            contact={config.contact}
          />
          <Toaster position="bottom-right" theme={isDark ? "dark" : "light"} />
          <ScrollToTop />
        </div>
      </ShopCartProvider>
    </MetaPixelProvider>
  );
}
