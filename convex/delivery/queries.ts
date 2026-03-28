// filepath: convex/delivery/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { getVendorStore, requireAgent } from "../users/helpers";

/**
 * Liste les commandes prêtes pour livraison (vendeur).
 * Groupées par proximité géographique.
 */
export const listReadyForDelivery = query({
  args: {},
  handler: async (ctx) => {
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

      return eligibleStatus && notInBatch && paymentOk;
    });

    // Récupérer les articles en stock à l'entrepôt pour cette boutique
    const inStockRequests = await ctx.db
      .query("storage_requests")
      .withIndex("by_store_status", (q) =>
        q.eq("store_id", store._id).eq("status", "in_stock"),
      )
      .collect();

    const inStockByProductId = new Map(
      inStockRequests
        .filter((r) => r.product_id != null)
        .map((r) => [r.product_id!.toString(), r.storage_code]),
    );

    // Enrichir avec les infos client
    return Promise.all(
      eligibleOrders.map(async (order) => {
        const customer = await ctx.db.get(order.customer_id);
        const zoneName = order.shipping_address.city || "Zone non définie";

        // Détecter les items dont le produit est en stock à l'entrepôt
        const warehouseCodes: string[] = [];
        for (const item of order.items) {
          const code = inStockByProductId.get(item.product_id.toString());
          if (code) warehouseCodes.push(code);
        }

        return {
          ...order,
          customer_name: customer?.name ?? "Client",
          customer_phone: customer?.phone ?? order.shipping_address.phone,
          zone_name: zoneName,
          distance_km: order.delivery_distance_km ?? 0,
          has_warehouse_items: warehouseCodes.length > 0,
          warehouse_storage_codes: warehouseCodes,
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

    // Enrichir avec le nom de zone (première commande du lot)
    return Promise.all(
      batches.map(async (batch) => {
        // Récupérer la première commande pour avoir la zone
        let zoneName: string | undefined;
        if (batch.order_ids.length > 0) {
          const firstOrder = await ctx.db.get(batch.order_ids[0]);
          if (firstOrder) {
            zoneName = firstOrder.shipping_address.city;
          }
        }

        return {
          ...batch,
          zone_name: zoneName,
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

    // Récupérer toutes les commandes du lot
    const orders = await Promise.all(
      batch.order_ids.map(async (orderId) => {
        const order = await ctx.db.get(orderId);
        if (!order) return null;

        const customer = await ctx.db.get(order.customer_id);

        return {
          ...order,
          customer_name: customer?.name ?? "Client",
          customer_phone: customer?.phone ?? order.shipping_address.phone,
          zone_name: order.shipping_address.city ?? "Non définie",
          distance_km: order.delivery_distance_km ?? 0,
        };
      }),
    );

    // Déterminer la zone principale du lot
    const validOrders = orders.filter(Boolean);
    const zoneName =
      validOrders.length > 0
        ? validOrders[0]?.shipping_address?.city
        : undefined;

    // Calculer le total à collecter (COD)
    const totalToCollect = validOrders
      .filter((o) => o?.payment_mode === "cod")
      .reduce((sum, o) => sum + (o?.total_amount ?? 0), 0);

    return {
      ...batch,
      zone_name: zoneName,
      orders: validOrders,
      total_to_collect: totalToCollect,
      // Infos store pour le PDF
      store_name: store.name,
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
 * Compteurs de commandes par ville/zone (pour regroupement visuel).
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

    // Grouper par ville (shipping_address.city)
    const countByCity = new Map<string, number>();

    for (const order of readyOrders) {
      const city = order.shipping_address.city || "Zone non définie";
      const current = countByCity.get(city) ?? 0;
      countByCity.set(city, current + 1);
    }

    // Convertir en array
    const result = Array.from(countByCity.entries())
      .map(([city, count]) => ({
        zoneId: city, // Utiliser le nom de la ville comme ID
        zoneName: city,
        count,
      }))
      .filter((z) => z.count > 0)
      .sort((a, b) => b.count - a.count); // Trier par nombre décroissant

    return result;
  },
});

/**
 * Lots entrepôt à préparer — pour l'agent.
 * Retourne les lots is_warehouse_batch=true en statut assigned ou in_progress.
 */
export const listWarehouseBatchesForAgent = query({
  args: {},
  handler: async (ctx) => {
    await requireAgent(ctx);

    const allBatches = await ctx.db
      .query("delivery_batches")
      .filter((q) => q.eq(q.field("is_warehouse_batch"), true))
      .collect();

    const active = allBatches.filter(
      (b) =>
        b.status === "transmitted" ||
        b.status === "assigned" ||
        b.status === "in_progress",
    );

    return Promise.all(
      active.map(async (batch) => {
        const store = await ctx.db.get(batch.store_id);

        // Récupérer les commandes et leurs codes de stockage
        const orders = await Promise.all(
          batch.order_ids.map((id) => ctx.db.get(id)),
        );
        const validOrders = orders.filter(Boolean);

        // Collecter les codes de stockage de tous les items
        const storageCodes = new Set<string>();
        for (const order of validOrders) {
          if (!order) continue;
          for (const item of order.items) {
            if (item.storage_code) storageCodes.add(item.storage_code);
          }
        }

        return {
          ...batch,
          store_name: store?.name ?? "—",
          storage_codes: [...storageCodes],
          orders: validOrders.map((o) => ({
            _id: o!._id,
            order_number: o!.order_number,
            customer_name: o!.shipping_address.full_name,
            items: o!.items,
            total_amount: o!.total_amount,
            payment_mode: o!.payment_mode,
          })),
        };
      }),
    );
  },
});
