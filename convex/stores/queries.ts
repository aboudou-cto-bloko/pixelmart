// filepath: convex/stores/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { resolveImageUrl } from "../products/helpers";
import { getVendorStore } from "../users/helpers";

// Default Pixel-Mart warehouse coordinates (Cotonou)
const DEFAULT_WAREHOUSE_LAT = 6.4105682373046875;
const DEFAULT_WAREHOUSE_LON = 2.328976631164551;

/**
 * Retourne les coordonnées GPS de l'entrepôt Pixel-Mart.
 * Lues depuis platform_config (warehouse_lat / warehouse_lon).
 * Utilise les coordonnées hardcodées de Cotonou par défaut.
 * PUBLIC — utilisé par les pages checkout.
 */
export const getWarehouseCoordinates = query({
  args: {},
  handler: async (ctx) => {
    const latRow = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", "warehouse_lat"))
      .first();
    const lonRow = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", "warehouse_lon"))
      .first();
    return {
      lat: latRow?.value ?? DEFAULT_WAREHOUSE_LAT,
      lon: lonRow?.value ?? DEFAULT_WAREHOUSE_LON,
    };
  },
});

/**
 * Vérifie si la boutique a des commandes actives (non terminées, non annulées).
 * Utilisé pour bloquer la modification des paramètres de livraison.
 */
export const hasPendingOrders = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    const ACTIVE_STATUSES = [
      "pending",
      "paid",
      "processing",
      "ready_for_delivery",
      "shipped",
    ] as const;

    for (const status of ACTIVE_STATUSES) {
      const order = await ctx.db
        .query("orders")
        .withIndex("by_store", (q) => q.eq("store_id", store._id))
        .filter((q) => q.eq(q.field("status"), status))
        .first();
      if (order) return true;
    }

    return false;
  },
});

/**
 * Détail boutique par slug — vitrine publique.
 * PUBLIC — pas d'auth requise.
 * Inclut les produits actifs de la boutique.
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!store || store.status !== "active") {
      return null;
    }

    // Resolve logo
    const logoUrl = store.logo_url
      ? await resolveImageUrl(ctx, store.logo_url)
      : null;

    // Resolve banner
    const bannerUrl = store.banner_url
      ? await resolveImageUrl(ctx, store.banner_url)
      : null;

    // Count active products
    const activeProducts = await ctx.db
      .query("products")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const productCount = activeProducts.filter(
      (p) => p.status === "active",
    ).length;

    return {
      _id: store._id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      theme_id: store.theme_id,
      primary_color: store.primary_color,
      country: store.country,
      currency: store.currency,
      level: store.level,
      total_orders: store.total_orders,
      avg_rating: store.avg_rating,
      is_verified: store.is_verified,
      subscription_tier: store.subscription_tier,
      product_count: productCount,
      _creationTime: store._creationTime,
      // Delivery & pickup fields (needed for two-segment distance calculation)
      use_pixelmart_service: store.use_pixelmart_service,
      has_storage_plan: store.has_storage_plan,
      custom_pickup_lat: store.custom_pickup_lat,
      custom_pickup_lon: store.custom_pickup_lon,
    };
  },
});

/**
 * Découverte boutiques — liste les boutiques actives.
 * PUBLIC — pas d'auth requise.
 * Triées par rating puis nombre de commandes.
 */
export const listActive = query({
  args: {
    limit: v.optional(v.number()),
    country: v.optional(v.string()),
    verifiedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);

    const allStores = await ctx.db
      .query("stores")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(200);

    let stores = allStores;

    // Filter by country
    if (args.country) {
      stores = stores.filter((s) => s.country === args.country);
    }

    // Filter verified only
    if (args.verifiedOnly) {
      stores = stores.filter((s) => s.is_verified);
    }

    // Sort: verified first, then by rating, then by orders
    stores.sort((a, b) => {
      if (a.is_verified !== b.is_verified) {
        return a.is_verified ? -1 : 1;
      }
      if (a.avg_rating !== b.avg_rating) {
        return b.avg_rating - a.avg_rating;
      }
      return b.total_orders - a.total_orders;
    });

    stores = stores.slice(0, limit);

    // Resolve logos
    const storesWithLogos = await Promise.all(
      stores.map(async (store) => {
        const logoUrl = store.logo_url
          ? await resolveImageUrl(ctx, store.logo_url)
          : null;

        return {
          _id: store._id,
          name: store.name,
          slug: store.slug,
          description: store.description,
          logo_url: logoUrl,
          country: store.country,
          level: store.level,
          total_orders: store.total_orders,
          avg_rating: store.avg_rating,
          is_verified: store.is_verified,
          _creationTime: store._creationTime,
        };
      }),
    );

    return storesWithLogos;
  },
});

/**
 * Récupère la boutique du vendor connecté.
 */
export const getMyStore = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);
    return store;
  },
});

export const getMarketplaceStats = query({
  args: {},
  handler: async (ctx) => {
    const allStores = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const allProducts = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Calcul total commandes (somme des total_orders de chaque store)
    const totalOrders = allStores.reduce((sum, s) => sum + s.total_orders, 0);

    // Pays uniques
    const uniqueCountries = new Set(allStores.map((s) => s.country));

    return {
      totalStores: allStores.length,
      totalProducts: allProducts.length,
      totalOrders,
      totalCountries: uniqueCountries.size,
    };
  },
});

export const getFeaturedStores = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;

    const stores = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Trier par avg_rating desc, puis total_orders desc
    const sorted = stores
      .sort((a, b) => {
        if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
        return b.total_orders - a.total_orders;
      })
      .slice(0, limit);

    const storesWithLogos = await Promise.all(
      sorted.map(async (store) => {
        const logoUrl = store.logo_url
          ? await resolveImageUrl(ctx, store.logo_url)
          : null;

        return {
          ...store,
          logo_url: logoUrl,
        };
      }),
    );

    return storesWithLogos;
  },
});

/**
 * Récupère la configuration de livraison pour une liste de boutiques.
 * Utilisé par le checkout multi-boutique.
 */
export const getDeliveryConfigBatch = query({
  args: {
    storeIds: v.array(v.id("stores")),
  },
  handler: async (ctx, args) => {
    const stores = await Promise.all(
      args.storeIds.map((id) => ctx.db.get(id)),
    );
    return stores.reduce(
      (acc, store) => {
        if (store) {
          acc[store._id] = {
            use_pixelmart_service: store.use_pixelmart_service ?? true,
            has_storage_plan: store.has_storage_plan ?? false,
            custom_pickup_lat: store.custom_pickup_lat,
            custom_pickup_lon: store.custom_pickup_lon,
          };
        }
        return acc;
      },
      {} as Record<
        string,
        {
          use_pixelmart_service: boolean;
          has_storage_plan: boolean;
          custom_pickup_lat?: number;
          custom_pickup_lon?: number;
        }
      >,
    );
  },
});

/**
 * Liste toutes les boutiques appartenant au vendor connecté.
 */
export const listMyStores = query({
  args: {},
  handler: async (ctx) => {
    const { user, store: activeStore } = await getVendorStore(ctx);

    const stores = await ctx.db
      .query("stores")
      .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
      .collect();

    const storesWithLogos = await Promise.all(
      stores.map(async (s) => {
        const logoUrl = s.logo_url
          ? await resolveImageUrl(ctx, s.logo_url)
          : null;
        return {
          _id: s._id,
          name: s.name,
          slug: s.slug,
          logo_url: logoUrl,
          status: s.status,
          subscription_tier: s.subscription_tier,
          isActive: s._id === activeStore._id,
        };
      }),
    );

    return storesWithLogos;
  },
});
