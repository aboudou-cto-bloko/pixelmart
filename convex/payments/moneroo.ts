// filepath: convex/payments/moneroo.ts

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { centimesToMonerooAmount, monerooAmountToCentimes } from "./helpers";

const MONEROO_API_URL = "https://api.moneroo.io/v1";
const MONEROO_TIMEOUT_MS = 10_000;

function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), MONEROO_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id),
  );
}

function handleMonerooFetchError(err: unknown, context: string): never {
  if ((err as Error).name === "AbortError") {
    throw new Error(
      `Délai d'attente dépassé lors de la connexion à Moneroo (${context}, timeout ${MONEROO_TIMEOUT_MS / 1000}s)`,
    );
  }
  throw err;
}

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
    const monerooAmount = centimesToMonerooAmount(order.total_amount, order.currency);

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
    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${MONEROO_API_URL}/payments/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secretKey}`,
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
    } catch (err) {
      handleMonerooFetchError(err, "initialisation du paiement");
    }

    if (!response.ok) {
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
 * Initialise un paiement Moneroo depuis une boutique vendeur.
 * Identique à initializePayment mais avec un return_url pointant vers /shop/[storeSlug].
 */
export const initializeShopPayment = action({
  args: {
    orderId: v.id("orders"),
    storeSlug: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ checkoutUrl: string; paymentId: string }> => {
    const secretKey = process.env.MONEROO_SECRET_KEY;
    if (!secretKey) throw new Error("MONEROO_SECRET_KEY non configurée");

    const siteUrl = process.env.SITE_URL;
    if (!siteUrl) throw new Error("SITE_URL non configurée");

    const order = await ctx.runQuery(
      internal.payments.queries.getOrderForPayment,
      { orderId: args.orderId },
    );
    if (!order) throw new Error("Commande introuvable");
    if (order.status !== "pending")
      throw new Error(`Paiement impossible : commande "${order.status}"`);
    if (order.payment_status === "paid")
      throw new Error("Cette commande est déjà payée");

    const monerooAmount = centimesToMonerooAmount(order.total_amount, order.currency);

    const payload = {
      amount: monerooAmount,
      currency: order.currency,
      description: `Commande ${order.order_number} — ${args.storeSlug}`,
      customer: {
        email: order.customer_email,
        first_name: order.customer_name.split(" ")[0] || "Client",
        last_name:
          order.customer_name.split(" ").slice(1).join(" ") || "Client",
      },
      return_url: `${siteUrl}/shop/${args.storeSlug}/checkout/payment-callback?orderId=${order._id}`,
      metadata: {
        order_id: order._id,
        order_number: order.order_number,
        store_id: order.store_id,
      },
    };

    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${MONEROO_API_URL}/payments/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secretKey}`,
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
    } catch (err) {
      handleMonerooFetchError(err, "initialisation du paiement boutique");
    }

    if (!response.ok) {
      throw new Error(
        `Erreur Moneroo (${response.status}) : impossible d'initialiser le paiement`,
      );
    }

    const result: MonerooInitResponse = await response.json();

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
    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${MONEROO_API_URL}/payments/${order.payment_reference}/verify`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            Accept: "application/json",
          },
        },
      );
    } catch (err) {
      handleMonerooFetchError(err, "vérification du paiement");
    }

    if (!response.ok) {
      throw new Error(
        `Erreur lors de la vérification du paiement Moneroo (${response.status})`,
      );
    }

    const result = await response.json();
    const monerooStatus = result.data?.status as string;

    // Mettre à jour selon le statut
    if (monerooStatus === "success") {
      await ctx.runMutation(internal.payments.mutations.confirmPayment, {
        orderId: args.orderId,
        paymentReference: order.payment_reference,
        amountPaid: monerooAmountToCentimes(
          result.data?.amount ?? 0,
          result.data?.currency ?? order.currency,
        ),
        currency: result.data?.currency ?? order.currency,
      });
    } else if (monerooStatus === "failed" || monerooStatus === "cancelled") {
      await ctx.runMutation(internal.payments.mutations.failPayment, {
        orderId: args.orderId,
        reason: `Paiement ${monerooStatus === "cancelled" ? "annulé" : "échoué"} (Moneroo)`,
      });
    }

    return { status: monerooStatus };
  },
});

/**
 * Maps Pixel-Mart payment_method values to Moneroo payout method IDs.
 * Falls back to "mtn_bj" (most common in Benin) if the method is unknown.
 */
function resolvePayoutMethod(paymentMethod: string | undefined | null): string {
  const map: Record<string, string> = {
    moneroo_mtn: "mtn_bj",
    mtn_bj: "mtn_bj",
    moneroo_orange: "orange_bj",
    orange_bj: "orange_bj",
    moneroo_moov: "moov_bj",
    moov_bj: "moov_bj",
    moneroo_wave: "wave_ci",
    wave_ci: "wave_ci",
  };
  return map[paymentMethod ?? ""] ?? "mtn_bj";
}

/**
 * Demande un remboursement via l'API Payout de Moneroo.
 * (Moneroo ne dispose pas d'endpoint /refund — on utilise /v1/payouts/initialize)
 *
 * Appelé depuis cancelOrder (via ctx.scheduler) quand payment_status === "paid".
 * IDEMPOTENT : si la commande a déjà payment_status === "refunded", ne fait rien.
 *
 * Pattern : internalAction (appel API externe) → ctx.runMutation pour update DB.
 */
export const requestRefund = internalAction({
  args: {
    orderId: v.id("orders"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const secretKey = process.env.MONEROO_SECRET_KEY;
    if (!secretKey) throw new Error("MONEROO_SECRET_KEY non configurée");

    const order = await ctx.runQuery(
      internal.payments.queries.getOrderForPayment,
      { orderId: args.orderId },
    );

    if (!order) throw new Error("Commande introuvable");

    // Idempotence
    if (order.payment_status === "refunded") return { alreadyRefunded: true };

    if (!order.payment_reference) {
      // Pas de référence Moneroo (ex: COD annulé avant collecte) — marquer remboursé directement
      await ctx.runMutation(internal.payments.mutations.markRefunded, {
        orderId: args.orderId,
        reason: args.reason ?? "Annulation sans référence de paiement",
      });
      return { refunded: true, method: "manual" };
    }

    // Construire le customer requis par Moneroo
    const nameParts = (order.customer_name ?? "Client").trim().split(/\s+/);
    const customerPayload = {
      email: order.customer_email || `customer+${order.customer_id}@pixel-mart-bj.com`,
      first_name: nameParts[0] ?? "Client",
      last_name: nameParts.slice(1).join(" ") || "Pixel-Mart",
    };

    const payoutMethod = resolvePayoutMethod(order.payment_method);
    const monerooAmount = centimesToMonerooAmount(order.total_amount, order.currency);

    const payload: Record<string, unknown> = {
      amount: monerooAmount,
      currency: order.currency,
      description: args.reason ?? `Remboursement commande ${order.order_number}`,
      method: payoutMethod,
      customer: customerPayload,
      metadata: {
        order_id: order._id,
        order_number: order.order_number,
        original_payment_ref: order.payment_reference,
      },
    };

    // recipient.msisdn requis pour les méthodes mobile money
    const phone = order.customer_phone;
    if (phone) {
      payload.recipient = { msisdn: phone.replace(/^\+/, "") };
    }

    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${MONEROO_API_URL}/payouts/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secretKey}`,
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
    } catch (err) {
      handleMonerooFetchError(err, "remboursement (payout)");
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(
        `Erreur Moneroo payout (${response.status}) : ${errBody || "impossible d'initialiser le remboursement"}`,
      );
    }

    // Payout initialisé — marquer la commande comme remboursée
    await ctx.runMutation(internal.payments.mutations.markRefunded, {
      orderId: args.orderId,
      reason: args.reason,
    });

    return { refunded: true, method: "moneroo_payout" };
  },
});
