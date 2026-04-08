// filepath: convex/demo/actions.ts

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Demo — simulates a Moneroo payment for one or more pending orders.
 * Only works when the orders belong to demo stores.
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
 * Demo — simulates storage reception by an agent (pending_drop_off → received).
 * Bypasses the requireAgent role check for demo stores.
 */
export const simulateStorageReceived = action({
  args: { requestId: v.id("storage_requests") },
  handler: async (ctx, { requestId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");
    await ctx.runMutation(internal.demo.mutations.forceStorageReceived, {
      requestId,
    });
  },
});

/**
 * Demo — simulates admin storage validation (received → in_stock + invoice).
 * Bypasses the requireAgent/admin role check for demo stores.
 */
export const simulateStorageValidated = action({
  args: { requestId: v.id("storage_requests") },
  handler: async (ctx, { requestId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");
    await ctx.runMutation(internal.demo.mutations.forceStorageValidated, {
      requestId,
    });
  },
});

/**
 * Demo — forces pending_balance → balance without the 48h delay.
 * Simulates delivered orders being released.
 */
export const simulateBalanceRelease = action({
  args: { storeId: v.id("stores") },
  handler: async (ctx, { storeId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");
    await ctx.runMutation(internal.demo.mutations.forceBalanceRelease, {
      storeId,
    });
  },
});

/**
 * Demo — simulates payout confirmation for a pending demo payout.
 * Calls confirmPayout directly without Moneroo webhook.
 */
export const simulatePayout = action({
  args: { payoutId: v.id("payouts") },
  handler: async (ctx, { payoutId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");
    await ctx.runMutation(internal.demo.mutations.forcePayoutConfirmed, {
      payoutId,
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
