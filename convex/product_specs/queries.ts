// filepath: convex/product_specs/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";

export const listByProduct = query({
  args: {
    product_id: v.id("products"),
  },
  handler: async (ctx, args) => {
    const specs = await ctx.db
      .query("product_specs")
      .withIndex("by_product", (q) => q.eq("product_id", args.product_id))
      .collect();

    return specs.sort((a, b) => a.display_order - b.display_order);
  },
});
