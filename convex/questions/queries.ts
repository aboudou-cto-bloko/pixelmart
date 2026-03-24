// filepath: convex/questions/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAppUser } from "../users/helpers";

/**
 * Questions publiées pour un produit — public.
 * Retourne les questions avec le nom de l'auteur et la réponse vendeur.
 */
export const listByProduct = query({
  args: {
    product_id: v.id("products"),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("product_questions")
      .withIndex("by_product", (q) => q.eq("product_id", args.product_id))
      .filter((q) => q.eq(q.field("is_published"), true))
      .collect();

    const enriched = await Promise.all(
      questions.map(async (question) => {
        const author = await ctx.db.get(question.author_id);
        return {
          ...question,
          author_name: author?.name ?? "Utilisateur",
          author_avatar: author?.avatar_url,
        };
      }),
    );

    // Plus récentes en premier
    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Toutes les questions d'un store — vendor dashboard.
 * Inclut les questions non publiées.
 */
export const listByStore = query({
  args: {
    store_id: v.id("stores"),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("product_questions")
      .withIndex("by_store", (q) => q.eq("store_id", args.store_id))
      .collect();

    const enriched = await Promise.all(
      questions.map(async (question) => {
        const [author, product] = await Promise.all([
          ctx.db.get(question.author_id),
          ctx.db.get(question.product_id),
        ]);
        return {
          ...question,
          author_name: author?.name ?? "Utilisateur",
          author_avatar: author?.avatar_url,
          product_title: product?.title ?? "Produit supprimé",
          product_slug: product?.slug,
        };
      }),
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Questions posées par l'utilisateur connecté — espace client/vendor.
 */
export const listByCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAppUser(ctx);
    if (!user) return [];

    const questions = await ctx.db
      .query("product_questions")
      .withIndex("by_author", (q) => q.eq("author_id", user._id))
      .collect();

    const enriched = await Promise.all(
      questions.map(async (question) => {
        const product = await ctx.db.get(question.product_id);
        return {
          ...question,
          product_title: product?.title ?? "Produit supprimé",
          product_slug: product?.slug,
        };
      }),
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Toutes les questions d'un produit — vendor seulement.
 * Inclut les questions non publiées. Vérifie que le vendor possède le store.
 */
export const listByProductForVendor = query({
  args: {
    product_id: v.id("products"),
  },
  handler: async (ctx, args) => {
    const user = await getAppUser(ctx);
    if (!user || (user.role !== "vendor" && user.role !== "admin")) return [];

    const product = await ctx.db.get(args.product_id);
    if (!product) return [];

    // Verify ownership (admin can bypass)
    if (user.role === "vendor") {
      const store = await ctx.db
        .query("stores")
        .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
        .first();
      if (!store || store._id !== product.store_id) return [];
    }

    const questions = await ctx.db
      .query("product_questions")
      .withIndex("by_product", (q) => q.eq("product_id", args.product_id))
      .collect();

    const enriched = await Promise.all(
      questions.map(async (question) => {
        const author = await ctx.db.get(question.author_id);
        return {
          ...question,
          author_name: author?.name ?? "Utilisateur",
          author_avatar: author?.avatar_url,
        };
      }),
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});
