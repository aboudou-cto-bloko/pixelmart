// filepath: convex/orders/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser } from "../users/helpers";
import { getVendorStore, requireAdmin } from "../users/helpers";

/**
 * Détail d'une commande (customer, vendor ou admin).
 */
export const getById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    // Vérifier l'accès
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

    if (!isCustomer && !isVendor && !isAdmin) return null;

    // Enrichir avec les noms
    const store = await ctx.db.get(order.store_id);
    const customer = await ctx.db.get(order.customer_id);

    return {
      ...order,
      store_name: store?.name ?? "Boutique supprimée",
      store_slug: store?.slug ?? "",
      customer_name: customer?.name ?? "Utilisateur supprimé",
      customer_email: customer?.email ?? "",
    };
  },
});

/**
 * Commande par numéro (PM-2026-0001).
 */
export const getByOrderNumber = query({
  args: { orderNumber: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_number", (q) =>
        q.eq("order_number", args.orderNumber),
      )
      .unique();

    if (!order) return null;

    // Même vérification d'accès
    const isCustomer = order.customer_id === user._id;
    const isAdmin = user.role === "admin";
    if (!isCustomer && !isAdmin) return null;

    return order;
  },
});

/**
 * Commandes du client connecté.
 */
export const listByCustomer = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("processing"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("cancelled"),
        v.literal("refunded"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const limit = args.limit ?? 20;

    let ordersQuery = ctx.db
      .query("orders")
      .withIndex("by_customer", (q) => q.eq("customer_id", user._id))
      .order("desc");

    const orders = await ordersQuery.take(limit);

    // Filtrer par statut si spécifié
    const filtered = args.status
      ? orders.filter((o) => o.status === args.status)
      : orders;

    // Enrichir avec le nom de la boutique
    const enriched = await Promise.all(
      filtered.map(async (order) => {
        const store = await ctx.db.get(order.store_id);
        return {
          ...order,
          store_name: store?.name ?? "Boutique supprimée",
          store_slug: store?.slug ?? "",
        };
      }),
    );

    return enriched;
  },
});

/**
 * Commandes de la boutique du vendor connecté.
 */
export const listByStore = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("processing"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("cancelled"),
        v.literal("refunded"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);
    const limit = args.limit ?? 50;

    // Utiliser l'index composé by_status si statut spécifié
    let orders;
    if (args.status) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) =>
          q.eq("store_id", store._id).eq("status", args.status!),
        )
        .order("desc")
        .take(limit);
    } else {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_store", (q) => q.eq("store_id", store._id))
        .order("desc")
        .take(limit);
    }

    // Enrichir avec le nom client
    const enriched = await Promise.all(
      orders.map(async (order) => {
        const customer = await ctx.db.get(order.customer_id);
        return {
          ...order,
          customer_name: customer?.name ?? "Utilisateur supprimé",
          customer_email: customer?.email ?? "",
        };
      }),
    );

    return enriched;
  },
});

/**
 * Stats rapides pour le dashboard vendor.
 */
export const getStoreOrderStats = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    const allOrders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const pending = allOrders.filter((o) => o.status === "pending").length;
    const paid = allOrders.filter((o) => o.status === "paid").length;
    const processing = allOrders.filter(
      (o) => o.status === "processing",
    ).length;
    const shipped = allOrders.filter((o) => o.status === "shipped").length;
    const delivered = allOrders.filter((o) => o.status === "delivered").length;

    const totalRevenue = allOrders
      .filter((o) => o.payment_status === "paid")
      .reduce((sum, o) => sum + o.total_amount, 0);

    return {
      pending,
      paid,
      processing,
      shipped,
      delivered,
      total: allOrders.length,
      totalRevenue,
    };
  },
});
