// filepath: convex/platform/commissions.ts

import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

// ─── Internal Mutations ─────────────────────────────────────

/**
 * Enregistre une commission perçue par la plateforme.
 * Appelé lors du paiement confirmé (online) ou de la libération de balance (COD).
 */
export const recordCommission = internalMutation({
  args: {
    orderId: v.id("orders"),
    storeId: v.id("stores"),
    commissionAmount: v.number(), // centimes
    commissionRate: v.number(), // basis points
    orderTotal: v.number(), // centimes
    paymentMode: v.union(v.literal("online"), v.literal("cod")),
    currency: v.string(),
    collectionTrigger: v.union(
      v.literal("payment_confirmed"),
      v.literal("balance_released"),
    ),
    description: v.string(),
    processedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Vérifier qu'on n'a pas déjà enregistré une commission pour cette commande
    const existingCommission = await ctx.db
      .query("platform_commissions")
      .withIndex("by_order", (q) => q.eq("order_id", args.orderId))
      .first();

    if (existingCommission) {
      throw new Error(
        `Commission déjà enregistrée pour la commande ${args.orderId}`,
      );
    }

    // Enregistrer la commission
    await ctx.db.insert("platform_commissions", {
      order_id: args.orderId,
      store_id: args.storeId,
      commission_amount: args.commissionAmount,
      commission_rate: args.commissionRate,
      order_total: args.orderTotal,
      payment_mode: args.paymentMode,
      currency: args.currency,
      collected_at: Date.now(),
      collection_trigger: args.collectionTrigger,
      description: args.description,
      processed_by: args.processedBy,
    });
  },
});

// ─── Internal Queries ──────────────────────────────────────

/**
 * Calcule les totaux de commissions par période pour l'admin dashboard.
 */
export const getCommissionStats = internalQuery({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    paymentMode: v.optional(v.union(v.literal("online"), v.literal("cod"))),
  },
  handler: async (ctx, args) => {
    const commissions = await ctx.db.query("platform_commissions").collect();

    // Filtres
    const filtered = commissions.filter((commission) => {
      if (args.startDate && commission.collected_at < args.startDate)
        return false;
      if (args.endDate && commission.collected_at > args.endDate) return false;
      if (args.paymentMode && commission.payment_mode !== args.paymentMode)
        return false;
      return true;
    });

    const totalCommissions = filtered.reduce(
      (sum, c) => sum + c.commission_amount,
      0,
    );
    const totalOrders = filtered.length;

    // Répartition par mode de paiement
    const byPaymentMode = {
      online: filtered.filter((c) => c.payment_mode === "online"),
      cod: filtered.filter((c) => c.payment_mode === "cod"),
    };

    const onlineTotal = byPaymentMode.online.reduce(
      (sum, c) => sum + c.commission_amount,
      0,
    );
    const codTotal = byPaymentMode.cod.reduce(
      (sum, c) => sum + c.commission_amount,
      0,
    );

    return {
      totalCommissions,
      totalOrders,
      breakdown: {
        online: {
          total: onlineTotal,
          orders: byPaymentMode.online.length,
          percentage:
            totalCommissions > 0 ? (onlineTotal / totalCommissions) * 100 : 0,
        },
        cod: {
          total: codTotal,
          orders: byPaymentMode.cod.length,
          percentage:
            totalCommissions > 0 ? (codTotal / totalCommissions) * 100 : 0,
        },
      },
    };
  },
});

/**
 * Liste les commissions avec pagination pour l'admin.
 */
export const listCommissions = internalQuery({
  args: {
    limit: v.optional(v.number()),
    paymentMode: v.optional(v.union(v.literal("online"), v.literal("cod"))),
    storeId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Filtrer par store si spécifié
    let commissions;
    if (args.storeId) {
      commissions = await ctx.db
        .query("platform_commissions")
        .withIndex("by_store", (q) => q.eq("store_id", args.storeId!))
        .order("desc")
        .take(limit);
    } else {
      commissions = await ctx.db
        .query("platform_commissions")
        .order("desc")
        .take(limit);
    }

    // Enrichir avec les détails order et store
    const enriched = await Promise.all(
      commissions.map(async (commission) => {
        const order = await ctx.db.get(commission.order_id);
        const store = await ctx.db.get(commission.store_id);

        return {
          ...commission,
          order_number: order ? order.order_number : undefined,
          store_name: store ? store.name : undefined,
        };
      }),
    );

    const filtered = args.paymentMode
      ? enriched.filter((c) => c.payment_mode === args.paymentMode)
      : enriched;

    return filtered;
  },
});
