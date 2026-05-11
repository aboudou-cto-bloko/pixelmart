// filepath: convex/orders/cod_payment.ts

import { action, internalMutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { centimesToMonerooAmount } from "../payments/helpers";
import {
  MONEROO_API_URL,
  fetchWithTimeout,
  handleMonerooFetchError,
  buildAuthHeaders,
  type MonerooInitResponse,
} from "../payments/moneroo_client";
import { logOrderEvent } from "./events";

// ─── Action : initie le paiement Moneroo pour une commande COD livrée ──────

/**
 * Le client clique "Payer maintenant" dans son suivi de commande.
 * Déclenche un paiement Moneroo sur une commande COD déjà livrée.
 * Même flux que initializePayment — juste déclenché post-livraison.
 */
export const initiateCodPayment = action({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args): Promise<{ checkoutUrl: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Authentication required");

    const secretKey = process.env.MONEROO_SECRET_KEY;
    if (!secretKey) throw new Error("MONEROO_SECRET_KEY non configurée");

    const siteUrl = process.env.SITE_URL;
    if (!siteUrl) throw new Error("SITE_URL non configurée");

    // Récupérer la commande avec les données client (même query que le flux online)
    const order = await ctx.runQuery(
      internal.payments.queries.getOrderForPayment,
      { orderId: args.orderId },
    );

    if (!order) throw new ConvexError("Commande introuvable");

    if (order.payment_mode !== "cod") {
      throw new ConvexError(
        "Cette commande n'est pas en mode paiement à la livraison",
      );
    }
    if (order.payment_status === "paid") {
      throw new ConvexError("Cette commande a déjà été payée");
    }
    if (order.payment_status !== "pending_cod") {
      throw new ConvexError("Cette commande n'est pas prête pour le paiement");
    }
    if (order.status !== "delivered") {
      throw new ConvexError(
        "Vous ne pouvez payer qu'après avoir reçu votre commande",
      );
    }
    // Idempotence : un paiement Moneroo est déjà en cours
    if (order.payment_reference) {
      throw new ConvexError(
        "Un paiement est déjà en cours pour cette commande. Rafraîchissez la page.",
      );
    }

    const monerooAmount = centimesToMonerooAmount(
      order.total_amount,
      order.currency,
    );

    const payload = {
      amount: monerooAmount,
      currency: order.currency,
      description: `Paiement COD commande ${order.order_number} — Pixel-Mart`,
      customer: {
        email: order.customer_email,
        first_name: order.customer_name.split(" ")[0] || "Client",
        last_name:
          order.customer_name.split(" ").slice(1).join(" ") || "Pixel-Mart",
      },
      return_url: `${siteUrl}/orders/${args.orderId}?cod_payment=1`,
      metadata: {
        order_id: args.orderId,
        order_number: order.order_number,
        store_id: order.store_id,
        type: "cod_payment",
      },
    };

    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${MONEROO_API_URL}/payments/initialize`,
        {
          method: "POST",
          headers: buildAuthHeaders(secretKey),
          body: JSON.stringify(payload),
        },
      );
    } catch (err) {
      handleMonerooFetchError(err, "initiation paiement COD");
    }

    if (!response.ok) {
      throw new Error(
        `Erreur Moneroo (${response.status}) : impossible d'initialiser le paiement`,
      );
    }

    const result: MonerooInitResponse = await response.json();

    // Stocker la référence et passer payment_status à "pending" le temps du paiement
    await ctx.runMutation(internal.orders.cod_payment.prepareCodForPayment, {
      orderId: args.orderId,
      paymentReference: result.data.id,
    });

    return { checkoutUrl: result.data.checkout_url };
  },
});

// ─── Internal Mutation : prépare la commande COD pour le paiement ────────────

// Distinct de setPaymentReference car il faut aussi réinitialiser payment_status
// de "pending_cod" à "pending" le temps que Moneroo confirme.
export const prepareCodForPayment = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentReference: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      payment_reference: args.paymentReference,
      payment_status: "pending",
      updated_at: Date.now(),
    });
  },
});

// ─── Internal Mutation : confirmation du paiement COD (après webhook) ────────

/**
 * Appelée par confirmPayment quand la commande est une conversion COD→online.
 * Crée les transactions F-01 et crédite pending_balance comme le flux online.
 * Le statut de la commande reste "delivered" — seul payment_status passe à "paid".
 */
export const confirmCodConversion = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentReference: v.string(),
    amountPaid: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");

    const store = await ctx.db.get(order.store_id);
    if (!store) throw new Error("Boutique introuvable");

    const commissionAmount = order.commission_amount ?? 0;
    const netAmount = order.total_amount - commissionAmount;
    const isDemoStore = store.is_demo === true;

    const balanceBefore = store.pending_balance;
    const balanceAfter = balanceBefore + netAmount;

    // F-01 : transaction "sale" — crédit vendeur
    await ctx.db.insert("transactions", {
      store_id: store._id,
      order_id: args.orderId,
      type: "sale",
      direction: "credit",
      amount: netAmount,
      currency: args.currency,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status: "completed",
      reference: args.paymentReference,
      description: `Vente COD commande ${order.order_number}`,
      processed_at: Date.now(),
      is_demo: isDemoStore ? true : undefined,
    });

    // F-01 : transaction "fee" — commission Pixel-Mart
    if (commissionAmount > 0) {
      await ctx.db.insert("transactions", {
        store_id: store._id,
        order_id: args.orderId,
        type: "fee",
        direction: "debit",
        amount: commissionAmount,
        currency: args.currency,
        balance_before: balanceAfter,
        balance_after: balanceAfter,
        status: "completed",
        reference: args.paymentReference,
        description: `Commission Pixel-Mart COD commande ${order.order_number}`,
        processed_at: Date.now(),
        is_demo: isDemoStore ? true : undefined,
      });
    }

    // F-01 : livraison offerte absorbée par le vendeur
    if (order.absorbed_delivery_fee && order.absorbed_delivery_fee > 0) {
      await ctx.db.insert("transactions", {
        store_id: store._id,
        order_id: args.orderId,
        type: "fee",
        direction: "debit",
        amount: order.absorbed_delivery_fee,
        currency: args.currency,
        balance_before: balanceAfter,
        balance_after: balanceAfter,
        status: "completed",
        reference: args.paymentReference,
        description: `Livraison offerte COD commande ${order.order_number}`,
        processed_at: Date.now(),
        is_demo: isDemoStore ? true : undefined,
      });
    }

    // Créditer pending_balance — libéré après 48h par le cron releaseBalances
    await ctx.db.patch(store._id, {
      pending_balance: balanceAfter,
      updated_at: Date.now(),
    });

    // payment_status → "paid", status reste "delivered"
    await ctx.db.patch(args.orderId, {
      payment_status: "paid",
      payment_reference: args.paymentReference,
      updated_at: Date.now(),
    });

    await logOrderEvent(ctx, {
      orderId: args.orderId,
      storeId: store._id,
      type: "paid",
      description: `Paiement COD reçu via Mobile Money (réf: ${args.paymentReference})`,
      actorType: "customer",
      actorId: order.customer_id,
    });

    const customer = await ctx.db.get(order.customer_id);
    const vendor = await ctx.db.get(store.owner_id);

    if (customer) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.createInAppNotification,
        {
          userId: customer._id,
          type: "order_status",
          title: `Paiement confirmé — Commande ${order.order_number}`,
          body: `Votre paiement de ${order.total_amount.toLocaleString("fr-FR")} FCFA a bien été reçu. Merci !`,
          link: `/orders/${args.orderId}`,
          channels: ["in_app", "push"],
          sentVia: ["in_app"],
          metadata: undefined,
        },
      );
    }

    if (vendor) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.createInAppNotification,
        {
          userId: vendor._id,
          type: "payment",
          title: `Paiement COD reçu — Commande ${order.order_number}`,
          body: `Le client a payé sa commande COD. ${netAmount.toLocaleString("fr-FR")} FCFA en attente de libération.`,
          link: `/vendor/orders/${args.orderId}`,
          channels: ["in_app", "push"],
          sentVia: ["in_app"],
          metadata: undefined,
        },
      );
    }
  },
});

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Query pour le client : commandes COD livrées en attente de paiement.
 */
export const listPendingCodPayments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_customer", (q) => q.eq("customer_id", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("payment_mode"), "cod"),
          q.eq(q.field("payment_status"), "pending_cod"),
          q.eq(q.field("status"), "delivered"),
        ),
      )
      .order("desc")
      .take(20);

    return orders.map((o) => ({
      _id: o._id,
      order_number: o.order_number,
      total_amount: o.total_amount,
      currency: o.currency,
      delivered_at: o.delivered_at,
      store_id: o.store_id,
    }));
  },
});

/**
 * Query pour le vendeur : commandes COD en attente de paiement client.
 */
export const listStorePendingCodPayments = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Authentication required");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new ConvexError("User not found");

    if (user.role === "vendor") {
      const store = await ctx.db.get(args.storeId);
      if (!store || store.owner_id !== user._id) {
        throw new ConvexError("Accès refusé");
      }
    } else if (user.role !== "admin") {
      throw new ConvexError("Accès refusé");
    }

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", args.storeId))
      .filter((q) =>
        q.and(
          q.eq(q.field("payment_mode"), "cod"),
          q.eq(q.field("payment_status"), "pending_cod"),
        ),
      )
      .order("desc")
      .take(50);

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const customer = await ctx.db.get(order.customer_id);
        return {
          _id: order._id,
          order_number: order.order_number,
          status: order.status,
          total_amount: order.total_amount,
          currency: order.currency,
          delivered_at: order.delivered_at,
          customer_name: customer?.name ?? "Client",
          customer_email: customer?.email ?? "",
          customer_phone: order.shipping_address?.phone,
          days_since_delivery: order.delivered_at
            ? Math.floor(
                (Date.now() - order.delivered_at) / (24 * 60 * 60 * 1000),
              )
            : null,
        };
      }),
    );

    return enriched;
  },
});
