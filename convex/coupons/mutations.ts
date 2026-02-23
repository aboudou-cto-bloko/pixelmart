// filepath: convex/coupons/mutations.ts

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getVendorStore } from "../users/helpers";

/**
 * Créer un code promo.
 */
export const create = mutation({
  args: {
    code: v.string(),
    type: v.union(
      v.literal("percentage"),
      v.literal("fixed_amount"),
      v.literal("free_shipping"),
    ),
    value: v.number(),
    applicableTo: v.optional(
      v.union(
        v.literal("all"),
        v.literal("specific_products"),
        v.literal("specific_categories"),
      ),
    ),
    productIds: v.optional(v.array(v.id("products"))),
    categoryIds: v.optional(v.array(v.id("categories"))),
    minOrderAmount: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    maxUsesPerUser: v.optional(v.number()),
    startsAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const code = args.code.toUpperCase().trim();

    // Unicité du code par boutique (index composé)
    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("store_id", store._id).eq("code", code))
      .unique();

    if (existing) {
      throw new Error(`Le code promo « ${code} » existe déjà`);
    }

    // Validations
    if (args.type === "percentage" && (args.value < 1 || args.value > 100)) {
      throw new Error("Le pourcentage doit être entre 1 et 100");
    }
    if (args.type === "fixed_amount" && args.value <= 0) {
      throw new Error("Le montant doit être positif (en centimes)");
    }

    const applicableTo = args.applicableTo ?? "all";

    return ctx.db.insert("coupons", {
      store_id: store._id,
      code,
      type: args.type,
      value: args.value,
      applicable_to: applicableTo,
      product_ids:
        applicableTo === "specific_products" ? args.productIds : undefined,
      category_ids:
        applicableTo === "specific_categories" ? args.categoryIds : undefined,
      min_order_amount: args.minOrderAmount,
      max_uses: args.maxUses,
      max_uses_per_user: args.maxUsesPerUser ?? 1,
      used_count: 0,
      is_active: true,
      starts_at: args.startsAt,
      expires_at: args.expiresAt,
    });
  },
});

/**
 * Désactiver un coupon.
 */
export const deactivate = mutation({
  args: { couponId: v.id("coupons") },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) throw new Error("Coupon introuvable");
    if (coupon.store_id !== store._id) {
      throw new Error("Ce coupon ne vous appartient pas");
    }

    await ctx.db.patch(args.couponId, { is_active: false });
    return { success: true };
  },
});
