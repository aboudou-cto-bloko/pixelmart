import { query } from "../_generated/server";
import { v } from "convex/values";
import { resolveImageUrl } from "../products/helpers";

export const listByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const variants = await ctx.db
      .query("product_variants")
      .withIndex("by_product", (q) => q.eq("product_id", args.productId))
      .collect();

    return Promise.all(
      variants.map(async (variant) => {
        const resolvedImageUrl = await resolveImageUrl(ctx, variant.image_url);
        return { ...variant, resolvedImageUrl };
      }),
    );
  },
});
