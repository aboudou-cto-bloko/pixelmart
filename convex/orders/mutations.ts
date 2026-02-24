// filepath: convex/orders/mutations.ts

import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";
import { requireAppUser, getVendorStore } from "../users/helpers";
import { logOrderEvent } from "./events";
import { DEFAULT_CURRENCY } from "../lib/constants";
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
  type OrderItemInput,
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
    const orderItems: OrderItemInput[] = args.items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      quantity: i.quantity,
    }));

    const validatedItems = await validateAndBuildItems(
      ctx,
      args.storeId,
      orderItems,
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
        args.storeId,
        subtotal,
      );
    }

    // 6. Frais de livraison (placeholder — calculé dynamiquement en Phase 1)
    const shippingAmount = 0;

    // 7. Total — tout en XOF centimes
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount);

    // 8. Commission — source : convex/lib/constants.ts
    const commissionRate = getCommissionRate(store.subscription_tier);
    const commissionAmount = calculateCommission(totalAmount, commissionRate);

    // 9. Générer le numéro de commande
    const orderNumber = await generateOrderNumber(ctx);

    // 10. Devise — toujours XOF pour les opérations backend
    const currency = DEFAULT_CURRENCY;

    // 11. Créer la commande
    const orderId = await ctx.db.insert("orders", {
      order_number: orderNumber,
      customer_id: user._id,
      store_id: store._id,
      items: validatedItems,
      subtotal,
      shipping_amount: shippingAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      currency,
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

    // 12. Décrémenter le stock
    await decrementInventory(ctx, validatedItems);

    // 13. Incrémenter used_count du coupon
    if (args.couponCode) {
      await incrementCouponUsage(ctx, args.couponCode, args.storeId);
    }

    return {
      orderId,
      orderNumber,
      totalAmount,
      currency,
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
    estimatedDelivery: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user, store } = await getVendorStore(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");
    if (order.store_id !== store._id) {
      throw new Error("Cette commande n'appartient pas à votre boutique");
    }

    assertValidTransition(order.status, args.status);

    const updates: Record<string, unknown> = {
      status: args.status,
      updated_at: Date.now(),
    };

    // ── Processing ──
    if (args.status === "processing") {
      await logOrderEvent(ctx, {
        orderId: order._id,
        storeId: store._id,
        type: "processing",
        description: "Commande prise en charge par le vendeur",
        actorType: "vendor",
        actorId: user._id,
      });
    }

    // ── Shipped ──
    if (args.status === "shipped") {
      if (args.trackingNumber) updates.tracking_number = args.trackingNumber;
      if (args.carrier) updates.carrier = args.carrier;
      if (args.estimatedDelivery)
        updates.estimated_delivery = args.estimatedDelivery;

      await logOrderEvent(ctx, {
        orderId: order._id,
        storeId: store._id,
        type: "shipped",
        description: args.trackingNumber
          ? `Colis expédié — ${args.carrier ?? "Transporteur"} : ${args.trackingNumber}`
          : "Colis expédié",
        actorType: "vendor",
        actorId: user._id,
        metadata: {
          tracking_number: args.trackingNumber,
          carrier: args.carrier,
          estimated_delivery: args.estimatedDelivery,
        },
      });

      // Email au client — shipped
      const customer = await ctx.db.get(order.customer_id);
      if (customer?.email) {
        await ctx.scheduler.runAfter(0, internal.emails.send.sendOrderShipped, {
          customerEmail: customer.email,
          customerName: customer.name ?? "Client",
          orderNumber: order.order_number,
          orderId: order._id,
          storeName: store.name,
          trackingNumber: args.trackingNumber,
          carrier: args.carrier,
        });
      }
    }

    // ── Delivered ──
    if (args.status === "delivered") {
      updates.delivered_at = Date.now();

      await logOrderEvent(ctx, {
        orderId: order._id,
        storeId: store._id,
        type: "delivered",
        description: "Livraison confirmée par le vendeur",
        actorType: "vendor",
        actorId: user._id,
      });

      // Email au client — delivered (corrigé: était sendOrderShipped)
      const customer = await ctx.db.get(order.customer_id);
      if (customer?.email) {
        await ctx.scheduler.runAfter(
          0,
          internal.emails.send.sendOrderDelivered,
          {
            customerEmail: customer.email,
            customerName: customer.name ?? "Client",
            orderNumber: order.order_number,
            orderId: order._id,
            storeName: store.name,
          },
        );
      }
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

    const actorType: "customer" | "vendor" | "admin" = isAdmin
      ? "admin"
      : isVendor
        ? "vendor"
        : "customer";

    await logOrderEvent(ctx, {
      orderId: order._id,
      storeId: order.store_id,
      type: "cancelled",
      description: args.reason
        ? `Commande annulée — ${args.reason}`
        : "Commande annulée",
      actorType,
      actorId: user._id,
    });

    // Annuler
    await ctx.db.patch(args.orderId, {
      status: "cancelled",
      updated_at: Date.now(),
    });

    const customer = await ctx.db.get(order.customer_id);
    const store = await ctx.db.get(order.store_id);
    if (customer?.email && store) {
      await ctx.scheduler.runAfter(0, internal.emails.send.sendOrderCancelled, {
        customerEmail: customer.email,
        customerName: customer.name ?? "Client",
        orderNumber: order.order_number,
        storeName: store.name,
        totalAmount: order.total_amount,
        currency: order.currency,
        reason: args.reason,
        wasRefunded: order.payment_status === "paid",
      });
    }

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

/**
 * Ajoute ou modifie les informations de suivi.
 * Peut être fait à n'importe quel moment entre "processing" et "delivered".
 */
export const addTracking = mutation({
  args: {
    orderId: v.id("orders"),
    trackingNumber: v.string(),
    carrier: v.optional(v.string()),
    estimatedDelivery: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user, store } = await getVendorStore(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");
    if (order.store_id !== store._id) {
      throw new Error("Cette commande n'appartient pas à votre boutique");
    }

    const trackableStatuses = ["processing", "shipped"];
    if (!trackableStatuses.includes(order.status)) {
      throw new Error(
        "Le suivi ne peut être ajouté qu'aux commandes en préparation ou expédiées",
      );
    }

    const updates: Record<string, unknown> = {
      tracking_number: args.trackingNumber,
      updated_at: Date.now(),
    };
    if (args.carrier) updates.carrier = args.carrier;
    if (args.estimatedDelivery)
      updates.estimated_delivery = args.estimatedDelivery;

    await ctx.db.patch(args.orderId, updates);

    await logOrderEvent(ctx, {
      orderId: order._id,
      storeId: store._id,
      type: "tracking_updated",
      description: `Suivi mis à jour — ${args.carrier ?? "Transporteur"} : ${args.trackingNumber}`,
      actorType: "vendor",
      actorId: user._id,
      metadata: {
        tracking_number: args.trackingNumber,
        carrier: args.carrier,
        estimated_delivery: args.estimatedDelivery,
      },
    });

    return { success: true };
  },
});

// ─── Confirm Delivery (Customer) ─────────────────────────────

/**
 * Le client confirme la réception de sa commande.
 * Transition : shipped → delivered
 */
export const confirmDelivery = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");
    if (order.customer_id !== user._id) {
      throw new Error("Cette commande ne vous appartient pas");
    }

    if (order.status !== "shipped") {
      throw new Error(
        "Seule une commande expédiée peut être confirmée comme livrée",
      );
    }

    assertValidTransition(order.status, "delivered");

    await ctx.db.patch(args.orderId, {
      status: "delivered",
      delivered_at: Date.now(),
      updated_at: Date.now(),
    });

    await logOrderEvent(ctx, {
      orderId: order._id,
      storeId: order.store_id,
      type: "delivered",
      description: "Livraison confirmée par le client",
      actorType: "customer",
      actorId: user._id,
    });

    return { success: true };
  },
});
// ─── Helpers internes (coupon) ───────────────────────────────

/**
 * Applique un coupon et retourne le montant de la réduction en centimes.
 * L'index by_code est composé : ["store_id", "code"]
 */
async function applyCoupon(
  ctx: MutationCtx,
  code: string,
  storeId: Id<"stores">,
  subtotal: number,
): Promise<number> {
  const normalizedCode = code.toUpperCase().trim();

  const coupon = await ctx.db
    .query("coupons")
    .withIndex("by_code", (q) =>
      q.eq("store_id", storeId).eq("code", normalizedCode),
    )
    .unique();

  if (!coupon) {
    throw new Error(`Code promo « ${code} » invalide pour cette boutique`);
  }

  if (!coupon.is_active) throw new Error("Ce code promo n'est plus actif");

  if (coupon.starts_at && coupon.starts_at > Date.now()) {
    throw new Error("Ce code promo n'est pas encore actif");
  }

  if (coupon.expires_at && coupon.expires_at < Date.now()) {
    throw new Error("Ce code promo a expiré");
  }

  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    throw new Error("Ce code promo a atteint sa limite d'utilisation");
  }

  if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
    const minDisplay = Math.round(coupon.min_order_amount / 100);
    throw new Error(`Montant minimum requis : ${minDisplay} FCFA`);
  }

  switch (coupon.type) {
    case "percentage":
      return Math.round((subtotal * coupon.value) / 100);
    case "fixed_amount":
      return Math.min(coupon.value, subtotal);
    case "free_shipping":
      return 0; // appliqué sur shipping_amount quand implémenté
    default:
      return 0;
  }
}

/**
 * Incrémente le compteur d'utilisation du coupon.
 * L'index by_code est composé : ["store_id", "code"]
 */
async function incrementCouponUsage(
  ctx: MutationCtx,
  code: string,
  storeId: Id<"stores">,
): Promise<void> {
  const normalizedCode = code.toUpperCase().trim();

  const coupon = await ctx.db
    .query("coupons")
    .withIndex("by_code", (q) =>
      q.eq("store_id", storeId).eq("code", normalizedCode),
    )
    .unique();

  if (coupon) {
    await ctx.db.patch(coupon._id, {
      used_count: coupon.used_count + 1,
    });
  }
}

// ─── Auto Confirm Delivery (Cron) ───────────────────────────

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Cron job : passe automatiquement les commandes shipped → delivered
 * si elles sont en statut "shipped" depuis plus de 7 jours.
 * Appelé toutes les 6 heures.
 */
export const autoConfirmDelivery = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - SEVEN_DAYS_MS;

    // On ne peut pas filtrer par updated_at avec un index,
    // donc on query toutes les commandes shipped et on filtre.
    // Volume acceptable car shipped est un état transitoire.
    const allShipped = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("status"), "shipped"))
      .collect();

    const overdueOrders = allShipped.filter(
      (order) => order.updated_at <= cutoffTime,
    );

    let confirmedCount = 0;

    for (const order of overdueOrders) {
      await ctx.db.patch(order._id, {
        status: "delivered",
        delivered_at: Date.now(),
        updated_at: Date.now(),
      });

      await logOrderEvent(ctx, {
        orderId: order._id,
        storeId: order.store_id,
        type: "delivered",
        description: "Livraison confirmée automatiquement (délai de 7 jours)",
        actorType: "system",
      });

      confirmedCount++;
    }

    return { confirmedCount };
  },
});
