// filepath: convex/returns/mutations.ts

import { mutation, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { requireAppUser, getVendorStore } from "../users/helpers";
import { restoreInventory } from "../orders/helpers";
import {
  canRequestReturn,
  validateReturnItems,
  calculateRefundAmount,
  isFullReturn,
  assertValidReturnTransition,
} from "./helpers";

// ─── Request Return (Customer) ──────────────────────────────────

export const requestReturn = mutation({
  args: {
    orderId: v.id("orders"),
    items: v.array(
      v.object({
        productId: v.id("products"),
        variantId: v.optional(v.id("product_variants")),
        quantity: v.number(),
      }),
    ),
    reason: v.string(),
    reasonCategory: v.union(
      v.literal("defective"),
      v.literal("wrong_item"),
      v.literal("not_as_described"),
      v.literal("changed_mind"),
      v.literal("damaged_in_transit"),
      v.literal("other"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    // 1. Vérifier la commande
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");
    if (order.customer_id !== user._id) {
      throw new Error("Cette commande ne vous appartient pas");
    }

    // 2. Vérifier l'éligibilité
    const eligibility = await canRequestReturn(ctx, order);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason!);
    }

    // 3. Valider les items
    const returnItemInputs = args.items.map((i) => ({
      product_id: i.productId,
      variant_id: i.variantId,
      quantity: i.quantity,
    }));

    const validatedItems = validateReturnItems(order.items, returnItemInputs);

    // 4. Calculer le montant du remboursement
    const refundAmount = calculateRefundAmount(validatedItems);

    // 5. Créer la demande de retour
    const returnId = await ctx.db.insert("return_requests", {
      order_id: args.orderId,
      store_id: order.store_id,
      customer_id: user._id,
      items: validatedItems,
      status: "requested",
      reason: args.reason,
      reason_category: args.reasonCategory,
      refund_amount: refundAmount,
      requested_at: Date.now(),
    });

    // 6. Notifier le vendeur
    const store = await ctx.db.get(order.store_id);
    if (store) {
      const vendor = await ctx.db.get(store.owner_id);
      if (vendor) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.notifyReturnStatus,
          {
            recipientUserId: vendor._id,
            recipientEmail: vendor.email,
            recipientName: vendor.name ?? "Vendeur",
            orderNumber: order.order_number,
            returnStatus: "requested",
            storeName: store.name,
            refundAmount: refundAmount,
            currency: order.currency,
            customerName: user.name ?? "Client",
            isVendorNotification: true,
          },
        );
      }
    }

    return { returnId, refundAmount };
  },
});

// ─── Approve Return (Vendor) ────────────────────────────────────

export const approveReturn = mutation({
  args: {
    returnId: v.id("return_requests"),
    vendorNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, store } = await getVendorStore(ctx);

    const returnReq = await ctx.db.get(args.returnId);
    if (!returnReq) throw new Error("Demande de retour introuvable");
    if (returnReq.store_id !== store._id) {
      throw new Error("Cette demande ne concerne pas votre boutique");
    }

    assertValidReturnTransition(returnReq.status, "approved");

    await ctx.db.patch(args.returnId, {
      status: "approved",
      approved_at: Date.now(),
      vendor_notes: args.vendorNotes,
    });

    // Notifier le client
    const customer = await ctx.db.get(returnReq.customer_id);
    const order = await ctx.db.get(returnReq.order_id);
    if (customer && order) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.notifyReturnStatus,
        {
          recipientUserId: customer._id,
          recipientEmail: customer.email,
          recipientName: customer.name ?? "Client",
          orderNumber: order.order_number,
          returnStatus: "approved",
          storeName: store.name,
          refundAmount: returnReq.refund_amount,
          currency: order.currency,
          customerName: customer.name ?? "Client",
          isVendorNotification: false,
        },
      );
    }

    return { success: true };
  },
});

// ─── Reject Return (Vendor) ─────────────────────────────────────

export const rejectReturn = mutation({
  args: {
    returnId: v.id("return_requests"),
    rejectionReason: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, store } = await getVendorStore(ctx);

    const returnReq = await ctx.db.get(args.returnId);
    if (!returnReq) throw new Error("Demande de retour introuvable");
    if (returnReq.store_id !== store._id) {
      throw new Error("Cette demande ne concerne pas votre boutique");
    }

    assertValidReturnTransition(returnReq.status, "rejected");

    await ctx.db.patch(args.returnId, {
      status: "rejected",
      rejection_reason: args.rejectionReason,
    });

    // Notifier le client
    const customer = await ctx.db.get(returnReq.customer_id);
    const order = await ctx.db.get(returnReq.order_id);
    if (customer && order) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.notifyReturnStatus,
        {
          recipientUserId: customer._id,
          recipientEmail: customer.email,
          recipientName: customer.name ?? "Client",
          orderNumber: order.order_number,
          returnStatus: "rejected",
          storeName: store.name,
          refundAmount: returnReq.refund_amount,
          currency: order.currency,
          customerName: customer.name ?? "Client",
          isVendorNotification: false,
        },
      );
    }

    return { success: true };
  },
});

// ─── Confirm Received (Vendor) ──────────────────────────────────

/**
 * Le vendeur confirme avoir reçu les articles retournés.
 * → Restaure l'inventaire (via restoreInventory existant)
 */
export const confirmReceived = mutation({
  args: {
    returnId: v.id("return_requests"),
    vendorNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, store } = await getVendorStore(ctx);

    const returnReq = await ctx.db.get(args.returnId);
    if (!returnReq) throw new Error("Demande de retour introuvable");
    if (returnReq.store_id !== store._id) {
      throw new Error("Cette demande ne concerne pas votre boutique");
    }

    assertValidReturnTransition(returnReq.status, "received");

    // 1. Mettre à jour le statut
    await ctx.db.patch(args.returnId, {
      status: "received",
      received_at: Date.now(),
      vendor_notes: args.vendorNotes ?? returnReq.vendor_notes,
    });

    // 2. Restaurer l'inventaire
    // Convertir les items du retour au format attendu par restoreInventory
    const inventoryItems = returnReq.items.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
      image_url: "", // non utilisé par restoreInventory
    }));

    await restoreInventory(ctx, inventoryItems);

    // 3. Notifier le client
    const customer = await ctx.db.get(returnReq.customer_id);
    const order = await ctx.db.get(returnReq.order_id);
    if (customer && order) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.notifyReturnStatus,
        {
          recipientUserId: customer._id,
          recipientEmail: customer.email,
          recipientName: customer.name ?? "Client",
          orderNumber: order.order_number,
          returnStatus: "received",
          storeName: store.name,
          refundAmount: returnReq.refund_amount,
          currency: order.currency,
          customerName: customer.name ?? "Client",
          isVendorNotification: false,
        },
      );
    }

    return { success: true };
  },
});

// ─── Process Refund (Vendor or System) ──────────────────────────

/**
 * Traite le remboursement financier.
 * F-01 : Crée une transaction "refund" + débite store.balance.
 * Déclenche le remboursement Moneroo si applicable.
 */
export const processRefund = mutation({
  args: {
    returnId: v.id("return_requests"),
  },
  handler: async (ctx, args) => {
    const { user, store } = await getVendorStore(ctx);

    const returnReq = await ctx.db.get(args.returnId);
    if (!returnReq) throw new Error("Demande de retour introuvable");
    if (returnReq.store_id !== store._id) {
      throw new Error("Cette demande ne concerne pas votre boutique");
    }

    assertValidReturnTransition(returnReq.status, "refunded");

    const order = await ctx.db.get(returnReq.order_id);
    if (!order) throw new Error("Commande liée introuvable");

    // 1. Vérifier que le store a le solde suffisant
    if (store.balance < returnReq.refund_amount) {
      throw new Error(
        `Solde insuffisant pour le remboursement. Disponible: ${store.balance / 100} ${order.currency}, requis: ${returnReq.refund_amount / 100} ${order.currency}`,
      );
    }

    // 2. F-01 : Créer la transaction de remboursement (debit store)
    const balanceBefore = store.balance;
    const balanceAfter = balanceBefore - returnReq.refund_amount;

    await ctx.db.insert("transactions", {
      store_id: store._id,
      order_id: returnReq.order_id,
      type: "refund",
      direction: "debit",
      amount: returnReq.refund_amount,
      currency: order.currency,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status: "completed",
      description: `Remboursement retour commande ${order.order_number}`,
      processed_at: Date.now(),
    });

    // 3. Débiter le solde du store
    await ctx.db.patch(store._id, {
      balance: balanceAfter,
      updated_at: Date.now(),
    });

    // 4. Mettre à jour le retour
    await ctx.db.patch(args.returnId, {
      status: "refunded",
      refunded_at: Date.now(),
    });

    // 5. Mettre à jour le payment_status de la commande si retour total
    const fullReturn = isFullReturn(order.items, returnReq.items);
    if (fullReturn) {
      await ctx.db.patch(returnReq.order_id, {
        payment_status: "refunded",
        status: "refunded",
        updated_at: Date.now(),
      });
    }

    // 6. Déclencher le remboursement Moneroo vers le client
    if (order.payment_reference && order.payment_method) {
      const customer = await ctx.db.get(returnReq.customer_id);
      await ctx.scheduler.runAfter(
        0,
        internal.returns.actions.processMonerooRefund,
        {
          returnId: args.returnId,
          orderId: returnReq.order_id,
          amount: returnReq.refund_amount,
          currency: order.currency,
          customerEmail: customer?.email ?? "",
          customerName: customer?.name ?? "Client",
          paymentReference: order.payment_reference,
        },
      );
    }

    // 7. Notifier le client
    const customer = await ctx.db.get(returnReq.customer_id);
    if (customer) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.notifyReturnStatus,
        {
          recipientUserId: customer._id,
          recipientEmail: customer.email,
          recipientName: customer.name ?? "Client",
          orderNumber: order.order_number,
          returnStatus: "refunded",
          storeName: store.name,
          refundAmount: returnReq.refund_amount,
          currency: order.currency,
          customerName: customer.name ?? "Client",
          isVendorNotification: false,
        },
      );
    }

    return {
      success: true,
      refundAmount: returnReq.refund_amount,
      isFullRefund: fullReturn,
    };
  },
});

// ─── Update Refund Reference (Internal — from action) ───────────

export const updateRefundReference = internalMutation({
  args: {
    returnId: v.id("return_requests"),
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.returnId, {
      refund_reference: args.reference,
    });
  },
});
