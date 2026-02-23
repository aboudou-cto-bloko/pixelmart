// filepath: convex/coupons/helpers.ts

import type { Doc } from "../_generated/dataModel";

/**
 * Vérifie la validité d'un coupon (sans throw — retourne un message d'erreur ou null).
 */
export function validateCouponRules(
  coupon: Doc<"coupons">,
  subtotal: number,
): string | null {
  if (!coupon.is_active) {
    return "Ce code promo n'est plus actif";
  }

  if (coupon.expires_at && coupon.expires_at < Date.now()) {
    return "Ce code promo a expiré";
  }

  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return "Ce code promo a atteint sa limite d'utilisation";
  }

  if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
    return `Montant minimum requis : ${coupon.min_order_amount / 100} FCFA`;
  }

  return null;
}

/**
 * Calcule le montant de la réduction.
 */
export function calculateDiscount(
  coupon: Doc<"coupons">,
  subtotal: number,
): number {
  switch (coupon.type) {
    case "percentage":
      return Math.round((subtotal * coupon.value) / 100);
    case "fixed_amount":
      return Math.min(coupon.value, subtotal);
    case "free_shipping":
      return 0;
    default:
      return 0;
  }
}

/**
 * Retourne un label lisible pour le type de coupon.
 */
export function getCouponLabel(coupon: Doc<"coupons">): string {
  switch (coupon.type) {
    case "percentage":
      return `-${coupon.value}%`;
    case "fixed_amount":
      return `-${coupon.value / 100} FCFA`;
    case "free_shipping":
      return "Livraison gratuite";
    default:
      return "";
  }
}
