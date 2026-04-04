// filepath: convex/wishlists/mutations.ts

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser } from "../users/helpers";

export const toggle = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const user = await requireAppUser(ctx);

    const existing = await ctx.db
      .query("wishlists")
      .withIndex("by_user_product", (q) =>
        q.eq("user_id", user._id).eq("product_id", productId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { wishlisted: false };
    }

    await ctx.db.insert("wishlists", {
      user_id: user._id,
      product_id: productId,
      added_at: Date.now(),
    });
    return { wishlisted: true };
  },
});
