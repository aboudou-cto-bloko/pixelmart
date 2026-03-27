// filepath: convex/reviews/mutations.ts

import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import { validateReviewEligibility, recalculateRatings } from "./helpers";
import { requireAppUser } from "../users/helpers";
import { rateLimiter } from "../lib/ratelimits";

/**
 * Poster un avis — uniquement pour les commandes livrées
 * Règle : is_published = false par défaut, auto-publié après 24h si non flagged
 */
export const create = mutation({
  args: {
    product_id: v.id("products"),
    order_id: v.id("orders"),
    rating: v.number(),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    if (user.role !== "customer") {
      throw new ConvexError("Seuls les clients peuvent poster des avis");
    }

    const { ok, retryAfter } = await rateLimiter.limit(ctx, "createReview", {
      key: user._id,
    });
    if (!ok) {
      const secs = retryAfter ? Math.ceil(retryAfter / 1000) : 3600;
      throw new ConvexError(
        `Trop d'avis. Réessayez dans ${secs} seconde${secs > 1 ? "s" : ""}.`,
      );
    }

    // Validation
    if (args.rating < 1 || args.rating > 5 || !Number.isInteger(args.rating)) {
      throw new ConvexError("La note doit être un entier entre 1 et 5");
    }

    if (args.title && args.title.length > 100) {
      throw new ConvexError("Le titre ne peut pas dépasser 100 caractères");
    }

    if (args.body && args.body.length > 2000) {
      throw new ConvexError("L'avis ne peut pas dépasser 2000 caractères");
    }

    const { order } = await validateReviewEligibility(
      ctx,
      user._id,
      args.product_id,
      args.order_id,
    );

    // Récupérer le produit
    const product = await ctx.db.get(args.product_id);
    if (!product) throw new ConvexError("Produit introuvable");

    // Récupérer le store (pour obtenir vendorUserId)
    const store = await ctx.db.get(product.store_id);
    if (!store) throw new ConvexError("Boutique introuvable");

    const vendorUserId = store.owner_id; // ou store.user_id selon ta schema

    // Récupérer l’email du vendeur
    const vendorUser = await ctx.db.get(vendorUserId);
    if (!vendorUser || !vendorUser.email)
      throw new ConvexError("Email du vendeur introuvable");

    const reviewId = await ctx.db.insert("reviews", {
      product_id: args.product_id,
      order_id: args.order_id,
      customer_id: user._id,
      store_id: product.store_id,
      rating: args.rating,
      title: args.title,
      body: args.body,
      images: args.images ?? [],
      is_verified: true,
      is_published: false,
      flagged: false,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.notifications.send.notifyNewReview,
      {
        vendorUserId: vendorUserId,
        vendorEmail: vendorUser.email,
        vendorName: store.name,

        customerName: user.name ?? "Client",
        productTitle: product.title,
        rating: args.rating,
        reviewTitle: args.title ?? "",
      },
    );

    return reviewId;
  },
});
/**
 * Répondre à un avis — uniquement pour le vendor du store
 */
export const reply = mutation({
  args: {
    review_id: v.id("reviews"),
    vendor_reply: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    if (args.vendor_reply.length > 1000) {
      throw new ConvexError("La réponse ne peut pas dépasser 1000 caractères");
    }

    const review = await ctx.db.get(args.review_id);
    if (!review) throw new ConvexError("Avis introuvable");

    // Vérifier que c'est le vendor du store
    const store = await ctx.db.get(review.store_id);
    if (!store || store.owner_id !== user._id) {
      throw new ConvexError(
        "Vous ne pouvez répondre qu'aux avis de votre boutique",
      );
    }

    await ctx.db.patch(args.review_id, {
      vendor_reply: args.vendor_reply,
      replied_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Signaler un avis — n'importe quel utilisateur authentifié
 */
export const flag = mutation({
  args: {
    review_id: v.id("reviews"),
  },
  handler: async (ctx, args) => {
    await requireAppUser(ctx);

    const review = await ctx.db.get(args.review_id);
    if (!review) throw new ConvexError("Avis introuvable");

    await ctx.db.patch(args.review_id, {
      flagged: true,
      is_published: false, // Retirer de la vue publique
    });

    // Recalculer les ratings
    await recalculateRatings(ctx, review.product_id, review.store_id);

    return { success: true };
  },
});

/**
 * Supprimer un avis — admin uniquement
 */
export const remove = mutation({
  args: {
    review_id: v.id("reviews"),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    if (user.role !== "admin") {
      throw new ConvexError("Action réservée aux administrateurs");
    }

    const review = await ctx.db.get(args.review_id);
    if (!review) throw new ConvexError("Avis introuvable");

    await ctx.db.delete(args.review_id);

    // Recalculer les ratings
    await recalculateRatings(ctx, review.product_id, review.store_id);

    return { success: true };
  },
});

/**
 * Publier/masquer manuellement un avis — admin ou vendor du store
 */
export const setPublished = mutation({
  args: {
    review_id: v.id("reviews"),
    is_published: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const review = await ctx.db.get(args.review_id);
    if (!review) throw new ConvexError("Avis introuvable");

    // Admin ou owner du store
    if (user.role !== "admin") {
      const store = await ctx.db.get(review.store_id);
      if (!store || store.owner_id !== user._id) {
        throw new ConvexError("Action non autorisée");
      }
    }

    await ctx.db.patch(args.review_id, {
      is_published: args.is_published,
    });

    // Recalculer les ratings
    await recalculateRatings(ctx, review.product_id, review.store_id);

    return { success: true };
  },
});
