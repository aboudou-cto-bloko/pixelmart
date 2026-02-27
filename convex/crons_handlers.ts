// filepath: convex/crons_handlers.ts

import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

// ─── Balance Release ─────────────────────────────────────────

/**
 * Règle F-03 : Balance credited when order.status = 'delivered'
 * AND delivered_at > 48h.
 *
 * Transfère pending_balance → balance pour les commandes éligibles.
 */
export const releaseBalances = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - FORTY_EIGHT_HOURS_MS;

    // Chercher toutes les commandes delivered avec delivered_at > 48h
    // qui n'ont pas encore été "released" (pas de transaction credit pour cette commande)
    const deliveredOrders = await ctx.db
      .query("orders")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "delivered"),
          q.eq(q.field("payment_status"), "paid"),
        ),
      )
      .collect();

    const eligibleOrders = deliveredOrders.filter(
      (order) => order.delivered_at && order.delivered_at <= cutoff,
    );

    let releasedCount = 0;

    for (const order of eligibleOrders) {
      // Vérifier qu'on n'a pas déjà release cette commande
      const existingRelease = await ctx.db
        .query("transactions")
        .withIndex("by_order", (q) => q.eq("order_id", order._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "credit"),
            q.eq(
              q.field("description"),
              `Release commande ${order.order_number}`,
            ),
          ),
        )
        .first();

      if (existingRelease) continue;

      const store = await ctx.db.get(order.store_id);
      if (!store) continue;

      const netAmount = order.total_amount - (order.commission_amount ?? 0);

      // F-01 : Transaction de release
      const balanceBefore = store.balance;
      const balanceAfter = balanceBefore + netAmount;

      await ctx.db.insert("transactions", {
        store_id: store._id,
        order_id: order._id,
        type: "credit",
        direction: "credit",
        amount: netAmount,
        currency: order.currency,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        status: "completed",
        description: `Release commande ${order.order_number}`,
        processed_at: Date.now(),
      });

      // Transférer : pending_balance → balance
      const newPending = Math.max(0, store.pending_balance - netAmount);

      await ctx.db.patch(store._id, {
        balance: balanceAfter,
        pending_balance: newPending,
        updated_at: Date.now(),
      });

      releasedCount++;
    }

    return { releasedCount };
  },
});

// ─── Low Stock Alerts ────────────────────────────────────────

/**
 * Vérifie les produits dont le stock est <= low_stock_threshold
 * et envoie une notification au vendeur (email + in-app).
 * Évite les doublons : ne notifie pas si une notif low_stock
 * a été envoyée dans les dernières 24h pour ce produit.
 */
export const checkLowStock = internalMutation({
  args: {},
  handler: async (ctx) => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Tous les produits actifs qui track l'inventaire
    const products = await ctx.db
      .query("products")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("track_inventory"), true),
        ),
      )
      .collect();

    let alertCount = 0;

    for (const product of products) {
      const threshold = product.low_stock_threshold ?? 5;

      if (product.quantity > threshold) continue;

      // Éviter les doublons : vérifier les notifs récentes
      const store = await ctx.db.get(product.store_id);
      if (!store) continue;

      const vendor = await ctx.db.get(store.owner_id);
      if (!vendor) continue;

      // Chercher si une notif low_stock a été envoyée récemment pour ce produit
      const recentNotif = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("user_id", vendor._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "low_stock"),
            q.gte(q.field("_creationTime"), twentyFourHoursAgo),
          ),
        )
        .collect();

      // Vérifier que la notif concerne bien CE produit (via le body)
      const alreadyNotified = recentNotif.some((n) =>
        n.body.includes(product.title),
      );

      if (alreadyNotified) continue;

      // Notifier
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.notifyLowStock,
        {
          vendorUserId: vendor._id,
          vendorEmail: vendor.email,
          productTitle: product.title,
          currentQuantity: product.quantity,
          threshold,
          storeName: store.name,
        },
      );

      alertCount++;
    }

    return { alertCount };
  },
});

// ─── Stale Payout Check ──────────────────────────────────────

/**
 * Vérifie les payouts "processing" depuis > 72h.
 * Appelle Moneroo verify pour obtenir le statut réel.
 */
export const checkStalePayouts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - SEVENTY_TWO_HOURS_MS;

    const stalePayouts = await ctx.db
      .query("payouts")
      .withIndex("by_status_only", (q) => q.eq("status", "processing"))
      .collect();

    const overdue = stalePayouts.filter((p) => p.requested_at <= cutoff);

    let checkedCount = 0;

    for (const payout of overdue) {
      if (!payout.reference) {
        // Pas de référence Moneroo → fail directement
        await ctx.scheduler.runAfter(0, internal.payouts.mutations.failPayout, {
          payoutId: payout._id,
          reason: "Timeout: pas de référence Moneroo après 72h",
        });
      } else {
        // Vérifier via Moneroo API
        await ctx.scheduler.runAfter(0, internal.payouts.actions.verifyPayout, {
          payoutId: payout._id,
          monerooPayoutId: payout.reference,
        });
      }

      checkedCount++;
    }

    return { checkedCount };
  },
});
