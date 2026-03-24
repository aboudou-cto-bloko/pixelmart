# VENDOR SHOP — Guide d'implémentation complet (V2)

> **Fonctionnalité** : Storefront vendeur indépendant avec intégration Facebook Ads (Meta Pixel + Conversions API)
> **Route** : `pixelmart.com/shop/[storeSlug]`
> **Principe** : Pas de branding Pixel-Mart, focus 100% boutique vendeur

---

## Table des matières

1. [Schema Patch](#1-schema-patch)
2. [Backend Meta Pixel](#2-backend-meta-pixel)
3. [Providers](#3-providers)
4. [Layout Vendor Shop](#4-layout-vendor-shop)
5. [Organismes (Header/Footer)](#5-organismes)
6. [Pages Vendor Shop](#6-pages-vendor-shop)
7. [Page Settings Vendor](#7-page-settings-vendor)
8. [Intégration Webhook](#8-intégration-webhook)
9. [Routes & Constants](#9-routes--constants)
10. [Commits](#10-commits)

---

## 1. Schema Patch

### Fichier : `convex/schema.ts`

Ajouter ces champs à la table `stores` :

```typescript
// Dans la définition de "stores", ajouter :
meta_pixel_id: v.optional(v.string()),
meta_access_token: v.optional(v.string()),
meta_test_event_code: v.optional(v.string()),
vendor_shop_enabled: v.optional(v.boolean()),
```

**Commit** : `schema(stores): add meta pixel and vendor shop fields`

---

## 2. Backend Meta Pixel

### 2.1 Helpers — `convex/meta/helpers.ts`

```typescript
// filepath: convex/meta/helpers.ts

import { createHash } from "crypto";

/**
 * Hash une valeur pour Meta CAPI (SHA-256, lowercase, trimmed)
 */
export function hashForMeta(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase().trim();
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Génère un event_id unique pour la déduplication Pixel/CAPI
 */
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Formate les données utilisateur pour Meta CAPI
 * Hash automatiquement les PII (email, phone, name)
 */
export function formatUserData(userData: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
}): Record<string, string | undefined> {
  return {
    em: hashForMeta(userData.email),
    ph: hashForMeta(userData.phone?.replace(/\D/g, "")),
    fn: hashForMeta(userData.firstName),
    ln: hashForMeta(userData.lastName),
    ct: hashForMeta(userData.city),
    country: hashForMeta(userData.country),
    client_ip_address: userData.clientIpAddress,
    client_user_agent: userData.clientUserAgent,
    fbc: userData.fbc,
    fbp: userData.fbp,
  };
}

/**
 * Formate les données custom pour Meta CAPI
 * Convertit les centimes en unités
 */
export function formatCustomData(data: {
  contentIds?: string[];
  contentType?: "product" | "product_group";
  value?: number; // en centimes
  currency?: string;
  numItems?: number;
  orderId?: string;
}): Record<string, unknown> {
  return {
    content_ids: data.contentIds,
    content_type: data.contentType ?? "product",
    value: data.value ? data.value / 100 : undefined, // centimes → unités
    currency: data.currency ?? "XOF",
    num_items: data.numItems,
    order_id: data.orderId,
  };
}
```

### 2.2 Queries — `convex/meta/queries.ts`

```typescript
// filepath: convex/meta/queries.ts

import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { resolveImageUrl } from "../products/helpers";

/**
 * Config publique Meta Pixel (sans token)
 * Utilisé par le frontend pour initialiser fbq
 */
export const getPublicConfig = query({
  args: { storeSlug: v.string() },
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", args.storeSlug))
      .first();

    if (!store || store.status !== "active") {
      return null;
    }

    // Ne pas exposer le token côté client
    const logoUrl = store.logo_url
      ? await resolveImageUrl(ctx, store.logo_url)
      : null;

    return {
      storeId: store._id,
      storeName: store.name,
      storeSlug: store.slug,
      pixelId: store.meta_pixel_id ?? null,
      testEventCode: store.meta_test_event_code ?? null,
      vendorShopEnabled: store.vendor_shop_enabled ?? false,
      primaryColor: store.primary_color ?? "#6366f1",
      logoUrl,
      currency: store.currency ?? "XOF",
    };
  },
});

/**
 * Config complète Meta (avec token) — usage interne uniquement
 */
export const getStoreMetaConfig = internalQuery({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) return null;

    return {
      pixelId: store.meta_pixel_id,
      accessToken: store.meta_access_token,
      testEventCode: store.meta_test_event_code,
      currency: store.currency ?? "XOF",
    };
  },
});
```

### 2.3 Mutations — `convex/meta/mutations.ts`

```typescript
// filepath: convex/meta/mutations.ts

import { mutation, action, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { getVendorStore } from "../users/helpers";
import { formatUserData, formatCustomData, generateEventId } from "./helpers";

/**
 * Met à jour la configuration Meta Pixel d'un store
 */
export const updateMetaConfig = mutation({
  args: {
    pixelId: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    testEventCode: v.optional(v.string()),
    vendorShopEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    // Validation Pixel ID : 15-16 chiffres
    if (args.pixelId && !/^\d{15,16}$/.test(args.pixelId)) {
      throw new Error("Le Pixel ID doit contenir 15 ou 16 chiffres");
    }

    await ctx.db.patch(store._id, {
      meta_pixel_id: args.pixelId,
      meta_access_token: args.accessToken,
      meta_test_event_code: args.testEventCode,
      vendor_shop_enabled: args.vendorShopEnabled,
    });

    return { success: true };
  },
});

/**
 * Envoie un événement à Meta Conversions API (action car appel externe)
 */
export const sendServerEvent = action({
  args: {
    pixelId: v.string(),
    accessToken: v.string(),
    testEventCode: v.optional(v.string()),
    eventName: v.string(),
    eventId: v.string(),
    eventTime: v.number(),
    eventSourceUrl: v.string(),
    userData: v.any(),
    customData: v.any(),
  },
  handler: async (ctx, args) => {
    const url = `https://graph.facebook.com/v18.0/${args.pixelId}/events`;

    const payload = {
      data: [
        {
          event_name: args.eventName,
          event_time: args.eventTime,
          event_id: args.eventId,
          event_source_url: args.eventSourceUrl,
          action_source: "website",
          user_data: args.userData,
          custom_data: args.customData,
        },
      ],
      ...(args.testEventCode && { test_event_code: args.testEventCode }),
    };

    const response = await fetch(`${url}?access_token=${args.accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Meta CAPI] Error:", error);
      throw new Error(`Meta CAPI error: ${response.status}`);
    }

    const result = await response.json();
    console.log("[Meta CAPI] Event sent:", args.eventName, result);

    return { success: true, eventsReceived: result.events_received };
  },
});

/**
 * Track Purchase event (appelé après confirmation paiement)
 */
export const trackPurchase = internalMutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return;

    // Récupérer la config Meta du store
    const metaConfig = await ctx.runQuery(internal.meta.queries.getStoreMetaConfig, {
      storeId: order.store_id,
    });

    if (!metaConfig?.pixelId || !metaConfig?.accessToken) {
      console.log("[Meta] No pixel config for store, skipping Purchase event");
      return;
    }

    // Récupérer le customer
    const customer = await ctx.db.get(order.customer_id);

    // Préparer les données
    const eventId = generateEventId();
    const eventTime = Math.floor(Date.now() / 1000);

    const userData = formatUserData({
      email: customer?.email,
      firstName: order.shipping_address.full_name.split(" ")[0],
      lastName: order.shipping_address.full_name.split(" ").slice(1).join(" "),
      city: order.shipping_address.city,
      country: order.shipping_address.country,
      phone: order.shipping_address.phone,
    });

    const contentIds = order.items.map((item) => item.product_id);

    const customData = formatCustomData({
      contentIds,
      contentType: "product",
      value: order.total_amount,
      currency: metaConfig.currency,
      numItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
      orderId: order.order_number,
    });

    // Planifier l'envoi de l'événement
    await ctx.scheduler.runAfter(0, internal.meta.mutations.sendServerEventInternal, {
      pixelId: metaConfig.pixelId,
      accessToken: metaConfig.accessToken,
      testEventCode: metaConfig.testEventCode,
      eventName: "Purchase",
      eventId,
      eventTime,
      eventSourceUrl: `https://pixelmart.com/shop/${order.store_slug}/checkout/confirmation`,
      userData,
      customData,
    });
  },
});

/**
 * Wrapper interne pour sendServerEvent (pour scheduler)
 */
export const sendServerEventInternal = action({
  args: {
    pixelId: v.string(),
    accessToken: v.string(),
    testEventCode: v.optional(v.string()),
    eventName: v.string(),
    eventId: v.string(),
    eventTime: v.number(),
    eventSourceUrl: v.string(),
    userData: v.any(),
    customData: v.any(),
  },
  handler: async (ctx, args) => {
    const url = `https://graph.facebook.com/v18.0/${args.pixelId}/events`;

    const payload = {
      data: [
        {
          event_name: args.eventName,
          event_time: args.eventTime,
          event_id: args.eventId,
          event_source_url: args.eventSourceUrl,
          action_source: "website",
          user_data: args.userData,
          custom_data: args.customData,
        },
      ],
      ...(args.testEventCode && { test_event_code: args.testEventCode }),
    };

    const response = await fetch(`${url}?access_token=${args.accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Meta CAPI] Purchase event error:", error);
    }
  },
});
```

### 2.4 Index — `convex/meta/index.ts`

```typescript
// filepath: convex/meta/index.ts

export * from "./queries";
export * from "./mutations";
```

---

## 3. Providers

### 3.1 MetaPixelProvider — `src/components/vendor-shop/providers/MetaPixelProvider.tsx`

```typescript
// filepath: src/components/vendor-shop/providers/MetaPixelProvider.tsx

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

// ─── Types ───────────────────────────────────────────────────

interface MetaPixelContextValue {
  pixelId: string | null;
  isReady: boolean;
  trackEvent: (
    eventName: string,
    params?: Record<string, unknown>,
    eventId?: string
  ) => void;
  generateEventId: () => string;
}

interface MetaPixelProviderProps {
  children: ReactNode;
  pixelId: string | null;
  testEventCode?: string | null;
}

// ─── Context ─────────────────────────────────────────────────

const MetaPixelContext = createContext<MetaPixelContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────

export function MetaPixelProvider({
  children,
  pixelId,
  testEventCode,
}: MetaPixelProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Générer un event_id unique pour déduplication
  const generateEventId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  // Track event générique
  const trackEvent = useCallback(
    (
      eventName: string,
      params?: Record<string, unknown>,
      eventId?: string
    ) => {
      if (!isReady || !pixelId) return;

      try {
        const fbq = (window as unknown as { fbq?: Function }).fbq;
        if (fbq) {
          if (eventId) {
            fbq("track", eventName, params, { eventID: eventId });
          } else {
            fbq("track", eventName, params);
          }
          console.log(`[Meta Pixel] ${eventName}`, params);
        }
      } catch (error) {
        console.error("[Meta Pixel] Error tracking event:", error);
      }
    },
    [isReady, pixelId]
  );

  // PageView automatique sur changement de route
  useEffect(() => {
    if (isReady && pixelId) {
      trackEvent("PageView");
    }
  }, [pathname, searchParams, isReady, pixelId, trackEvent]);

  // Pas de Pixel configuré
  if (!pixelId) {
    return (
      <MetaPixelContext.Provider
        value={{ pixelId: null, isReady: false, trackEvent, generateEventId }}
      >
        {children}
      </MetaPixelContext.Provider>
    );
  }

  return (
    <MetaPixelContext.Provider
      value={{ pixelId, isReady, trackEvent, generateEventId }}
    >
      {/* Script Meta Pixel */}
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onLoad={() => setIsReady(true)}
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            ${testEventCode ? `fbq('set', 'test_event_code', '${testEventCode}');` : ""}
          `,
        }}
      />
      {/* Fallback noscript */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      {children}
    </MetaPixelContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────

export function useMetaPixel(): MetaPixelContextValue {
  const context = useContext(MetaPixelContext);
  if (!context) {
    throw new Error("useMetaPixel must be used within a MetaPixelProvider");
  }
  return context;
}
```

### 3.2 ShopCartProvider — `src/components/vendor-shop/providers/ShopCartProvider.tsx`

```typescript
// filepath: src/components/vendor-shop/providers/ShopCartProvider.tsx

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────────────

export interface ShopCartItem {
  cartItemId: string;
  productId: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  slug: string;
  image: string;
  price: number;
  comparePrice?: number;
  quantity: number;
  maxQuantity: number;
  isDigital: boolean;
}

interface ShopCartState {
  items: ShopCartItem[];
  totalItems: number;
  totalAmount: number;
}

interface ShopCartActions {
  addItem: (item: Omit<ShopCartItem, "cartItemId">) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

type ShopCartContextValue = ShopCartState & ShopCartActions;

interface ShopCartProviderProps {
  children: ReactNode;
  storeSlug: string;
}

// ─── Helpers ─────────────────────────────────────────────────

function getStorageKey(storeSlug: string): string {
  return `pixelmart-shop-cart-${storeSlug}`;
}

function generateCartItemId(productId: string, variantId?: string): string {
  return variantId ? `${productId}__${variantId}` : productId;
}

function loadFromStorage(storeSlug: string): ShopCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(storeSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(storeSlug: string, items: ShopCartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(storeSlug), JSON.stringify(items));
  } catch {
    // Storage full or disabled
  }
}

// ─── Context ─────────────────────────────────────────────────

const ShopCartContext = createContext<ShopCartContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────

export function ShopCartProvider({ children, storeSlug }: ShopCartProviderProps) {
  const [items, setItems] = useState<ShopCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydratation depuis localStorage
  useEffect(() => {
    setItems(loadFromStorage(storeSlug));
    setHydrated(true);
  }, [storeSlug]);

  // Persistence
  useEffect(() => {
    if (hydrated) {
      saveToStorage(storeSlug, items);
    }
  }, [items, hydrated, storeSlug]);

  // ── Actions ──

  const addItem = useCallback((newItem: Omit<ShopCartItem, "cartItemId">) => {
    setItems((prev) => {
      const cartItemId = generateCartItemId(newItem.productId, newItem.variantId);
      const existingIndex = prev.findIndex((i) => i.cartItemId === cartItemId);

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = Math.min(
          existing.quantity + newItem.quantity,
          newItem.maxQuantity
        );
        updated[existingIndex] = { ...existing, quantity: newQty };
        return updated;
      }

      return [...prev, { ...newItem, cartItemId }];
    });
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  }, []);

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(cartItemId);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
            : item
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }, [items]);

  // ── Derived state ──

  const state = useMemo((): ShopCartState => ({
    items,
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    totalAmount: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  }), [items]);

  const value = useMemo(
    () => ({
      ...state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemCount,
    }),
    [state, addItem, removeItem, updateQuantity, clearCart, getItemCount]
  );

  return (
    <ShopCartContext.Provider value={value}>
      {children}
    </ShopCartContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────

export function useShopCart(): ShopCartContextValue {
  const context = useContext(ShopCartContext);
  if (!context) {
    throw new Error("useShopCart must be used within a ShopCartProvider");
  }
  return context;
}
```

### 3.3 Index — `src/components/vendor-shop/providers/index.ts`

```typescript
// filepath: src/components/vendor-shop/providers/index.ts

export { MetaPixelProvider, useMetaPixel } from "./MetaPixelProvider";
export { ShopCartProvider, useShopCart, type ShopCartItem } from "./ShopCartProvider";
```

---

## 4. Layout Vendor Shop

### 4.1 Layout Server — `src/app/shop/[storeSlug]/layout.tsx`

```typescript
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

  return {
    title: `Boutique | Pixel-Mart`,
    description: `Découvrez les produits de cette boutique sur Pixel-Mart`,
  };
}

export default async function ShopLayout({ children, params }: LayoutProps) {
  const { storeSlug } = await params;

  // Précharger la config du store
  const preloadedConfig = await preloadQuery(api.meta.queries.getPublicConfig, {
    storeSlug,
  });

  return (
    <ShopLayoutClient storeSlug={storeSlug} preloadedConfig={preloadedConfig}>
      {children}
    </ShopLayoutClient>
  );
}
```

### 4.2 Layout Client — `src/app/shop/[storeSlug]/ShopLayoutClient.tsx`

```typescript
// filepath: src/app/shop/[storeSlug]/ShopLayoutClient.tsx

"use client";

import { usePreloadedQuery, type Preloaded } from "convex/react";
import { notFound } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
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

  // Store non trouvé ou vendor shop désactivé
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
```

---

## 5. Organismes

### 5.1 ShopHeader — `src/components/vendor-shop/organisms/ShopHeader.tsx`

```typescript
// filepath: src/components/vendor-shop/organisms/ShopHeader.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, ShoppingCart } from "lucide-react";
import { useShopCart } from "../providers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface ShopHeaderProps {
  storeName: string;
  storeSlug: string;
  logoUrl: string | null;
}

const NAV_ITEMS = [
  { label: "Accueil", href: "" },
  { label: "Produits", href: "/products" },
  { label: "À propos", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function ShopHeader({ storeName, storeSlug, logoUrl }: ShopHeaderProps) {
  const { totalItems } = useShopCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const basePath = `/shop/${storeSlug}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo + Store name */}
          <Link href={basePath} className="flex items-center gap-3">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={storeName}
                width={40}
                height={40}
                className="size-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="size-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: "var(--shop-primary)" }}
              >
                {storeName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-lg hidden sm:block">
              {storeName}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={`${basePath}${item.href}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href={`${basePath}/cart`}>
                <ShoppingCart className="size-5" />
                {totalItems > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: "var(--shop-primary)" }}
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </Badge>
                )}
                <span className="sr-only">Panier</span>
              </Link>
            </Button>

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="size-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <div className="flex flex-col gap-6 mt-6">
                  {/* Store name in mobile */}
                  <div className="flex items-center gap-3 pb-4 border-b">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt={storeName}
                        width={32}
                        height={32}
                        className="size-8 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="size-8 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: "var(--shop-primary)" }}
                      >
                        {storeName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold">{storeName}</span>
                  </div>

                  {/* Mobile nav items */}
                  <nav className="flex flex-col gap-4">
                    {NAV_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={`${basePath}${item.href}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm font-medium py-2 hover:text-primary transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
```

### 5.2 ShopFooter — `src/components/vendor-shop/organisms/ShopFooter.tsx`

```typescript
// filepath: src/components/vendor-shop/organisms/ShopFooter.tsx

import Link from "next/link";

interface ShopFooterProps {
  storeName: string;
  storeSlug: string;
}

export function ShopFooter({ storeName, storeSlug }: ShopFooterProps) {
  const basePath = `/shop/${storeSlug}`;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-semibold mb-3">{storeName}</h3>
            <p className="text-sm text-muted-foreground">
              Votre boutique en ligne de confiance.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Navigation</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={basePath} className="hover:text-foreground transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/products`}
                  className="hover:text-foreground transition-colors"
                >
                  Produits
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`${basePath}/contact`}
                  className="hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  CGV
                </Link>
              </li>
            </ul>
          </div>

          {/* Powered by */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Plateforme</h4>
            <p className="text-sm text-muted-foreground">
              Propulsé par{" "}
              <Link href="/" className="text-primary hover:underline">
                Pixel-Mart
              </Link>
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          © {currentYear} {storeName}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
```

---

## 6. Pages Vendor Shop

> **Note** : Les pages complètes sont disponibles dans le document original. Voici le résumé des adaptations :

| Page | Fichier | Adaptations |
|------|---------|-------------|
| Homepage | `src/app/shop/[storeSlug]/page.tsx` | Banner store, 8 produits featured |
| Products | `src/app/shop/[storeSlug]/products/page.tsx` | Filtré par storeId |
| Product Detail | `src/app/shop/[storeSlug]/products/[slug]/page.tsx` | + ViewContent + AddToCart tracking |
| Cart | `src/app/shop/[storeSlug]/cart/page.tsx` | useShopCart, liens internes |
| Checkout | `src/app/shop/[storeSlug]/checkout/page.tsx` | + InitiateCheckout tracking, single store |
| Confirmation | `src/app/shop/[storeSlug]/checkout/confirmation/page.tsx` | Routes adaptées |
| Payment Callback | `src/app/shop/[storeSlug]/checkout/payment-callback/page.tsx` | Routes adaptées |

---

## 7. Page Settings Vendor

Voir le code complet dans le document précédent.

**Fichier** : `src/app/(vendor)/vendor/store/meta/page.tsx`

**Fonctionnalités** :
- Toggle `vendor_shop_enabled` avec URL preview
- Pixel ID (validation 15-16 chiffres)
- Access Token (type password avec toggle visibility)
- Test Event Code
- Liste des 5 événements trackés

---

## 8. Intégration Webhook

### Modifier `convex/payments/webhooks.ts`

Après la confirmation du paiement, ajouter :

```typescript
// Track Purchase via Meta CAPI
await ctx.scheduler.runAfter(0, internal.meta.mutations.trackPurchase, {
  orderId: order._id,
});
```

---

## 9. Routes & Constants

### Ajouter à `src/constants/routes.ts`

```typescript
export const SHOP_ROUTES = {
  HOME: (storeSlug: string) => `/shop/${storeSlug}`,
  PRODUCTS: (storeSlug: string) => `/shop/${storeSlug}/products`,
  PRODUCT: (storeSlug: string, productSlug: string) =>
    `/shop/${storeSlug}/products/${productSlug}`,
  CART: (storeSlug: string) => `/shop/${storeSlug}/cart`,
  CHECKOUT: (storeSlug: string) => `/shop/${storeSlug}/checkout`,
  CONFIRMATION: (storeSlug: string) => `/shop/${storeSlug}/checkout/confirmation`,
} as const;
```

---

## 10. Commits

1. `schema(stores): add meta pixel and vendor shop fields`
2. `feat(meta): add Meta Pixel backend (queries, mutations, helpers)`
3. `feat(vendor-shop): add MetaPixelProvider and ShopCartProvider`
4. `feat(vendor-shop): add layout, header and footer`
5. `feat(vendor-shop): add storefront pages with Meta tracking`
6. `feat(vendor): add Meta Pixel settings page and webhook integration`

---

## Tableau des événements Meta

| Événement | Déclencheur | Type | Données |
|-----------|-------------|------|---------|
| PageView | Chaque navigation | Client (fbq) | — |
| ViewContent | Page produit (mount) | Client (fbq) | content_ids, value, currency |
| AddToCart | Clic "Ajouter au panier" | Client (fbq) | content_ids, value, num_items |
| InitiateCheckout | Page checkout (mount) | Client (fbq) | content_ids, value, num_items |
| **Purchase** | **Webhook Moneroo** | **Serveur (CAPI)** | content_ids, value, order_id, user_data hashé |

---

## Notes importantes

1. **Cart isolé** : Clé localStorage unique par store (`pixelmart-shop-cart-{storeSlug}`)
2. **Déduplication** : event_id partagé entre client et serveur
3. **Privacy** : Données PII hashées SHA-256 avant envoi CAPI
4. **Fallback gracieux** : Si pas de Pixel configuré, les providers fonctionnent sans erreur
