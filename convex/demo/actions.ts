// filepath: convex/demo/actions.ts

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Demo — simulates a Moneroo payment for a pending order.
 * Only works when the order belongs to a demo store.
 */
export const simulatePayment = action({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const result = await ctx.runQuery(internal.demo.queries.getOrderWithStore, {
      orderId,
    });
    if (!result) throw new Error("Commande introuvable");
    const { order, store } = result;

    if (!store?.is_demo)
      throw new Error("Cette action est réservée aux comptes démo");
    if (order.status !== "pending")
      throw new Error("La commande n'est pas en attente de paiement");

    await ctx.runMutation(internal.payments.mutations.confirmPayment, {
      orderId,
      paymentReference: `DEMO-${Date.now()}`,
      amountPaid: order.total_amount,
      currency: order.currency ?? store.currency,
    });
  },
});

/**
 * Admin — resets all demo data for a store.
 * `deleteStoreDemoData` enforces the is_demo guard server-side.
 */
export const resetDemoData = action({
  args: { storeId: v.id("stores") },
  handler: async (ctx, { storeId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");
    await ctx.runMutation(internal.demo.mutations.deleteStoreDemoData, {
      storeId,
    });
  },
});
