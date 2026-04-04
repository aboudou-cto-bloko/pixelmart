// filepath: convex/wishlists/queries.ts

import { query } from "../_generated/server";
import { getAppUser } from "../users/helpers";

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAppUser(ctx);
    if (!user) return [];

    const entries = await ctx.db
      .query("wishlists")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    return entries.map((e) => e.product_id as string);
  },
});
