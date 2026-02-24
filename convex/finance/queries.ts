// filepath: convex/finance/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { getVendorStore } from "../users/helpers";
import {
  getPeriodBounds,
  timestampToDateKey,
  timestampToMonthKey,
  generateInvoiceNumber,
} from "./helpers";

// ─── Financial Overview ──────────────────────────────────────

/**
 * Vue d'ensemble financière pour le dashboard.
 * Retourne solde, pending, revenus, commissions, nombre de transactions.
 *
 * Note : total_revenue n'existe pas dans le schema stores,
 * on le calcule depuis la table transactions (somme des crédits complétés).
 */
export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    // Transactions complétées
    const allTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const completed = allTransactions.filter((t) => t.status === "completed");

    // Revenus = somme des crédits (ventes)
    const totalCredits = completed
      .filter((t) => t.direction === "credit")
      .reduce((sum, t) => sum + t.amount, 0);

    // Dépenses = somme des débits (commissions, payouts, fees, subscriptions)
    const totalDebits = completed
      .filter((t) => t.direction === "debit")
      .reduce((sum, t) => sum + t.amount, 0);

    // Commissions prélevées
    const totalCommissions = completed
      .filter((t) => t.type === "fee" && t.direction === "debit")
      .reduce((sum, t) => sum + t.amount, 0);

    // Payouts effectués
    const totalPayouts = completed
      .filter((t) => t.type === "payout" && t.direction === "debit")
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculs période 30 derniers jours
    const thirtyDaysAgo = Date.now() - 30 * 86_400_000;
    const last30 = completed.filter((t) => t._creationTime >= thirtyDaysAgo);

    const revenue30d = last30
      .filter((t) => t.direction === "credit")
      .reduce((sum, t) => sum + t.amount, 0);

    const commissions30d = last30
      .filter((t) => t.type === "fee" && t.direction === "debit")
      .reduce((sum, t) => sum + t.amount, 0);

    // Période précédente (30-60 jours) pour trend
    const sixtyDaysAgo = Date.now() - 60 * 86_400_000;
    const prev30 = completed.filter(
      (t) => t._creationTime >= sixtyDaysAgo && t._creationTime < thirtyDaysAgo,
    );

    const revenuePrev30d = prev30
      .filter((t) => t.direction === "credit")
      .reduce((sum, t) => sum + t.amount, 0);

    // Trend en %
    const revenueTrend =
      revenuePrev30d > 0
        ? Math.round(((revenue30d - revenuePrev30d) / revenuePrev30d) * 100)
        : revenue30d > 0
          ? 100
          : 0;

    return {
      // ── Champs schema stores ──
      balance: store.balance,
      pendingBalance: store.pending_balance,
      currency: store.currency, // ✅ corrigé (était default_currency)
      subscriptionTier: store.subscription_tier,
      commissionRate: store.commission_rate,

      // ── Calculés depuis transactions ──
      totalRevenue: totalCredits, // ✅ corrigé (était store.total_revenue)
      totalCredits,
      totalDebits,
      totalCommissions,
      totalPayouts,
      netRevenue: totalCredits - totalDebits,
      revenue30d,
      commissions30d,
      revenueTrend,
      transactionCount: allTransactions.length,
    };
  },
});

// ─── Transaction List ────────────────────────────────────────

/**
 * Liste paginée des transactions avec filtres.
 */
export const listTransactions = query({
  args: {
    type: v.optional(
      v.union(
        v.literal("sale"),
        v.literal("refund"),
        v.literal("payout"),
        v.literal("fee"),
        v.literal("credit"),
        v.literal("transfer"),
        v.literal("ad_payment"),
        v.literal("subscription"),
      ),
    ),
    period: v.optional(
      v.union(
        v.literal("7d"),
        v.literal("30d"),
        v.literal("90d"),
        v.literal("12m"),
        v.literal("all"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);
    const limit = args.limit ?? 50;

    let transactions: Doc<"transactions">[];

    if (args.type) {
      transactions = await ctx.db
        .query("transactions")
        .withIndex("by_type", (q) =>
          q.eq("store_id", store._id).eq("type", args.type!),
        )
        .order("desc")
        .take(limit);
    } else {
      transactions = await ctx.db
        .query("transactions")
        .withIndex("by_store", (q) => q.eq("store_id", store._id))
        .order("desc")
        .take(limit);
    }

    // Filtre temporel
    if (args.period && args.period !== "all") {
      const { start } = getPeriodBounds(args.period);
      transactions = transactions.filter((t) => t._creationTime >= start);
    }

    // Enrichir avec les données commande si applicable
    return Promise.all(
      transactions.map(async (t) => {
        let orderNumber: string | undefined;
        if (t.order_id) {
          const order = await ctx.db.get(t.order_id);
          orderNumber = order?.order_number;
        }
        return {
          ...t,
          order_number: orderNumber,
        };
      }),
    );
  },
});

// ─── Revenue by Period (for chart) ───────────────────────────

/**
 * Revenus et commissions groupés par jour ou par mois.
 * Utilisé par le graphique Recharts du dashboard.
 */
export const getRevenueByPeriod = query({
  args: {
    period: v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("12m"),
    ),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);
    const { start } = getPeriodBounds(args.period);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const filtered = transactions.filter(
      (t) => t._creationTime >= start && t.status === "completed",
    );

    // Grouper par jour (≤90j) ou par mois (12m)
    const useMonths = args.period === "12m";
    const toKey = useMonths ? timestampToMonthKey : timestampToDateKey;

    const grouped = new Map<
      string,
      { revenue: number; commissions: number; orders: number }
    >();

    for (const t of filtered) {
      const key = toKey(t._creationTime);
      const entry = grouped.get(key) ?? {
        revenue: 0,
        commissions: 0,
        orders: 0,
      };

      if (t.type === "sale" && t.direction === "credit") {
        entry.revenue += t.amount;
        entry.orders += 1;
      }
      if (t.type === "fee" && t.direction === "debit") {
        entry.commissions += t.amount;
      }

      grouped.set(key, entry);
    }

    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        commissions: data.commissions,
        net: data.revenue - data.commissions,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

// ─── Margin Analysis ─────────────────────────────────────────

/**
 * Analyse des marges par produit.
 * cost_price est v.optional(v.number()) dans le schema products — OK.
 */
export const getMarginAnalysis = query({
  args: {
    period: v.optional(
      v.union(
        v.literal("7d"),
        v.literal("30d"),
        v.literal("90d"),
        v.literal("12m"),
        v.literal("all"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);
    const period = args.period ?? "30d";
    const { start } = getPeriodBounds(period);

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const relevantOrders = orders.filter(
      (o) =>
        o._creationTime >= start &&
        (o.status === "delivered" ||
          o.status === "paid" ||
          o.status === "processing" ||
          o.status === "shipped"),
    );

    // Agréger par produit
    const productMap = new Map<
      string,
      {
        productId: Id<"products">; // ✅ corrigé (était string)
        title: string;
        totalRevenue: number;
        totalQuantity: number;
        orderCount: number;
      }
    >();

    for (const order of relevantOrders) {
      for (const item of order.items) {
        const key = item.product_id as string;
        const entry = productMap.get(key) ?? {
          productId: item.product_id,
          title: item.title,
          totalRevenue: 0,
          totalQuantity: 0,
          orderCount: 0,
        };

        entry.totalRevenue += item.total_price;
        entry.totalQuantity += item.quantity;
        entry.orderCount += 1;
        productMap.set(key, entry);
      }
    }

    // Enrichir avec cost_price depuis la table products
    const results = await Promise.all(
      Array.from(productMap.values()).map(async (entry) => {
        const product = await ctx.db.get(entry.productId); // ✅ corrigé (était as any)
        const costPrice = product?.cost_price ?? 0;
        const totalCost = costPrice * entry.totalQuantity;

        const commissionRate = store.commission_rate;
        const commissionAmount = Math.round(
          (entry.totalRevenue * commissionRate) / 10000,
        );

        const netRevenue = entry.totalRevenue - commissionAmount - totalCost;
        const marginPercent =
          entry.totalRevenue > 0
            ? Math.round((netRevenue / entry.totalRevenue) * 100)
            : 0;

        return {
          productId: entry.productId as string,
          title: entry.title,
          totalRevenue: entry.totalRevenue,
          totalCost,
          commissionAmount,
          netRevenue,
          marginPercent,
          totalQuantity: entry.totalQuantity,
          orderCount: entry.orderCount,
        };
      }),
    );

    return results.sort((a, b) => b.totalRevenue - a.totalRevenue);
  },
});

// ─── Invoice Data ────────────────────────────────────────────

/**
 * Données facture : UNIQUEMENT ce qui existe dans le schema.
 *
 * Les informations vendeur (email, téléphone, adresse) sont
 * collectées via un formulaire dans l'UI et passées au PDF côté client.
 * Le backend ne retourne que les champs schema.
 */
export const getInvoiceData = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    if (order.store_id !== store._id) return null;

    const invoiceableStatuses = ["paid", "processing", "shipped", "delivered"];
    if (!invoiceableStatuses.includes(order.status)) return null;

    const customer = await ctx.db.get(order.customer_id);
    const invoiceNumber = generateInvoiceNumber(order.order_number);

    return {
      invoiceNumber,
      orderNumber: order.order_number,
      createdAt: order._creationTime,
      status: order.status,
      items: order.items,
      subtotal: order.subtotal,
      shippingAmount: order.shipping_amount,
      discountAmount: order.discount_amount,
      totalAmount: order.total_amount,
      commissionAmount: order.commission_amount ?? 0,
      currency: order.currency,
      couponCode: order.coupon_code,
      shippingAddress: order.shipping_address,
      // ── Store : uniquement champs schema ──
      store: {
        name: store.name,
        slug: store.slug,
        country: store.country,
        // contact_email, contact_phone, address, city
        // → collectés via formulaire UI côté client
      },
      customer: customer
        ? {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
          }
        : null,
    };
  },
});

// ─── Invoiceable Orders ──────────────────────────────────────

/**
 * Liste des commandes pouvant générer une facture.
 */
export const listInvoiceableOrders = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);
    const limit = args.limit ?? 50;

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .order("desc")
      .take(limit);

    const invoiceable = orders.filter((o) =>
      ["paid", "processing", "shipped", "delivered"].includes(o.status),
    );

    return Promise.all(
      invoiceable.map(async (order) => {
        const customer = await ctx.db.get(order.customer_id);
        return {
          _id: order._id,
          orderNumber: order.order_number,
          invoiceNumber: generateInvoiceNumber(order.order_number),
          status: order.status,
          totalAmount: order.total_amount,
          currency: order.currency,
          customerName: customer?.name ?? "Client supprimé",
          createdAt: order._creationTime,
          itemCount: order.items.length,
        };
      }),
    );
  },
});
