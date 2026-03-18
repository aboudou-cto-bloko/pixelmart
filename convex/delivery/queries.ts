// filepath: convex/delivery/queries.ts

import { query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { v } from "convex/values";
import { getVendorStore } from "../users/helpers";

/**
 * Liste les zones de livraison actives.
 */
export const listZones = query({
  args: {
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let zones;

    if (args.city) {
      zones = await ctx.db
        .query("delivery_zones")
        .withIndex("by_city", (q) =>
          q.eq("city", args.city!).eq("is_active", true),
        )
        .collect();
    } else {
      zones = await ctx.db
        .query("delivery_zones")
        .withIndex("by_active", (q) => q.eq("is_active", true))
        .collect();
    }

    return zones.sort((a, b) => a.sort_order - b.sort_order);
  },
});

/**
 * Récupère une zone par son slug.
 */
export const getZoneBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("delivery_zones")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

/**
 * Liste les commandes prêtes pour livraison (vendeur).
 */
export const listReadyForDelivery = query({
  args: {
    zoneId: v.optional(v.id("delivery_zones")),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    // Récupérer les commandes prêtes ou en préparation, sans lot assigné
    const allOrders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const eligibleOrders = allOrders.filter((order) => {
      const eligibleStatus =
        order.status === "processing" || order.status === "ready_for_delivery";
      const notInBatch = !order.batch_id;
      const paymentOk =
        order.payment_status === "paid" || order.payment_mode === "cod";
      const zoneMatch = args.zoneId
        ? order.delivery_zone_id === args.zoneId
        : true;

      return eligibleStatus && notInBatch && paymentOk && zoneMatch;
    });

    // Enrichir avec les infos client et zone
    return Promise.all(
      eligibleOrders.map(async (order) => {
        const customer = await ctx.db.get(order.customer_id);
        const zone = order.delivery_zone_id
          ? await ctx.db.get(order.delivery_zone_id)
          : null;

        return {
          ...order,
          customer_name: customer?.name ?? "Client",
          customer_phone: customer?.phone ?? order.shipping_address.phone,
          zone_name: zone?.name ?? "Zone non définie",
        };
      }),
    );
  },
});

/**
 * Liste les lots de livraison du vendeur.
 */
export const listBatches = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("transmitted"),
        v.literal("assigned"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);
    const limit = args.limit ?? 50;

    let batches;

    if (args.status) {
      batches = await ctx.db
        .query("delivery_batches")
        .withIndex("by_store_status", (q) =>
          q.eq("store_id", store._id).eq("status", args.status!),
        )
        .order("desc")
        .take(limit);
    } else {
      batches = await ctx.db
        .query("delivery_batches")
        .withIndex("by_store", (q) => q.eq("store_id", store._id))
        .order("desc")
        .take(limit);
    }

    // Enrichir avec zone et premier order number pour preview
    return Promise.all(
      batches.map(async (batch) => {
        const zone = batch.delivery_zone_id
          ? await ctx.db.get(batch.delivery_zone_id)
          : null;

        return {
          ...batch,
          zone_name: zone?.name,
        };
      }),
    );
  },
});

/**
 * Détail d'un lot avec toutes ses commandes.
 */
export const getBatchDetail = query({
  args: { batchId: v.id("delivery_batches") },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const batch = await ctx.db.get(args.batchId);
    if (!batch) return null;
    if (batch.store_id !== store._id) return null;

    const zone = batch.delivery_zone_id
      ? await ctx.db.get(batch.delivery_zone_id)
      : null;

    // Récupérer toutes les commandes du lot
    const orders = await Promise.all(
      batch.order_ids.map(async (orderId) => {
        const order = await ctx.db.get(orderId);
        if (!order) return null;

        const customer = await ctx.db.get(order.customer_id);
        const orderZone = order.delivery_zone_id
          ? await ctx.db.get(order.delivery_zone_id)
          : null;

        return {
          ...order,
          customer_name: customer?.name ?? "Client",
          customer_phone: customer?.phone ?? order.shipping_address.phone,
          zone_name: orderZone?.name ?? "Non définie",
        };
      }),
    );

    return {
      ...batch,
      zone_name: zone?.name,
      orders: orders.filter(Boolean),
    };
  },
});

/**
 * Statistiques livraison pour le dashboard vendeur.
 */
export const getDeliveryStats = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    const allBatches = await ctx.db
      .query("delivery_batches")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const allOrders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const readyOrders = allOrders.filter(
      (o) =>
        (o.status === "processing" || o.status === "ready_for_delivery") &&
        !o.batch_id &&
        (o.payment_status === "paid" || o.payment_mode === "cod"),
    );

    return {
      pendingBatches: allBatches.filter((b) => b.status === "pending").length,
      transmittedBatches: allBatches.filter((b) => b.status === "transmitted")
        .length,
      inProgressBatches: allBatches.filter((b) => b.status === "in_progress")
        .length,
      completedBatches: allBatches.filter((b) => b.status === "completed")
        .length,
      readyForDeliveryCount: readyOrders.length,
      totalDeliveryFees: allBatches
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + b.total_delivery_fee, 0),
    };
  },
});

/**
 * Compteurs de commandes par zone (pour regroupement).
 */
export const getOrderCountByZone = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    const eligibleOrders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const readyOrders = eligibleOrders.filter(
      (o) =>
        (o.status === "processing" || o.status === "ready_for_delivery") &&
        !o.batch_id &&
        (o.payment_status === "paid" || o.payment_mode === "cod"),
    );

    // Grouper par zone
    const countByZone = new Map<string, number>();
    let noZoneCount = 0;

    for (const order of readyOrders) {
      if (order.delivery_zone_id) {
        const current = countByZone.get(order.delivery_zone_id) ?? 0;
        countByZone.set(order.delivery_zone_id, current + 1);
      } else {
        noZoneCount++;
      }
    }

    // Enrichir avec les noms de zones
    const zones = await ctx.db
      .query("delivery_zones")
      .withIndex("by_active", (q) => q.eq("is_active", true))
      .collect();

    const result = zones
      .map((zone) => ({
        zoneId: zone._id,
        zoneName: zone.name,
        count: countByZone.get(zone._id) ?? 0,
      }))
      .filter((z) => z.count > 0);

    if (noZoneCount > 0) {
      result.push({
        zoneId: "unknown" as Id<"delivery_zones">,
        zoneName: "Zone non définie",
        count: noZoneCount,
      });
    }

    return result;
  },
});
