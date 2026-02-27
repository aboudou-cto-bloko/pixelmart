// filepath: convex/returns/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser, getVendorStore } from "../users/helpers";
import { canRequestReturn } from "./helpers";

/**
 * Liste des retours pour une boutique (vue vendeur).
 * Filtrable par statut.
 */
export const listByStore = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);
    const limit = args.limit ?? 20;

    let q = ctx.db
      .query("return_requests")
      .withIndex("by_store", (q) => q.eq("store_id", store._id));

    if (args.status) {
      q = q.filter((qf) => qf.eq(qf.field("status"), args.status));
    }

    const returns = await q.order("desc").take(limit);

    // Enrichir avec les données client et commande
    const enriched = await Promise.all(
      returns.map(async (ret) => {
        const customer = await ctx.db.get(ret.customer_id);
        const order = await ctx.db.get(ret.order_id);
        return {
          ...ret,
          customer_name: customer?.name ?? "Client",
          customer_email: customer?.email ?? "",
          order_number: order?.order_number ?? "",
          order_total: order?.total_amount ?? 0,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Liste des retours pour un client (vue customer).
 */
export const listByCustomer = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const limit = args.limit ?? 20;

    const returns = await ctx.db
      .query("return_requests")
      .withIndex("by_customer", (q) => q.eq("customer_id", user._id))
      .order("desc")
      .take(limit);

    // Enrichir avec les données boutique et commande
    const enriched = await Promise.all(
      returns.map(async (ret) => {
        const store = await ctx.db.get(ret.store_id);
        const order = await ctx.db.get(ret.order_id);
        return {
          ...ret,
          store_name: store?.name ?? "Boutique",
          order_number: order?.order_number ?? "",
        };
      }),
    );

    return enriched;
  },
});

/**
 * Retours liés à une commande spécifique.
 */
export const getByOrder = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");

    // Vérifier que l'utilisateur est le client ou le vendeur
    const isCustomer = order.customer_id === user._id;
    let isVendor = false;
    if (user.role === "vendor") {
      const store = await ctx.db
        .query("stores")
        .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
        .first();
      isVendor = store?._id === order.store_id;
    }
    const isAdmin = user.role === "admin";

    if (!isCustomer && !isVendor && !isAdmin) {
      throw new Error("Accès non autorisé");
    }

    return ctx.db
      .query("return_requests")
      .withIndex("by_order", (q) => q.eq("order_id", args.orderId))
      .order("desc")
      .collect();
  },
});

/**
 * Détails d'un retour spécifique.
 */
export const getById = query({
  args: {
    returnId: v.id("return_requests"),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const returnReq = await ctx.db.get(args.returnId);
    if (!returnReq) throw new Error("Demande de retour introuvable");

    // Vérifier l'accès
    const isCustomer = returnReq.customer_id === user._id;
    let isVendor = false;
    if (user.role === "vendor") {
      const store = await ctx.db
        .query("stores")
        .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
        .first();
      isVendor = store?._id === returnReq.store_id;
    }
    const isAdmin = user.role === "admin";

    if (!isCustomer && !isVendor && !isAdmin) {
      throw new Error("Accès non autorisé");
    }

    // Enrichir
    const order = await ctx.db.get(returnReq.order_id);
    const customer = await ctx.db.get(returnReq.customer_id);
    const store = await ctx.db.get(returnReq.store_id);

    return {
      ...returnReq,
      order_number: order?.order_number ?? "",
      order_total: order?.total_amount ?? 0,
      customer_name: customer?.name ?? "Client",
      customer_email: customer?.email ?? "",
      store_name: store?.name ?? "Boutique",
    };
  },
});

/**
 * Vérifie l'éligibilité au retour pour une commande donnée.
 * Utilisé par le frontend pour afficher/masquer le bouton "Demander un retour".
 */
export const checkEligibility = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) return { eligible: false, reason: "Commande introuvable" };
    if (order.customer_id !== user._id) {
      return {
        eligible: false,
        reason: "Cette commande ne vous appartient pas",
      };
    }

    return canRequestReturn(ctx, order);
  },
});

/**
 * Compteur de retours par statut (vue vendeur — sidebar badge).
 */
export const countByStatus = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    const allReturns = await ctx.db
      .query("return_requests")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const counts: Record<string, number> = {
      requested: 0,
      approved: 0,
      received: 0,
      refunded: 0,
      rejected: 0,
    };

    for (const ret of allReturns) {
      counts[ret.status] = (counts[ret.status] ?? 0) + 1;
    }

    return {
      ...counts,
      pending_action: counts.requested + counts.approved + counts.received,
    };
  },
});
