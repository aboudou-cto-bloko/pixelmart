// filepath: convex/orders/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser, getVendorStore } from "../users/helpers";
import { resolveImageUrls, resolveImageUrl } from "../products/helpers";

/**
 * Détail d'une commande (customer, vendor ou admin).
 */
export const getById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

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

    const isCustomer = order.customer_id === user._id;
    const isAdmin = user.role === "admin";
    if (!isCustomer && !isAdmin) return null;

    const store = await ctx.db.get(order.store_id);

    return {
      ...order,
      store_name: store?.name ?? "Boutique supprimée",
      store_slug: store?.slug ?? "",
    };
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

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_customer", (q) => q.eq("customer_id", user._id))
      .order("desc")
      .take(limit);

    const filtered = args.status
      ? orders.filter((o) => o.status === args.status)
      : orders;

    return Promise.all(
      filtered.map(async (order) => {
        const store = await ctx.db.get(order.store_id);
        return {
          ...order,
          store_name: store?.name ?? "Boutique supprimée",
          store_slug: store?.slug ?? "",
        };
      }),
    );
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

    return Promise.all(
      orders.map(async (order) => {
        const customer = await ctx.db.get(order.customer_id);
        return {
          ...order,
          customer_name: customer?.name ?? "Utilisateur supprimé",
          customer_email: customer?.email ?? "",
        };
      }),
    );
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

    const countByStatus = (status: Doc<"orders">["status"]) =>
      allOrders.filter((o) => o.status === status).length;

    const totalRevenue = allOrders
      .filter((o) => o.payment_status === "paid")
      .reduce((sum, o) => sum + o.total_amount, 0);

    return {
      pending: countByStatus("pending"),
      paid: countByStatus("paid"),
      processing: countByStatus("processing"),
      shipped: countByStatus("shipped"),
      delivered: countByStatus("delivered"),
      total: allOrders.length,
      totalRevenue,
    };
  },
});

/**
 * Détail complet d'une commande pour la page vendor.
 * Inclut les URLs d'images résolues, les infos client complètes,
 * et les données de tracking.
 */
export const getOrderDetail = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    if (order.store_id !== store._id) return null;

    const customer = await ctx.db.get(order.customer_id);

    // Résoudre les images des items
    const itemsWithImages = await Promise.all(
      order.items.map(async (item) => {
        const imageUrl = await resolveImageUrl(ctx, item.image_url);
        return { ...item, resolved_image_url: imageUrl };
      }),
    );

    return {
      ...order,
      items: itemsWithImages,
      customer: customer
        ? {
            _id: customer._id,
            name: customer.name,
            email: customer.email,
            avatar_url: customer.avatar_url,
          }
        : null,
      store_name: store.name,
    };
  },
});

/**
 * Compteurs par statut pour les tabs de la liste commandes.
 */
export const getStatusCounts = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    const allOrders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const counts: Record<string, number> = {
      all: allOrders.length,
      pending: 0,
      paid: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
    };

    for (const order of allOrders) {
      counts[order.status] = (counts[order.status] ?? 0) + 1;
    }

    return counts;
  },
});

// Type import pour countByStatus
import type { Doc } from "../_generated/dataModel";
