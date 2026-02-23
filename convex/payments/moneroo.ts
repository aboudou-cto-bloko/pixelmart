// filepath: convex/payments/moneroo.ts

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { centimesToMonerooAmount } from "./helpers";

const MONEROO_API_URL = "https://api.moneroo.io/v1";

interface MonerooInitResponse {
  message: string;
  data: {
    id: string;
    checkout_url: string;
  };
}

/**
 * Initialise un paiement Moneroo pour une commande existante.
 *
 * Pattern Convex : action (appel API externe) → puis mutation pour update DB.
 * JAMAIS d'appel API externe dans une mutation.
 */
export const initializePayment = action({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ checkoutUrl: string; paymentId: string }> => {
    const secretKey = process.env.MONEROO_SECRET_KEY;
    if (!secretKey) {
      throw new Error("MONEROO_SECRET_KEY non configurée");
    }

    const siteUrl = process.env.SITE_URL;
    if (!siteUrl) {
      throw new Error("SITE_URL non configurée");
    }

    // 1. Récupérer la commande via une query interne
    const order = await ctx.runQuery(
      internal.payments.queries.getOrderForPayment,
      {
        orderId: args.orderId,
      },
    );

    if (!order) {
      throw new Error("Commande introuvable");
    }

    if (order.status !== "pending") {
      throw new Error(
        `Paiement impossible : commande en statut "${order.status}"`,
      );
    }

    if (order.payment_status === "paid") {
      throw new Error("Cette commande est déjà payée");
    }

    // 2. Préparer le payload Moneroo
    const monerooAmount = centimesToMonerooAmount(order.total_amount);

    const payload = {
      amount: monerooAmount,
      currency: order.currency,
      description: `Commande ${order.order_number} — Pixel-Mart`,
      customer: {
        email: order.customer_email,
        first_name: order.customer_name.split(" ")[0] || "Client",
        last_name:
          order.customer_name.split(" ").slice(1).join(" ") || "Pixel-Mart",
      },
      return_url: `${siteUrl}/checkout/payment-callback?orderId=${order._id}`,
      metadata: {
        order_id: order._id,
        order_number: order.order_number,
        store_id: order.store_id,
      },
    };

    // 3. Appeler l'API Moneroo
    const response = await fetch(`${MONEROO_API_URL}/payments/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Moneroo init error:", response.status, errorBody);
      throw new Error(
        `Erreur Moneroo (${response.status}) : impossible d'initialiser le paiement`,
      );
    }

    const result: MonerooInitResponse = await response.json();

    // 4. Stocker la référence de paiement dans la commande
    await ctx.runMutation(internal.payments.mutations.setPaymentReference, {
      orderId: args.orderId,
      paymentReference: result.data.id,
      paymentMethod: order.payment_method ?? "moneroo",
    });

    return {
      checkoutUrl: result.data.checkout_url,
      paymentId: result.data.id,
    };
  },
});

/**
 * Vérifie le statut d'un paiement auprès de Moneroo.
 * Utilisé comme fallback si le webhook n'arrive pas.
 */
export const verifyPayment = action({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const secretKey = process.env.MONEROO_SECRET_KEY;
    if (!secretKey) {
      throw new Error("MONEROO_SECRET_KEY non configurée");
    }

    // Récupérer la commande
    const order = await ctx.runQuery(
      internal.payments.queries.getOrderForPayment,
      {
        orderId: args.orderId,
      },
    );

    if (!order || !order.payment_reference) {
      throw new Error("Commande introuvable ou sans référence de paiement");
    }

    // Vérifier auprès de Moneroo
    const response = await fetch(
      `${MONEROO_API_URL}/payments/${order.payment_reference}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Erreur vérification Moneroo (${response.status})`);
    }

    const result = await response.json();
    const monerooStatus = result.data?.status as string;

    // Mettre à jour selon le statut
    if (monerooStatus === "success") {
      await ctx.runMutation(internal.payments.mutations.confirmPayment, {
        orderId: args.orderId,
        paymentReference: order.payment_reference,
        amountPaid: result.data?.amount ?? 0,
        currency: result.data?.currency ?? order.currency,
      });
    } else if (monerooStatus === "failed" || monerooStatus === "cancelled") {
      await ctx.runMutation(internal.payments.mutations.failPayment, {
        orderId: args.orderId,
        reason: `Moneroo status: ${monerooStatus}`,
      });
    }

    return { status: monerooStatus };
  },
});
