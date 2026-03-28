// filepath: convex/seed/queries.ts

import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

export const getStoreBySlug = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});
