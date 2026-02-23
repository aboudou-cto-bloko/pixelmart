// filepath: convex/payments/webhooks.ts

import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { verifyMonerooSignature } from "./helpers";
import type { Id } from "../_generated/dataModel";

/**
 * Webhook Moneroo — reçoit les notifications de paiement.
 *
 * Moneroo envoie un POST avec :
 * - Header : x-moneroo-signature (HMAC-SHA256)
 * - Body : { event, data: { id, status, amount, currency, metadata, ... } }
 *
 * Statuts Moneroo : initiated | pending | success | failed | cancelled
 */
export const handleMonerooWebhook = httpAction(async (ctx, request) => {
  // 1. Lire le body brut (nécessaire pour vérifier la signature)
  const rawBody = await request.text();

  // 2. Vérifier la signature
  const webhookSecret = process.env.MONEROO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("MONEROO_WEBHOOK_SECRET non configurée");
    return new Response("Server configuration error", { status: 500 });
  }

  const signature = request.headers.get("x-moneroo-signature") ?? "";

  if (!signature) {
    console.warn("Webhook Moneroo sans signature");
    return new Response("Missing signature", { status: 401 });
  }

  const isValid = await verifyMonerooSignature(
    rawBody,
    signature,
    webhookSecret,
  );
  if (!isValid) {
    console.warn("Webhook Moneroo signature invalide");
    return new Response("Invalid signature", { status: 401 });
  }

  // 3. Parser le payload
  let payload: {
    event: string;
    data: {
      id: string;
      status: string;
      amount: number;
      currency: string;
      metadata?: {
        order_id?: string;
        order_number?: string;
        store_id?: string;
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("Webhook Moneroo : JSON invalide");
    return new Response("Invalid JSON", { status: 400 });
  }

  const { data } = payload;

  if (!data?.id || !data?.status) {
    console.error("Webhook Moneroo : payload incomplet", payload);
    return new Response("Invalid payload", { status: 400 });
  }

  const orderId = data.metadata?.order_id as Id<"orders"> | undefined;

  if (!orderId) {
    console.warn("Webhook Moneroo : pas d'order_id dans metadata", data.id);
    // On retourne 200 pour que Moneroo ne re-tente pas
    return new Response("No order_id in metadata", { status: 200 });
  }

  // 4. Traiter selon le statut
  try {
    switch (data.status) {
      case "success": {
        await ctx.runMutation(internal.payments.mutations.confirmPayment, {
          orderId,
          paymentReference: data.id,
          amountPaid: data.amount,
          currency: data.currency,
        });
        console.log(`Payment confirmed for order ${orderId}`);
        break;
      }

      case "failed":
      case "cancelled": {
        await ctx.runMutation(internal.payments.mutations.failPayment, {
          orderId,
          reason: `Moneroo: ${data.status}`,
        });
        console.log(`Payment ${data.status} for order ${orderId}`);
        break;
      }

      case "initiated":
      case "pending": {
        // Rien à faire — la commande est déjà en "pending"
        console.log(`Payment ${data.status} for order ${orderId} — no action`);
        break;
      }

      default: {
        console.warn(`Moneroo status inconnu: ${data.status}`);
      }
    }
  } catch (error) {
    console.error("Webhook Moneroo processing error:", error);
    // Retourner 500 pour que Moneroo re-tente
    return new Response("Processing error", { status: 500 });
  }

  // 5. Toujours retourner 200 pour les cas traités
  return new Response("OK", { status: 200 });
});
