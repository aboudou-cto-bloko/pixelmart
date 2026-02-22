// filepath: convex/variants/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Liste les variantes d'un produit.
 * Résout les URLs d'images de variantes.
 */
export const listByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const variants = await ctx.db
      .query("product_variants")
      .withIndex("by_product", (q) => q.eq("product_id", args.productId))
      .collect();

    return Promise.all(
      variants.map(async (variant) => {
        let resolvedImageUrl: string | null = null;
        if (variant.image_url) {
          try {
            resolvedImageUrl = await ctx.storage.getUrl(
              variant.image_url as any,
            );
          } catch {
            resolvedImageUrl = null;
          }
        }
        return { ...variant, resolvedImageUrl };
      }),
    );
  },
});
