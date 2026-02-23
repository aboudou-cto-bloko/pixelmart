// filepath: convex/coupons/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  validateCouponRules,
  calculateDiscount,
  getCouponLabel,
} from "./helpers";

/**
 * Valide un code promo côté client (preview avant soumission).
 * Retourne le coupon avec le montant de la réduction estimé.
 */
export const validate = query({
  args: {
    code: v.string(),
    storeId: v.id("stores"),
    subtotal: v.number(), // centimes
  },
  handler: async (ctx, args) => {
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!coupon) {
      return { valid: false, error: "Code promo invalide" } as const;
    }

    if (coupon.store_id !== args.storeId) {
      return {
        valid: false,
        error: "Ce code n'est pas valable pour cette boutique",
      } as const;
    }

    const validationError = validateCouponRules(coupon, args.subtotal);
    if (validationError) {
      return { valid: false, error: validationError } as const;
    }

    const discount = calculateDiscount(coupon, args.subtotal);
    const label = getCouponLabel(coupon);

    return {
      valid: true,
      code: coupon.code,
      type: coupon.type,
      label,
      discount,
    } as const;
  },
});

/**
 * Liste les coupons d'une boutique (vendor).
 */
export const listByStore = query({
  args: {},
  handler: async (ctx) => {
    // Import dynamique pour éviter la dépendance circulaire
    const { getVendorStore } = await import("../users/helpers");
    const { store } = await getVendorStore(ctx);

    return await ctx.db
      .query("coupons")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .order("desc")
      .collect();
  },
});
