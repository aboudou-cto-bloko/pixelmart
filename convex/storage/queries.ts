// filepath: convex/storage/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { getVendorStore, requireAgent, requireAdmin } from "../users/helpers";
import { getOutstandingDebt } from "./helpers";

// ─── Vendor — liste ses demandes ─────────────────────────────

export const getByStore = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending_drop_off"),
        v.literal("received"),
        v.literal("in_stock"),
        v.literal("rejected"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const requests = args.status
      ? await ctx.db
          .query("storage_requests")
          .withIndex("by_store_status", (q) =>
            q.eq("store_id", store._id).eq("status", args.status!),
          )
          .order("desc")
          .collect()
      : await ctx.db
          .query("storage_requests")
          .withIndex("by_store", (q) => q.eq("store_id", store._id))
          .order("desc")
          .collect();

    return requests;
  },
});

// ─── Vendor — stats rapides pour le dashboard ────────────────

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    const allRequests = await ctx.db
      .query("storage_requests")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const inStock = allRequests.filter((r) => r.status === "in_stock");
    const pending = allRequests.filter(
      (r) => r.status === "pending_drop_off" || r.status === "received",
    );

    const outstandingDebt = await getOutstandingDebt(ctx, store._id);

    const unpaidInvoices = await ctx.db
      .query("storage_invoices")
      .withIndex("by_status", (q) =>
        q.eq("store_id", store._id).eq("status", "unpaid"),
      )
      .collect();

    return {
      in_stock_count: inStock.length,
      pending_count: pending.length,
      outstanding_debt: outstandingDebt, // centimes
      unpaid_invoices_count: unpaidInvoices.length,
    };
  },
});

// ─── Agent — recherche par code ──────────────────────────────

export const getByCode = query({
  args: { storage_code: v.string() },
  handler: async (ctx, args) => {
    await requireAgent(ctx);

    const request = await ctx.db
      .query("storage_requests")
      .withIndex("by_code", (q) =>
        q.eq("storage_code", args.storage_code.toUpperCase()),
      )
      .unique();

    if (!request) return null;

    // Dénormaliser les infos du store pour l'affichage agent
    const store = await ctx.db.get(request.store_id);

    return {
      ...request,
      store_name: store?.name ?? "Boutique inconnue",
    };
  },
});

// ─── Agent / Admin — liste toutes les demandes reçues ────────

export const getPendingValidation = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    return await ctx.db
      .query("storage_requests")
      .withIndex("by_status", (q) => q.eq("status", "received"))
      .order("asc")
      .collect();
  },
});

// ─── Agent — liste toutes les demandes (pipeline) ────────────

export const listAllForAgent = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending_drop_off"),
        v.literal("received"),
        v.literal("in_stock"),
        v.literal("rejected"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireAgent(ctx);

    const requests = args.status
      ? await ctx.db
          .query("storage_requests")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .collect()
      : await ctx.db.query("storage_requests").order("desc").collect();

    return await Promise.all(
      requests.map(async (r) => {
        const store = await ctx.db.get(r.store_id);
        return {
          _id: r._id,
          storage_code: r.storage_code,
          product_name: r.product_name,
          status: r.status,
          estimated_qty: r.estimated_qty,
          actual_qty: r.actual_qty,
          actual_weight_kg: r.actual_weight_kg,
          measurement_type: r.measurement_type,
          created_at: r.created_at,
          store_name: store?.name ?? "Boutique inconnue",
        };
      }),
    );
  },
});

// ─── Vendor — liste ses factures ─────────────────────────────

export const getInvoices = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("unpaid"),
        v.literal("paid"),
        v.literal("deducted_from_payout"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const invoices = args.status
      ? await ctx.db
          .query("storage_invoices")
          .withIndex("by_status", (q) =>
            q.eq("store_id", store._id).eq("status", args.status!),
          )
          .order("desc")
          .collect()
      : await ctx.db
          .query("storage_invoices")
          .withIndex("by_store", (q) => q.eq("store_id", store._id))
          .order("desc")
          .collect();

    // Enrichir avec le nom du produit depuis la demande
    const enriched = await Promise.all(
      invoices.map(async (invoice) => {
        const request = await ctx.db.get(invoice.request_id);
        return {
          ...invoice,
          product_name: request?.product_name ?? "—",
          storage_code: request?.storage_code ?? "—",
        };
      }),
    );

    return enriched;
  },
});

// ─── Vendor — dette en cours ─────────────────────────────────

export const getDebt = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    const debts = await ctx.db
      .query("storage_debt")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .order("desc")
      .collect();

    const totalOutstanding = debts
      .filter((d) => d.settled_at === undefined)
      .reduce((sum, d) => sum + d.amount, 0);

    return { debts, totalOutstanding };
  },
});

// ─── Vendor — items en stock avec nb commandes en attente ────

/**
 * Retourne les items in_stock avec le nombre de commandes éligibles
 * dont au moins un article correspond au produit stocké.
 * Permet au vendeur de visualiser les opportunités d'expédition entrepôt.
 */
export const getInStockWithPendingOrders = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    const inStockRequests = await ctx.db
      .query("storage_requests")
      .withIndex("by_store_status", (q) =>
        q.eq("store_id", store._id).eq("status", "in_stock"),
      )
      .order("desc")
      .collect();

    if (inStockRequests.length === 0) return [];

    // Toutes les commandes éligibles (sans lot, payées)
    const allOrders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const eligibleOrders = allOrders.filter(
      (o) =>
        (o.status === "processing" || o.status === "ready_for_delivery") &&
        !o.batch_id &&
        (o.payment_status === "paid" || o.payment_mode === "cod"),
    );

    return inStockRequests.map((req) => {
      const pendingCount = req.product_id
        ? eligibleOrders.filter((o) =>
            o.items.some((item) => item.product_id === req.product_id),
          ).length
        : 0;

      return {
        _id: req._id,
        storage_code: req.storage_code,
        product_id: req.product_id,
        product_name: req.product_name,
        actual_qty: req.actual_qty,
        actual_weight_kg: req.actual_weight_kg,
        measurement_type: req.measurement_type,
        storage_fee: req.storage_fee,
        validated_at: req.validated_at,
        pending_orders_count: pendingCount,
      };
    });
  },
});
