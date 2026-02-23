// filepath: convex/orders/mutations.ts

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser } from "../users/helpers";
import { getVendorStore, requireAdmin } from "../users/helpers";
import {
  generateOrderNumber,
  validateAndBuildItems,
  decrementInventory,
  restoreInventory,
  calculateCommission,
  getCommissionRate,
  assertValidTransition,
  canCustomerCancel,
  canVendorCancel,
} from "./helpers";

// ─── Create Order ────────────────────────────────────────────

export const createOrder = mutation({
  args: {
    storeId: v.id("stores"),
    items: v.array(
      v.object({
        productId: v.id("products"),
        variantId: v.optional(v.id("product_variants")),
        quantity: v.number(),
      }),
    ),
    shippingAddress: v.object({
      full_name: v.string(),
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      state: v.optional(v.string()),
      postal_code: v.optional(v.string()),
      country: v.string(),
      phone: v.optional(v.string()),
    }),
    billingAddress: v.optional(
      v.object({
        full_name: v.string(),
        line1: v.string(),
        line2: v.optional(v.string()),
        city: v.string(),
        state: v.optional(v.string()),
        postal_code: v.optional(v.string()),
        country: v.string(),
        phone: v.optional(v.string()),
      }),
    ),
    couponCode: v.optional(v.string()),
    notes: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    // 1. Vérifier que la boutique existe et est active
    const store = await ctx.db.get(args.storeId);
    if (!store || store.status !== "active") {
      throw new Error("Boutique introuvable ou inactive");
    }

    // 2. Un vendor ne peut pas acheter dans sa propre boutique
    if (store.owner_id === user._id) {
      throw new Error("Vous ne pouvez pas acheter dans votre propre boutique");
    }

    // 3. Valider les items + vérifier le stock
    const validatedItems = await validateAndBuildItems(
      ctx,
      args.storeId,
      args.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    );

    // 4. Calculer les totaux
    const subtotal = validatedItems.reduce(
      (sum, item) => sum + item.total_price,
      0,
    );

    // 5. Appliquer le coupon si présent
    let discountAmount = 0;
    if (args.couponCode) {
      discountAmount = await applyCoupon(
        ctx,
        args.couponCode,
        store._id,
        user._id,
        subtotal,
        validatedItems,
      );
    }

    // 6. Frais de livraison (placeholder — sera calculé dynamiquement en Phase 1)
    const shippingAmount = 0;

    // 7. Total
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount);

    // 8. Commission
    const commissionRate = getCommissionRate(store.subscription_plan);
    const commissionAmount = calculateCommission(totalAmount, commissionRate);

    // 9. Générer le numéro de commande
    const orderNumber = await generateOrderNumber(ctx);

    // 10. Créer la commande
    const orderId = await ctx.db.insert("orders", {
      order_number: orderNumber,
      customer_id: user._id,
      store_id: store._id,
      items: validatedItems as any,
      subtotal,
      shipping_amount: shippingAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      currency: store.currency ?? "XOF",
      status: "pending",
      payment_status: "pending",
      payment_method: args.paymentMethod,
      shipping_address: args.shippingAddress,
      billing_address: args.billingAddress,
      notes: args.notes,
      coupon_code: args.couponCode,
      commission_amount: commissionAmount,
      updated_at: Date.now(),
    });

    // 11. Décrémenter le stock
    await decrementInventory(ctx, validatedItems);

    // 12. Incrémenter used_count du coupon
    if (args.couponCode) {
      await incrementCouponUsage(ctx, args.couponCode, store._id);
    }

    return {
      orderId,
      orderNumber,
      totalAmount,
      currency: store.currency ?? "XOF",
    };
  },
});

// ─── Update Order Status (Vendor) ────────────────────────────

export const updateStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
    ),
    trackingNumber: v.optional(v.string()),
    carrier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");
    if (order.store_id !== store._id) {
      throw new Error("Cette commande n'appartient pas à votre boutique");
    }

    assertValidTransition(order.status, args.status);

    const updates: Record<string, any> = {
      status: args.status,
      updated_at: Date.now(),
    };

    // Ajout tracking si shipped
    if (args.status === "shipped") {
      if (args.trackingNumber) updates.tracking_number = args.trackingNumber;
      if (args.carrier) updates.carrier = args.carrier;
    }

    // Timestamp de livraison
    if (args.status === "delivered") {
      updates.delivered_at = Date.now();
    }

    await ctx.db.patch(args.orderId, updates);

    return { success: true };
  },
});

// ─── Cancel Order ────────────────────────────────────────────

export const cancelOrder = mutation({
  args: {
    orderId: v.id("orders"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");

    // Déterminer qui annule
    const isCustomer = order.customer_id === user._id;
    const isAdmin = user.role === "admin";

    let isVendor = false;
    if (user.role === "vendor") {
      const store = await ctx.db
        .query("stores")
        .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
        .first();
      isVendor = store?._id === order.store_id;
    }

    // Vérifier les permissions d'annulation
    if (isCustomer && !canCustomerCancel(order)) {
      throw new Error(
        "Annulation impossible — délai de 2h dépassé ou commande déjà expédiée",
      );
    }
    if (isVendor && !canVendorCancel(order)) {
      throw new Error(
        "Annulation vendeur possible uniquement en statut « En traitement »",
      );
    }
    if (!isCustomer && !isVendor && !isAdmin) {
      throw new Error("Vous n'êtes pas autorisé à annuler cette commande");
    }

    assertValidTransition(order.status, "cancelled");

    // Annuler
    await ctx.db.patch(args.orderId, {
      status: "cancelled",
      updated_at: Date.now(),
    });

    // Restaurer le stock
    await restoreInventory(ctx, order.items);

    // Si déjà payé, marquer pour remboursement
    if (order.payment_status === "paid") {
      await ctx.db.patch(args.orderId, {
        payment_status: "refunded",
      });
      // TODO: Step 0.11 — déclencher le remboursement via Moneroo/Stripe
    }

    return { success: true };
  },
});

// ─── Helpers internes ────────────────────────────────────────

/**
 * Applique un coupon et retourne le montant de la réduction en centimes.
 */
async function applyCoupon(
  ctx: MutationCtx,
  code: string,
  storeId: any,
  userId: any,
  subtotal: number,
  items: any[],
): Promise<number> {
  const coupon = await ctx.db
    .query("coupons")
    .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
    .unique();

  if (!coupon) throw new Error(`Code promo « ${code} » invalide`);
  if (coupon.store_id !== storeId) {
    throw new Error("Ce code promo n'est pas valable pour cette boutique");
  }
  if (!coupon.is_active) throw new Error("Ce code promo n'est plus actif");

  // Vérifier expiration
  if (coupon.expires_at && coupon.expires_at < Date.now()) {
    throw new Error("Ce code promo a expiré");
  }

  // Vérifier le nombre d'utilisations global
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    throw new Error("Ce code promo a atteint sa limite d'utilisation");
  }

  // Vérifier le montant minimum
  if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
    throw new Error(
      `Montant minimum requis : ${coupon.min_order_amount / 100} FCFA`,
    );
  }

  // Calculer la réduction
  switch (coupon.type) {
    case "percentage":
      return Math.round((subtotal * coupon.value) / 100);
    case "fixed_amount":
      return Math.min(coupon.value, subtotal);
    case "free_shipping":
      return 0; // sera appliqué sur shipping_amount quand implémenté
    default:
      return 0;
  }
}

/**
 * Incrémente le compteur d'utilisation du coupon.
 */
async function incrementCouponUsage(
  ctx: MutationCtx,
  code: string,
  storeId: any,
): Promise<void> {
  const coupon = await ctx.db
    .query("coupons")
    .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
    .unique();

  if (coupon && coupon.store_id === storeId) {
    await ctx.db.patch(coupon._id, {
      used_count: coupon.used_count + 1,
    });
  }
}

// Type import nécessaire pour les helpers internes
import type { MutationCtx } from "../_generated/server";
