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
    country: v.optional(v.string()),
    currency: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    if (user.role !== "customer") {
      throw new Error("Seul un customer peut devenir vendor");
    }

    // ---- Slug generation (collision-safe) ----
    const baseSlug = args.store_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
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

    // ---- Insert store ----
    const storeId = await ctx.db.insert("stores", {
      owner_id: user._id,
      name: args.store_name,
      slug,
      description: args.description ?? "",
      logo_url: undefined,
      banner_url: undefined,
      theme_id: "default",
      primary_color: undefined,
      status: "active",
      subscription_tier: "free",
      subscription_ends_at: undefined,
      commission_rate: 500,
      balance: 0,
      pending_balance: 0,
      currency: args.currency ?? "XOF",
      level: "bronze",
      total_orders: 0,
      avg_rating: 0,
      is_verified: false,
      country: args.country ?? "BJ",
      updated_at: Date.now(),
    });

    await ctx.db.patch(user._id, {
      role: "vendor",
      updated_at: Date.now(),
    });

    return { storeId, slug };
  },
});
