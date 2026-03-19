// filepath: convex/delivery/mutations.ts

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getVendorStore } from "../users/helpers";
import {
  getNextBatchNumber,
  validateOrdersOwnership,
  validateOrdersForBatch,
  calculateBatchTotalFee,
} from "./helpers";
import { DEFAULT_CURRENCY } from "../lib/constants";

/**
 * Marquer une commande comme prête pour livraison (vendeur).
 */
export const markReadyForDelivery = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");
    if (order.store_id !== store._id) {
      throw new Error("Cette commande n'appartient pas à votre boutique");
    }

    if (order.status !== "processing") {
      throw new Error(
        "Seule une commande en préparation peut être marquée prête",
      );
    }

    await ctx.db.patch(args.orderId, {
      status: "ready_for_delivery",
      ready_for_delivery: true,
      ready_at: Date.now(),
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

// ─── Batch Management (Vendor) ───────────────────────────────

/**
 * Créer un lot de livraison.
 */
export const createBatch = mutation({
  args: {
    orderIds: v.array(v.id("orders")),
    groupingType: v.union(v.literal("zone"), v.literal("manual")),
  },
  handler: async (ctx, args) => {
    const { user, store } = await getVendorStore(ctx);

    if (args.orderIds.length === 0) {
      throw new Error("Sélectionnez au moins une commande");
    }

    // Valider que toutes les commandes appartiennent à cette boutique
    const orders = await validateOrdersOwnership(ctx, args.orderIds, store._id);

    // Valider l'éligibilité des commandes
    validateOrdersForBatch(orders);

    // Générer le numéro de lot
    const batchNumber = await getNextBatchNumber(ctx);

    // Calculer le total des frais
    const totalDeliveryFee = calculateBatchTotalFee(orders);

    // Créer le lot
    const batchId = await ctx.db.insert("delivery_batches", {
      batch_number: batchNumber,
      store_id: store._id,
      created_by: user._id,
      order_ids: args.orderIds,
      order_count: args.orderIds.length,
      grouping_type: args.groupingType,
      status: "pending",
      total_delivery_fee: totalDeliveryFee,
      currency: DEFAULT_CURRENCY,
      updated_at: Date.now(),
    });

    // Mettre à jour les commandes avec le batch_id et passer en "shipped"
    for (const orderId of args.orderIds) {
      await ctx.db.patch(orderId, {
        batch_id: batchId,
        status: "shipped",
        updated_at: Date.now(),
      });
    }

    return {
      batchId,
      batchNumber,
      orderCount: args.orderIds.length,
      totalDeliveryFee,
    };
  },
});

/**
 * Transmettre un lot à l'admin.
 */
export const transmitBatch = mutation({
  args: {
    batchId: v.id("delivery_batches"),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const batch = await ctx.db.get(args.batchId);
    if (!batch) throw new Error("Lot introuvable");
    if (batch.store_id !== store._id) {
      throw new Error("Ce lot n'appartient pas à votre boutique");
    }
    if (batch.status !== "pending") {
      throw new Error("Seul un lot en attente peut être transmis");
    }

    await ctx.db.patch(args.batchId, {
      status: "transmitted",
      transmitted_at: Date.now(),
      updated_at: Date.now(),
    });

    // TODO: Notification à l'admin

    return { success: true };
  },
});

/**
 * Annuler un lot (vendeur, seulement si pending).
 */
export const cancelBatch = mutation({
  args: {
    batchId: v.id("delivery_batches"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const batch = await ctx.db.get(args.batchId);
    if (!batch) throw new Error("Lot introuvable");
    if (batch.store_id !== store._id) {
      throw new Error("Ce lot n'appartient pas à votre boutique");
    }
    if (batch.status !== "pending") {
      throw new Error("Seul un lot en attente peut être annulé");
    }

    // Retirer le batch_id des commandes et remettre en ready_for_delivery
    for (const orderId of batch.order_ids) {
      await ctx.db.patch(orderId, {
        batch_id: undefined,
        status: "ready_for_delivery",
        updated_at: Date.now(),
      });
    }

    await ctx.db.patch(args.batchId, {
      status: "cancelled",
      admin_notes: args.reason,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});
