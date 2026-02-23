// filepath: convex/coupons/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { getVendorStore } from "../users/helpers";
import {
  validateCouponRules,
  calculateDiscount,
  getCouponLabel,
} from "./helpers";

/**
 * Valide un code promo côté client (preview avant soumission).
 * Index by_code est composé : ["store_id", "code"]
 */
export const validate = query({
  args: {
    code: v.string(),
    storeId: v.id("stores"),
    subtotal: v.number(),
  },
  handler: async (ctx, args) => {
    const normalizedCode = args.code.toUpperCase().trim();

    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) =>
        q.eq("store_id", args.storeId).eq("code", normalizedCode),
      )
      .unique();

    if (!coupon) {
      return { valid: false as const, error: "Code promo invalide" };
    }

    const validationError = validateCouponRules(coupon, args.subtotal);
    if (validationError) {
      return { valid: false as const, error: validationError };
    }

    const discount = calculateDiscount(coupon, args.subtotal);
    const label = getCouponLabel(coupon);

    return {
      valid: true as const,
      code: coupon.code,
      type: coupon.type,
      label,
      discount,
    };
  },
});

/**
 * Liste les coupons de la boutique vendor.
 */
export const listByStore = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    return ctx.db
      .query("coupons")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .order("desc")
      .collect();
  },
});
