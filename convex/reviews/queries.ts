// filepath: convex/reviews/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Avis publiés pour un produit — public
 */
export const listByProduct = query({
  args: {
    product_id: v.id("products"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("product_id", args.product_id))
      .filter((q) =>
        q.and(
          q.eq(q.field("is_published"), true),
          q.eq(q.field("flagged"), false),
        ),
      )
      .collect();

    // Enrichir avec les noms des auteurs
    const enriched = await Promise.all(
      reviews.map(async (review) => {
        const customer = await ctx.db.get(review.customer_id);
        return {
          ...review,
          customer_name: customer?.name ?? "Utilisateur",
          customer_avatar: customer?.avatar_url,
        };
      }),
    );

    // Trier par date décroissante
    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Statistiques d'avis pour un produit — public
 */
export const getProductStats = query({
  args: {
    product_id: v.id("products"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("product_id", args.product_id))
      .filter((q) =>
        q.and(
          q.eq(q.field("is_published"), true),
          q.eq(q.field("flagged"), false),
        ),
      )
      .collect();

    const total = reviews.length;
    if (total === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const review of reviews) {
      sum += review.rating;
      distribution[review.rating as 1 | 2 | 3 | 4 | 5]++;
    }

    return {
      average: Math.round((sum / total) * 10) / 10,
      total,
      distribution,
    };
  },
});

/**
 * Tous les avis d'un store — vendor dashboard
 */
export const listByStore = query({
  args: {
    store_id: v.id("stores"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_store", (q) => q.eq("store_id", args.store_id))
      .collect();

    // Enrichir avec produit + client
    const enriched = await Promise.all(
      reviews.map(async (review) => {
        const [customer, product] = await Promise.all([
          ctx.db.get(review.customer_id),
          ctx.db.get(review.product_id),
        ]);
        return {
          ...review,
          customer_name: customer?.name ?? "Utilisateur",
          customer_avatar: customer?.avatar_url,
          product_title: product?.title ?? "Produit supprimé",
          product_slug: product?.slug,
        };
      }),
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Vérifier si un client peut laisser un avis
 */
export const canReview = query({
  args: {
    product_id: v.id("products"),
    order_id: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { eligible: false, reason: "not_authenticated" };

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return { eligible: false, reason: "no_user" };

    const order = await ctx.db.get(args.order_id);
    if (!order) return { eligible: false, reason: "order_not_found" };
    if (order.customer_id !== user._id)
      return { eligible: false, reason: "not_owner" };
    if (order.status !== "delivered")
      return { eligible: false, reason: "not_delivered" };

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_customer", (q) => q.eq("customer_id", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("product_id"), args.product_id),
          q.eq(q.field("order_id"), args.order_id),
        ),
      )
      .first();

    if (existing) return { eligible: false, reason: "already_reviewed" };

    return { eligible: true, reason: null };
  },
});
