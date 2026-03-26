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
