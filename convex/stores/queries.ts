// filepath: convex/stores/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { resolveImageUrl } from "../products/helpers";
import { getVendorStore } from "../users/helpers";

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
      country: store.country,
      currency: store.currency,
      level: store.level,
      total_orders: store.total_orders,
      avg_rating: store.avg_rating,
      is_verified: store.is_verified,
      subscription_tier: store.subscription_tier,
      product_count: productCount,
      _creationTime: store._creationTime,
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
