// filepath: convex/users/mutations.ts

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser } from "./helpers";

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    locale: v.optional(v.union(v.literal("fr"), v.literal("en"))),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const updates: Record<string, unknown> = { updated_at: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.locale !== undefined) updates.locale = args.locale;

    await ctx.db.patch(user._id, updates);
    return { success: true };
  },
});

export const becomeVendor = mutation({
  args: {
    store_name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    if (user.role !== "customer") {
      throw new Error("Seul un customer peut devenir vendor");
    }

    const baseSlug = args.store_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let slug = baseSlug;
    let counter = 0;
    while (true) {
      const existing = await ctx.db
        .query("stores")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      if (!existing) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const storeId = await ctx.db.insert("stores", {
      owner_id: user._id,
      name: args.store_name,
      slug,
      description: "",
      logo_url: undefined,
      banner_url: undefined,
      status: "active",
      subscription_tier: "free",
      commission_rate: 500,
      balance: 0,
      pending_balance: 0,
      total_revenue: 0,
      total_orders: 0,
      level: "bronze",
      default_currency: "XOF",
      contact_email: user.email,
      contact_phone: user.phone,
      country: "BJ",
      address: undefined,
      city: undefined,
      social_links: undefined,
      seo_title: undefined,
      seo_description: undefined,
      updated_at: Date.now(),
    });

    await ctx.db.patch(user._id, {
      role: "vendor",
      updated_at: Date.now(),
    });

    return { storeId, slug };
  },
});
