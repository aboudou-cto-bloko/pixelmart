// filepath: convex/payments/webhooks.ts

import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { verifyMonerooSignature } from "./helpers";
import type { Id } from "../_generated/dataModel";

/**
 * Webhook Moneroo unifié — reçoit les notifications de paiement ET de payout.
 *
 * Routing :
 * - metadata.order_id présent  → flow paiement (existant)
 * - metadata.payout_id présent → flow payout (nouveau)
 */
export const handleMonerooWebhook = httpAction(async (ctx, request) => {
  // 1. Lire le body brut
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
        payout_id?: string;
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

  // 4. Router : paiement ou payout ?
  const orderId = data.metadata?.order_id as Id<"orders"> | undefined;
  const payoutId = data.metadata?.payout_id as Id<"payouts"> | undefined;

  if (!orderId && !payoutId) {
    console.warn(
      "Webhook Moneroo : ni order_id ni payout_id dans metadata",
      data.id,
    );
    return new Response("No identifiable metadata", { status: 200 });
  }

  try {
    // ── PAYOUT FLOW ──
    if (payoutId) {
      switch (data.status) {
        case "success": {
          await ctx.runMutation(internal.payouts.mutations.confirmPayout, {
            payoutId,
            externalRef: data.id,
          });
          console.log(`Payout confirmed: ${payoutId}`);
          break;
        }
        case "failed": {
          await ctx.runMutation(internal.payouts.mutations.failPayout, {
            payoutId,
            reason: `Moneroo: ${data.status}`,
          });
          console.log(`Payout failed: ${payoutId}`);
          break;
        }
        default: {
          console.log(`Payout ${data.status} for ${payoutId} — no action`);
        }
      }

      return new Response("OK", { status: 200 });
    }

    // ── PAYMENT FLOW (existant) ──
    if (orderId) {
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
          console.log(
            `Payment ${data.status} for order ${orderId} — no action`,
          );
          break;
        }
        default: {
          console.warn(`Moneroo status inconnu: ${data.status}`);
        }
      }
    }
  } catch (error) {
    console.error("Webhook Moneroo processing error:", error);
    return new Response("Processing error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
