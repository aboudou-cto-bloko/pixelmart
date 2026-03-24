// filepath: convex/payments/webhooks.ts

import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { verifyMonerooSignature } from "./helpers";
import type { Id } from "../_generated/dataModel";

export const handleMonerooWebhook = httpAction(async (ctx, request) => {
  const rawBody = await request.text();

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
        // ── Ajout : paiements publicitaires ──
        type?: string;
        booking_id?: string;
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
  const payoutId = data.metadata?.payout_id as Id<"payouts"> | undefined;
  const bookingId = data.metadata?.booking_id as Id<"ad_bookings"> | undefined;
  const isAdPayment =
    data.metadata?.type === "ad_payment" && bookingId !== null;

  // Aucun identifiant reconnu → on accepte silencieusement (évite les retries Moneroo)
  if (!orderId && !payoutId && !isAdPayment) {
    console.warn("Webhook Moneroo : metadata non identifiable", data.id);
    return new Response("OK", { status: 200 });
  }

  try {
    // ── AD PAYMENT FLOW ──
    if (isAdPayment) {
      switch (data.status) {
        case "success": {
          await ctx.runMutation(internal.ads.mutations.confirmAdPayment, {
            bookingId: bookingId!,
            externalRef: data.id,
          });
          console.log(`Ad payment confirmed: booking ${bookingId}`);
          break;
        }
        case "failed":
        case "cancelled": {
          await ctx.runMutation(internal.ads.mutations.failAdPayment, {
            bookingId: bookingId!,
            reason: `Moneroo: ${data.status} (ref: ${data.id})`,
          });
          console.log(`Ad payment ${data.status}: booking ${bookingId}`);
          break;
        }
        default: {
          console.log(
            `Ad payment ${data.status} for booking ${bookingId} — no action`,
          );
        }
      }
      return new Response("OK", { status: 200 });
    }

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

    // ── PAYMENT FLOW ──
    if (orderId) {
      switch (data.status) {
        case "success": {
          await ctx.runMutation(internal.payments.mutations.confirmPayment, {
            orderId,
            paymentReference: data.id,
            // Moneroo envoie le montant en FCFA — convertir en centimes pour stockage
            amountPaid:
              data.currency === "XOF" ? data.amount * 100 : data.amount,
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
