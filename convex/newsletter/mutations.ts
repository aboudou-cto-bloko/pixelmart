// filepath: convex/newsletter/mutations.ts

import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const subscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const existing = await ctx.db
      .query("newsletter_subscribers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) return { alreadySubscribed: true };
    await ctx.db.insert("newsletter_subscribers", {
      email,
      subscribed_at: Date.now(),
      source: "storefront",
    });
    return { alreadySubscribed: false };
  },
});
