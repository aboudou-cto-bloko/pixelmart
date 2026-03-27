// filepath: convex/payments/webhooks.ts

import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { verifyMonerooSignature, monerooAmountToCentimes } from "./helpers";
import type { Id } from "../_generated/dataModel";

export const handleMonerooWebhook = httpAction(async (ctx, request) => {
  const rawBody = await request.text();

  const webhookSecret = process.env.MONEROO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Server configuration error", { status: 500 });
  }

  const signature = request.headers.get("x-moneroo-signature") ?? "";
  if (!signature) {
    return new Response("Missing signature", { status: 401 });
  }

  const isValid = await verifyMonerooSignature(
    rawBody,
    signature,
    webhookSecret,
  );
  if (!isValid) {
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
        type?: string;
        booking_id?: string;
        invoice_id?: string; // stockage
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { data } = payload;
  if (!data?.id || !data?.status) {
    return new Response("Invalid payload", { status: 400 });
  }

  const orderId = data.metadata?.order_id as Id<"orders"> | undefined;
  const payoutId = data.metadata?.payout_id as Id<"payouts"> | undefined;
  const bookingId = data.metadata?.booking_id as Id<"ad_bookings"> | undefined;
  const invoiceId = data.metadata?.invoice_id as
    | Id<"storage_invoices">
    | undefined;
  const isAdPayment = data.metadata?.type === "ad_payment" && !!bookingId;
  const isStoragePayment =
    data.metadata?.type === "storage_payment" && !!invoiceId;

  // Aucun identifiant reconnu → on accepte silencieusement (évite les retries Moneroo)
  if (!orderId && !payoutId && !isAdPayment && !isStoragePayment) {
    return new Response("OK", { status: 200 });
  }

  try {
    // ── STORAGE PAYMENT FLOW ──
    if (isStoragePayment) {
      switch (data.status) {
        case "success": {
          await ctx.runMutation(
            internal.storage.mutations.confirmStoragePayment,
            { invoiceId: invoiceId!, externalRef: data.id },
          );
          break;
        }
        case "failed":
        case "cancelled": {
          await ctx.runMutation(internal.storage.mutations.failStoragePayment, {
            invoiceId: invoiceId!,
            reason: `Moneroo: ${data.status} (ref: ${data.id})`,
          });
          break;
        }
        default:
          break;
      }
      return new Response("OK", { status: 200 });
    }

    // ── AD PAYMENT FLOW ──
    if (isAdPayment) {
      switch (data.status) {
        case "success": {
          await ctx.runMutation(internal.ads.mutations.confirmAdPayment, {
            bookingId: bookingId!,
            externalRef: data.id,
          });
          break;
        }
        case "failed":
        case "cancelled": {
          await ctx.runMutation(internal.ads.mutations.failAdPayment, {
            bookingId: bookingId!,
            reason: `Moneroo: ${data.status} (ref: ${data.id})`,
          });
          break;
        }
        default: {
          break;
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
          break;
        }
        case "failed": {
          await ctx.runMutation(internal.payouts.mutations.failPayout, {
            payoutId,
            reason: `Moneroo: ${data.status}`,
          });
          break;
        }
        default: {
          break;
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
            amountPaid: monerooAmountToCentimes(data.amount, data.currency),
            currency: data.currency,
          });
          // Track Purchase Meta CAPI (seulement si source = vendor_shop et pixel configuré)
          await ctx.runMutation(internal.meta.mutations.trackPurchase, {
            orderId,
          });
          break;
        }
        case "failed":
        case "cancelled": {
          await ctx.runMutation(internal.payments.mutations.failPayment, {
            orderId,
            reason: `Moneroo: ${data.status}`,
          });
          break;
        }
        case "initiated":
        case "pending": {
          break;
        }
        default: {
          break;
        }
      }
    }
  } catch {
    return new Response("Processing error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
});
