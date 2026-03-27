// filepath: convex/storage/actions.ts
"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

const MONEROO_API_URL = "https://api.moneroo.io/v1";

function getMonerooKey(): string {
  const key = process.env.MONEROO_SECRET_KEY;
  if (!key) throw new Error("MONEROO_SECRET_KEY non configurée");
  return key;
}

function getSiteUrl(): string {
  return process.env.SITE_URL ?? "https://www.pixel-mart-bj.com";
}

// ─── Initialize Storage Invoice Payment via Moneroo ──────────

export const initializeStoragePayment = internalAction({
  args: {
    invoiceId: v.id("storage_invoices"),
    storeId: v.id("stores"),
    amount: v.number(), // centimes
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = getMonerooKey();
    const siteUrl = getSiteUrl();

    // Moneroo XOF : pas de sous-unités → convertir centimes → FCFA
    const monerooAmount =
      args.currency === "XOF" ? Math.round(args.amount / 100) : args.amount;

    const body = {
      amount: monerooAmount,
      currency: args.currency,
      description: `Frais de stockage — facture ${args.invoiceId}`,
      return_url: `${siteUrl}/vendor/billing?payment=storage&invoice=${args.invoiceId}`,
      metadata: {
        type: "storage_payment",
        invoice_id: args.invoiceId,
        store_id: args.storeId,
      },
    };

    let paymentRef: string | undefined;

    try {
      const response = await fetch(`${MONEROO_API_URL}/payments/initialize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Moneroo error ${response.status}: ${errorText}`);
      }

      const result = (await response.json()) as {
        data?: { id?: string; checkout_url?: string };
      };
      paymentRef = result.data?.id;
    } catch (err) {
      // Paiement non initialisé — la facture reste "unpaid", le vendeur réessaiera
      console.error("Storage payment init failed:", err);
      return { success: false };
    }

    if (paymentRef) {
      await ctx.runMutation(
        internal.storage.mutations.updateInvoicePaymentRef,
        {
          invoiceId: args.invoiceId,
          paymentReference: paymentRef,
        },
      );
    }

    return { success: true, paymentRef };
  },
});
