// filepath: convex/payments/mutations.ts

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { assertValidTransition } from "../orders/helpers";

/**
 * Stocke la référence de paiement Moneroo dans la commande.
 * Appelée après l'initialisation du paiement.
 */
export const setPaymentReference = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentReference: v.string(),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      payment_reference: args.paymentReference,
      payment_method: args.paymentMethod,
      updated_at: Date.now(),
    });
  },
});

/**
 * Confirme un paiement réussi.
 *
 * 1. Order : pending → paid
 * 2. payment_status : pending → paid
 * 3. Rule F-01 : crée une transaction "sale" (credit store)
 * 4. Rule F-01 : crée une transaction "fee" (commission Pixel-Mart)
 * 5. Crédite le pending_balance du store (libéré après 48h)
 *
 * IDEMPOTENT : si déjà paid, ne fait rien.
 */
export const confirmPayment = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentReference: v.string(),
    amountPaid: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");

    // Idempotence : si déjà payée, skip
    if (order.payment_status === "paid") {
      return { alreadyProcessed: true };
    }

    // Valider la transition
    assertValidTransition(order.status, "paid");

    // 1. Mettre à jour la commande
    await ctx.db.patch(args.orderId, {
      status: "paid",
      payment_status: "paid",
      payment_reference: args.paymentReference,
      updated_at: Date.now(),
    });

    // 2. Récupérer le store
    const store = await ctx.db.get(order.store_id);
    if (!store) throw new Error("Boutique introuvable");

    // 3. Montant net = total - commission
    const commissionAmount = order.commission_amount ?? 0;
    const netAmount = order.total_amount - commissionAmount;

    // 4. F-01 : Transaction "sale" — crédit pour le vendeur
    const balanceBefore = store.pending_balance;
    const balanceAfter = balanceBefore + netAmount;

    await ctx.db.insert("transactions", {
      store_id: store._id,
      order_id: args.orderId,
      type: "sale",
      direction: "credit",
      amount: netAmount,
      currency: order.currency,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status: "completed",
      reference: args.paymentReference,
      description: `Vente commande ${order.order_number}`,
      processed_at: Date.now(),
    });

    // 5. F-01 : Transaction "fee" — commission Pixel-Mart
    if (commissionAmount > 0) {
      await ctx.db.insert("transactions", {
        store_id: store._id,
        order_id: args.orderId,
        type: "fee",
        direction: "debit",
        amount: commissionAmount,
        currency: order.currency,
        balance_before: balanceAfter,
        balance_after: balanceAfter, // Le fee est déjà déduit du net
        status: "completed",
        reference: args.paymentReference,
        description: `Commission Pixel-Mart commande ${order.order_number}`,
        processed_at: Date.now(),
      });
    }

    // 6. Créditer le pending_balance (libéré après 48h par cron)
    await ctx.db.patch(store._id, {
      pending_balance: balanceAfter,
      total_orders: store.total_orders + 1,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Marque un paiement comme échoué.
 * Restaure le stock (la commande avait décrémenté le stock à la création).
 */
export const failPayment = internalMutation({
  args: {
    orderId: v.id("orders"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");

    // Idempotence
    if (order.payment_status === "failed") {
      return { alreadyProcessed: true };
    }

    // Ne pas toucher une commande déjà payée
    if (order.payment_status === "paid") {
      return { alreadyProcessed: true };
    }

    await ctx.db.patch(args.orderId, {
      status: "cancelled",
      payment_status: "failed",
      updated_at: Date.now(),
    });

    // Restaurer le stock
    const { restoreInventory } = await import("../orders/helpers");
    await restoreInventory(ctx, order.items);

    return { success: true };
  },
});
