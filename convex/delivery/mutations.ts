// filepath: convex/delivery/mutations.ts

import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { requireAppUser, getVendorStore, requireAdmin } from "../users/helpers";
import {
  getNextBatchNumber,
  validateOrdersOwnership,
  validateOrdersForBatch,
  calculateBatchTotalFee,
} from "./helpers";
import { calculateDeliveryFee } from "./constants";
import { DEFAULT_CURRENCY } from "../lib/constants";

// ─── Zones Management (Admin) ────────────────────────────────

/**
 * Créer une zone de livraison (admin).
 */
export const createZone = mutation({
  args: {
    name: v.string(),
    city: v.string(),
    country: v.string(),
    defaultDistanceKm: v.number(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Générer le slug
    const slug = args.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Vérifier l'unicité du slug
    const existing = await ctx.db
      .query("delivery_zones")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (existing) {
      throw new Error(`Une zone avec le slug "${slug}" existe déjà`);
    }

    // Trouver le prochain sort_order
    const lastZone = await ctx.db.query("delivery_zones").order("desc").first();
    const sortOrder = (lastZone?.sort_order ?? 0) + 1;

    const zoneId = await ctx.db.insert("delivery_zones", {
      name: args.name,
      slug,
      city: args.city,
      country: args.country,
      default_distance_km: args.defaultDistanceKm,
      latitude: args.latitude,
      longitude: args.longitude,
      is_active: true,
      sort_order: sortOrder,
      updated_at: Date.now(),
    });

    return { zoneId, slug };
  },
});

/**
 * Mettre à jour une zone (admin).
 */
export const updateZone = mutation({
  args: {
    zoneId: v.id("delivery_zones"),
    name: v.optional(v.string()),
    defaultDistanceKm: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const zone = await ctx.db.get(args.zoneId);
    if (!zone) throw new Error("Zone introuvable");

    const updates: Record<string, unknown> = {
      updated_at: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.defaultDistanceKm !== undefined)
      updates.default_distance_km = args.defaultDistanceKm;
    if (args.isActive !== undefined) updates.is_active = args.isActive;
    if (args.sortOrder !== undefined) updates.sort_order = args.sortOrder;

    await ctx.db.patch(args.zoneId, updates);

    return { success: true };
  },
});

// ─── Order Delivery Setup ────────────────────────────────────

/**
 * Configurer la livraison d'une commande (au checkout ou après).
 */
export const setOrderDelivery = mutation({
  args: {
    orderId: v.id("orders"),
    zoneId: v.id("delivery_zones"),
    deliveryType: v.union(
      v.literal("standard"),
      v.literal("urgent"),
      v.literal("fragile"),
    ),
    paymentMode: v.union(v.literal("online"), v.literal("cod")),
    estimatedWeightKg: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");

    // Vérifier que c'est le client ou le vendeur
    const isCustomer = order.customer_id === user._id;
    let isVendor = false;
    if (user.role === "vendor") {
      const store = await ctx.db
        .query("stores")
        .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
        .first();
      isVendor = store?._id === order.store_id;
    }

    if (!isCustomer && !isVendor && user.role !== "admin") {
      throw new Error("Non autorisé à modifier cette commande");
    }

    // Récupérer la zone pour le calcul
    const zone = await ctx.db.get(args.zoneId);
    if (!zone || !zone.is_active) {
      throw new Error("Zone de livraison invalide ou inactive");
    }

    // Calculer les frais de livraison
    const deliveryFee = calculateDeliveryFee(
      zone.default_distance_km,
      args.deliveryType,
      args.estimatedWeightKg ?? 0,
    );

    await ctx.db.patch(args.orderId, {
      delivery_zone_id: args.zoneId,
      delivery_type: args.deliveryType,
      payment_mode: args.paymentMode,
      delivery_fee: deliveryFee,
      estimated_weight_kg: args.estimatedWeightKg,
      // Mettre à jour le shipping_amount si c'était à 0
      shipping_amount:
        order.shipping_amount === 0 ? deliveryFee : order.shipping_amount,
      // Recalculer le total si nécessaire
      total_amount:
        order.shipping_amount === 0
          ? order.subtotal - order.discount_amount + deliveryFee
          : order.total_amount,
      updated_at: Date.now(),
    });

    return {
      deliveryFee,
      zoneName: zone.name,
    };
  },
});

/**
 * Marquer une commande comme prête pour livraison (vendeur).
 */
export const markReadyForDelivery = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const { user, store } = await getVendorStore(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");
    if (order.store_id !== store._id) {
      throw new Error("Cette commande n'appartient pas à votre boutique");
    }

    if (order.status !== "processing") {
      throw new Error(
        "Seule une commande en préparation peut être marquée prête",
      );
    }

    await ctx.db.patch(args.orderId, {
      status: "ready_for_delivery",
      ready_for_delivery: true,
      ready_at: Date.now(),
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

// ─── Batch Management (Vendor) ───────────────────────────────

/**
 * Créer un lot de livraison.
 */
export const createBatch = mutation({
  args: {
    orderIds: v.array(v.id("orders")),
    groupingType: v.union(v.literal("zone"), v.literal("manual")),
    zoneId: v.optional(v.id("delivery_zones")),
  },
  handler: async (ctx, args) => {
    const { user, store } = await getVendorStore(ctx);

    if (args.orderIds.length === 0) {
      throw new Error("Sélectionnez au moins une commande");
    }

    // Valider que toutes les commandes appartiennent à cette boutique
    const orders = await validateOrdersOwnership(ctx, args.orderIds, store._id);

    // Valider l'éligibilité des commandes
    validateOrdersForBatch(orders);

    // Générer le numéro de lot
    const batchNumber = await getNextBatchNumber(ctx);

    // Calculer le total des frais
    const totalDeliveryFee = calculateBatchTotalFee(orders);

    // Créer le lot
    const batchId = await ctx.db.insert("delivery_batches", {
      batch_number: batchNumber,
      store_id: store._id,
      created_by: user._id,
      order_ids: args.orderIds,
      order_count: args.orderIds.length,
      grouping_type: args.groupingType,
      delivery_zone_id: args.zoneId,
      status: "pending",
      total_delivery_fee: totalDeliveryFee,
      currency: DEFAULT_CURRENCY,
      updated_at: Date.now(),
    });

    // Mettre à jour les commandes avec le batch_id
    for (const orderId of args.orderIds) {
      await ctx.db.patch(orderId, {
        batch_id: batchId,
        updated_at: Date.now(),
      });
    }

    return {
      batchId,
      batchNumber,
      orderCount: args.orderIds.length,
      totalDeliveryFee,
    };
  },
});

/**
 * Transmettre un lot à l'admin.
 */
export const transmitBatch = mutation({
  args: {
    batchId: v.id("delivery_batches"),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const batch = await ctx.db.get(args.batchId);
    if (!batch) throw new Error("Lot introuvable");
    if (batch.store_id !== store._id) {
      throw new Error("Ce lot n'appartient pas à votre boutique");
    }
    if (batch.status !== "pending") {
      throw new Error("Seul un lot en attente peut être transmis");
    }

    await ctx.db.patch(args.batchId, {
      status: "transmitted",
      transmitted_at: Date.now(),
      updated_at: Date.now(),
    });

    // TODO: Notification à l'admin

    return { success: true };
  },
});

/**
 * Annuler un lot (vendeur, seulement si pending).
 */
export const cancelBatch = mutation({
  args: {
    batchId: v.id("delivery_batches"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const batch = await ctx.db.get(args.batchId);
    if (!batch) throw new Error("Lot introuvable");
    if (batch.store_id !== store._id) {
      throw new Error("Ce lot n'appartient pas à votre boutique");
    }
    if (batch.status !== "pending") {
      throw new Error("Seul un lot en attente peut être annulé");
    }

    // Retirer le batch_id des commandes
    for (const orderId of batch.order_ids) {
      await ctx.db.patch(orderId, {
        batch_id: undefined,
        updated_at: Date.now(),
      });
    }

    await ctx.db.patch(args.batchId, {
      status: "cancelled",
      admin_notes: args.reason,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

// ─── Seed Zones (Dev) ────────────────────────────────────────

/**
 * Seed les zones de livraison pour Cotonou.
 */
export const seedZones = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const zones = [
      { name: "Fidjrossè", city: "Cotonou", distance: 5 },
      { name: "Akpakpa", city: "Cotonou", distance: 7 },
      { name: "Cadjèhoun", city: "Cotonou", distance: 4 },
      { name: "Ganhi", city: "Cotonou", distance: 3 },
      { name: "Haie Vive", city: "Cotonou", distance: 6 },
      { name: "Agla", city: "Cotonou", distance: 8 },
      { name: "Godomey", city: "Abomey-Calavi", distance: 12 },
      { name: "Calavi Centre", city: "Abomey-Calavi", distance: 15 },
      { name: "Togbin", city: "Abomey-Calavi", distance: 18 },
    ];

    let created = 0;

    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];
      const slug = zone.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-");

      const existing = await ctx.db
        .query("delivery_zones")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();

      if (!existing) {
        await ctx.db.insert("delivery_zones", {
          name: zone.name,
          slug,
          city: zone.city,
          country: "BJ",
          default_distance_km: zone.distance,
          is_active: true,
          sort_order: i + 1,
          updated_at: Date.now(),
        });
        created++;
      }
    }

    return { created };
  },
});
