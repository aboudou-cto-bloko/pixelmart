// filepath: convex/orders/mutations.ts

import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";
import { requireAppUser, getVendorStore } from "../users/helpers";
import { logOrderEvent } from "./events";
import { DEFAULT_CURRENCY } from "../lib/constants";
import {
  getEffectiveCommissionRates,
  getCancellationWindowMs,
} from "../lib/getConfig";
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
  validateAddress,
  checkOrderRateLimit,
  sanitizeOrderNotes,
  validateDeliveryCoordinates,
  validateCouponCode,
  type OrderItemInput,
} from "./helpers";
import { calculateDeliveryFee } from "../delivery/constants";
import { rateLimiter } from "../lib/ratelimits";

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
    // ── CHAMPS DELIVERY (OpenStreetMap) ──
    deliveryLat: v.optional(v.number()),
    deliveryLon: v.optional(v.number()),
    deliveryDistanceKm: v.optional(v.number()),
    deliveryFee: v.optional(v.number()), // calculé côté client, validé ici
    deliveryType: v.optional(
      v.union(v.literal("standard"), v.literal("urgent"), v.literal("fragile")),
    ),
    paymentMode: v.optional(v.union(v.literal("online"), v.literal("cod"))),
    estimatedWeightKg: v.optional(v.number()),
    // Distances bi-segment (scénario collecte : vendeur → hub + hub → client)
    deliveryDistanceVendorToHubKm: v.optional(v.number()),
    deliveryDistanceHubToClientKm: v.optional(v.number()),
    source: v.optional(
      v.union(v.literal("marketplace"), v.literal("vendor_shop")),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    // 1. Rate limiting — token bucket 5 commandes/minute via @convex-dev/ratelimiter
    const { ok, retryAfter } = await rateLimiter.limit(ctx, "createOrder", {
      key: user._id,
    });
    if (!ok) {
      const secs = retryAfter ? Math.ceil(retryAfter / 1000) : 60;
      throw new ConvexError(
        `Trop de commandes. Réessayez dans ${secs} seconde${secs > 1 ? "s" : ""}.`,
      );
    }

    // 2. Validate input data
    if (args.items.length === 0) {
      throw new ConvexError("La commande doit contenir au moins un article");
    }

    if (args.items.length > 50) {
      throw new ConvexError("Maximum 50 articles par commande");
    }

    // 3. Validate addresses
    const validatedShippingAddress = validateAddress(args.shippingAddress);
    const validatedBillingAddress = args.billingAddress
      ? validateAddress(args.billingAddress)
      : undefined;

    // 4. Validate delivery coordinates
    validateDeliveryCoordinates(args.deliveryLat, args.deliveryLon);

    // 5. Sanitize and validate optional fields
    const sanitizedNotes = sanitizeOrderNotes(args.notes);
    const validatedCouponCode = validateCouponCode(args.couponCode);

    // 6. Validate delivery fee if provided
    if (args.deliveryFee !== undefined) {
      if (args.deliveryFee < 0 || args.deliveryFee > 100000) {
        throw new ConvexError("Frais de livraison invalides");
      }
    }

    // 7. Validate estimated weight
    if (args.estimatedWeightKg !== undefined) {
      if (args.estimatedWeightKg < 0 || args.estimatedWeightKg > 1000) {
        throw new ConvexError("Poids estimé invalide");
      }
    }

    // 8. Validate delivery distance
    if (args.deliveryDistanceKm !== undefined) {
      if (args.deliveryDistanceKm < 0 || args.deliveryDistanceKm > 500) {
        throw new ConvexError("Distance de livraison invalide");
      }
    }
    if (args.deliveryDistanceVendorToHubKm !== undefined) {
      if (
        args.deliveryDistanceVendorToHubKm < 0 ||
        args.deliveryDistanceVendorToHubKm > 500
      ) {
        throw new ConvexError("Distance vendeur→hub invalide");
      }
    }
    if (args.deliveryDistanceHubToClientKm !== undefined) {
      if (
        args.deliveryDistanceHubToClientKm < 0 ||
        args.deliveryDistanceHubToClientKm > 500
      ) {
        throw new ConvexError("Distance hub→client invalide");
      }
    }

    // 9. Vérifier que la boutique existe et est active
    const store = await ctx.db.get(args.storeId);
    if (!store || store.status !== "active") {
      throw new ConvexError("Boutique introuvable ou inactive");
    }

    // 10. Un vendor ne peut pas acheter dans sa propre boutique
    if (store.owner_id === user._id) {
      throw new ConvexError(
        "Vous ne pouvez pas acheter dans votre propre boutique",
      );
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
    if (validatedCouponCode) {
      discountAmount = await applyCoupon(
        ctx,
        validatedCouponCode,
        args.storeId,
        subtotal,
      );
    }

    // 6. Frais de livraison
    const deliveryType = args.deliveryType ?? "standard";
    const paymentMode = args.paymentMode ?? "online";

    // Distance effective pour le calcul des frais :
    // - Scénario A (has_storage_plan) : goods déjà à PM → hub→client seulement, pas de segment collecte
    // - Scénario C (collecte PM, !has_storage_plan) : vendeur→hub + hub→client
    // - Scénario B (pickup propre, !use_pixelmart_service) : distance unique
    let effectiveDistanceKm: number | undefined;
    if (
      store.has_storage_plan &&
      args.deliveryDistanceHubToClientKm !== undefined
    ) {
      // Scénario A : ignorer le segment vendeur→hub (goods déjà en entrepôt)
      effectiveDistanceKm = args.deliveryDistanceHubToClientKm;
    } else if (
      args.deliveryDistanceVendorToHubKm !== undefined &&
      args.deliveryDistanceHubToClientKm !== undefined
    ) {
      // Scénario C : cumul des deux segments
      effectiveDistanceKm =
        args.deliveryDistanceVendorToHubKm + args.deliveryDistanceHubToClientKm;
    } else {
      // Scénario B ou distance unique
      effectiveDistanceKm = args.deliveryDistanceKm;
    }

    // Utiliser le fee calculé côté client, ou recalculer si distance fournie
    let shippingAmount = args.deliveryFee ?? 0;

    if (!shippingAmount && effectiveDistanceKm) {
      shippingAmount = calculateDeliveryFee(
        effectiveDistanceKm,
        deliveryType,
        args.estimatedWeightKg ?? 0,
      );
    }

    // 7. Total — tout en XOF centimes
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount);

    // 8. Commission — source : platform_config (fallback : convex/lib/constants.ts)
    const commissionRates = await getEffectiveCommissionRates(ctx);
    const commissionRate = getCommissionRate(store.subscription_tier, commissionRates);
    const commissionAmount = calculateCommission(totalAmount, commissionRate);

    // 9. Générer le numéro de commande
    const orderNumber = await generateOrderNumber(ctx);

    // 10. Devise — toujours XOF pour les opérations backend
    const currency = DEFAULT_CURRENCY;

    // 11. Déterminer le statut initial selon le mode de paiement
    // COD = "paid" directement (le paiement sera collecté à la livraison)
    // Online = "pending" (en attente de confirmation Moneroo)
    const initialStatus = paymentMode === "cod" ? "paid" : "pending";
    const initialPaymentStatus = "pending";

    // 12. Créer la commande
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
      status: initialStatus,
      payment_status: initialPaymentStatus,
      payment_method: args.paymentMethod,
      shipping_address: validatedShippingAddress,
      billing_address: validatedBillingAddress,
      notes: sanitizedNotes,
      coupon_code: validatedCouponCode,
      commission_amount: commissionAmount,
      // ── CHAMPS DELIVERY ──
      delivery_lat: args.deliveryLat,
      delivery_lon: args.deliveryLon,
      delivery_distance_km: effectiveDistanceKm,
      delivery_distance_vendor_to_hub_km: args.deliveryDistanceVendorToHubKm,
      delivery_distance_hub_to_client_km: args.deliveryDistanceHubToClientKm,
      delivery_type: deliveryType,
      payment_mode: paymentMode,
      delivery_fee: shippingAmount,
      estimated_weight_kg: args.estimatedWeightKg,
      source: args.source ?? "marketplace",
      updated_at: Date.now(),
    });

    // 13. Décrémenter le stock
    await decrementInventory(ctx, validatedItems);

    // 14. Incrémenter used_count du coupon
    if (validatedCouponCode) {
      await incrementCouponUsage(ctx, validatedCouponCode, args.storeId);
    }

    // 15. Log event
    await logOrderEvent(ctx, {
      orderId,
      storeId: store._id,
      type: "created",
      description:
        paymentMode === "cod"
          ? "Commande créée (paiement à la livraison)"
          : "Commande créée",
      actorType: "customer",
      actorId: user._id,
    });

    return {
      orderId,
      orderNumber,
      totalAmount,
      currency,
      paymentMode,
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
      v.literal("ready_for_delivery"),
      v.literal("delivery_failed"),
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
      const customer = await ctx.db.get(order.customer_id);
      if (customer) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.notifyOrderStatusGeneric,
          {
            customerUserId: customer._id,
            customerEmail: customer.email,
            orderNumber: order.order_number,
            storeName: store.name,
            previousStatus: "paid",
            newStatus: "processing",
          },
        );
      }
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
      if (customer) {
        // Email si l'adresse est disponible
        if (customer.email) {
          await ctx.scheduler.runAfter(
            0,
            internal.emails.send.sendOrderShipped,
            {
              customerEmail: customer.email,
              customerName: customer.name ?? "Client",
              orderNumber: order.order_number,
              orderId: order._id,
              storeName: store.name,
              trackingNumber: args.trackingNumber,
              carrier: args.carrier,
            },
          );
        }

        // Notification in-app
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.notifyOrderStatusInApp,
          {
            customerUserId: customer._id,
            orderNumber: order.order_number,
            storeName: store.name,
            newStatus: "shipped",
          },
        );
      }
    }

    // ── Delivered ──
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

      const customer = await ctx.db.get(order.customer_id);
      if (customer?.email) {
        // Email existant
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

        // ── NOUVEAU : in-app ──
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.notifyOrderStatusInApp,
          {
            customerUserId: customer._id,
            orderNumber: order.order_number,
            storeName: store.name,
            newStatus: "delivered",
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

    const cancellationWindowMs = await getCancellationWindowMs(ctx);
    if (isCustomer && !canCustomerCancel(order, cancellationWindowMs)) {
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
      // Email existant
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

      // ── NOUVEAU : in-app ──
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.notifyOrderStatusInApp,
        {
          customerUserId: customer._id,
          orderNumber: order.order_number,
          storeName: store.name,
          newStatus: "cancelled",
        },
      );
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

    // ── NOUVEAU : Email "delivered" au client ──
    if (user.email) {
      const store = await ctx.db.get(order.store_id);
      if (store) {
        await ctx.scheduler.runAfter(
          0,
          internal.emails.send.sendOrderDelivered,
          {
            customerEmail: user.email,
            customerName: user.name ?? "Client",
            orderNumber: order.order_number,
            orderId: order._id,
            storeName: store.name,
          },
        );

        // In-app
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.notifyOrderStatusInApp,
          {
            customerUserId: user._id,
            orderNumber: order.order_number,
            storeName: store.name,
            newStatus: "delivered",
          },
        );
      }
    }

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

      // ── NOUVEAU : Email + in-app ──
      const customer = await ctx.db.get(order.customer_id);
      const store = await ctx.db.get(order.store_id);
      if (customer?.email && store) {
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

        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.notifyOrderStatusInApp,
          {
            customerUserId: customer._id,
            orderNumber: order.order_number,
            storeName: store.name,
            newStatus: "delivered",
          },
        );
      }

      confirmedCount++;
    }

    return { confirmedCount };
  },
});
