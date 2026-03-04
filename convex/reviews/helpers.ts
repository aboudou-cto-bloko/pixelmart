// filepath: convex/reviews/helpers.ts

import { type MutationCtx, type QueryCtx } from "../_generated/server";
import { type Id } from "../_generated/dataModel";
import { ConvexError } from "convex/values";

/**
 * Vérifie qu'un client peut poster un avis :
 * - Commande livrée
 * - Pas d'avis déjà posté pour ce produit + commande
 */
export async function validateReviewEligibility(
  ctx: QueryCtx,
  customerId: Id<"users">,
  productId: Id<"products">,
  orderId: Id<"orders">,
) {
  // Vérifier que la commande existe et est livrée
  const order = await ctx.db.get(orderId);
  if (!order) {
    throw new ConvexError("Commande introuvable");
  }
  if (order.customer_id !== customerId) {
    throw new ConvexError("Cette commande ne vous appartient pas");
  }
  if (order.status !== "delivered") {
    throw new ConvexError(
      "Vous pouvez laisser un avis uniquement sur les commandes livrées",
    );
  }

  // Vérifier que le produit fait partie de cette commande
  const hasProduct = order.items.some(
    (item: { product_id: string }) => item.product_id === productId,
  );
  if (!hasProduct) {
    throw new ConvexError("Ce produit ne fait pas partie de cette commande");
  }

  // Vérifier qu'il n'a pas déjà posté un avis pour ce produit + commande
  const existing = await ctx.db
    .query("reviews")
    .withIndex("by_customer", (q) => q.eq("customer_id", customerId))
    .filter((q) =>
      q.and(
        q.eq(q.field("product_id"), productId),
        q.eq(q.field("order_id"), orderId),
      ),
    )
    .first();

  if (existing) {
    throw new ConvexError("Vous avez déjà laissé un avis pour ce produit");
  }

  return { order };
}

/**
 * Recalcule la note moyenne d'un produit et du store.
 * Appelé après chaque création/suppression d'avis publié.
 */
export async function recalculateRatings(
  ctx: MutationCtx,
  productId: Id<"products">,
  storeId: Id<"stores">,
) {
  // Recalcul produit
  const productReviews = await ctx.db
    .query("reviews")
    .withIndex("by_product", (q) => q.eq("product_id", productId))
    .filter((q) =>
      q.and(
        q.eq(q.field("is_published"), true),
        q.eq(q.field("flagged"), false),
      ),
    )
    .collect();

  const productAvg =
    productReviews.length > 0
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) /
        productReviews.length
      : 0;

  const product = await ctx.db.get(productId);
  if (product) {
    await ctx.db.patch(productId, {
      avg_rating: Math.round(productAvg * 10) / 10,
      review_count: productReviews.length,
    });
  }

  // Recalcul store
  const storeReviews = await ctx.db
    .query("reviews")
    .withIndex("by_store", (q) => q.eq("store_id", storeId))
    .filter((q) =>
      q.and(
        q.eq(q.field("is_published"), true),
        q.eq(q.field("flagged"), false),
      ),
    )
    .collect();

  const storeAvg =
    storeReviews.length > 0
      ? storeReviews.reduce((sum, r) => sum + r.rating, 0) / storeReviews.length
      : 0;

  await ctx.db.patch(storeId, {
    avg_rating: Math.round(storeAvg * 10) / 10,
    updated_at: Date.now(),
  });
}
