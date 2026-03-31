// filepath: convex/storage/actions.ts
"use node";

import { action, internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { centimesToMonerooAmount } from "../payments/helpers";

const MONEROO_API_URL = "https://api.moneroo.io/v1";

function getMonerooKey(): string {
  const key = process.env.MONEROO_SECRET_KEY;
  if (!key) throw new Error("MONEROO_SECRET_KEY non configurée");
  return key;
}

function getSiteUrl(): string {
  return process.env.SITE_URL ?? "https://www.pixel-mart-bj.com";
}

/** Split a display name into first / last name for Moneroo's required fields. */
function splitName(name: string): { first_name: string; last_name: string } {
  const parts = name.trim().split(/\s+/);
  return {
    first_name: parts[0] ?? "Vendeur",
    last_name: parts.slice(1).join(" ") || "Pixel-Mart",
  };
}

// ─── Initiate Invoice Payment (Public — vendor action) ───────

export const initiateInvoicePayment = action({
  args: {
    invoiceId: v.id("storage_invoices"),
  },
  handler: async (ctx, args): Promise<{ checkoutUrl: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentification requise");

    const apiKey = getMonerooKey();
    const siteUrl = getSiteUrl();

    // Look up the vendor's store via auth subject
    const stores = await ctx.runQuery(api.stores.queries.getMyStore);
    if (!stores) throw new Error("Boutique introuvable");

    // Get the invoice and validate ownership + status
    const invoice = await ctx.runQuery(
      internal.storage.queries.getInvoiceForPayment,
      { invoiceId: args.invoiceId, storeId: stores._id },
    );
    if (!invoice) throw new Error("Facture introuvable");
    if (invoice.store_id !== stores._id) {
      throw new Error("Cette facture ne vous appartient pas");
    }
    if (invoice.status !== "unpaid") {
      throw new Error("Cette facture a déjà été réglée");
    }

    // Set payment_method to "immediate"
    await ctx.runMutation(internal.storage.mutations.setInvoicePaymentMethod, {
      invoiceId: args.invoiceId,
      paymentMethod: "immediate",
    });

    const monerooAmount = centimesToMonerooAmount(invoice.amount, invoice.currency);
    const { first_name, last_name } = splitName(stores.name);

    const body = {
      amount: monerooAmount,
      currency: invoice.currency,
      description: `Frais de stockage — facture ${args.invoiceId}`,
      customer: {
        email: identity.email ?? `vendor+${stores._id}@pixel-mart-bj.com`,
        first_name,
        last_name,
      },
      return_url: `${siteUrl}/vendor/billing?payment=storage&invoice=${args.invoiceId}`,
      metadata: {
        type: "storage_payment",
        invoice_id: args.invoiceId,
        store_id: stores._id,
      },
    };

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

    const checkoutUrl = result.data?.checkout_url;
    if (!checkoutUrl) throw new Error("URL de paiement non reçue");

    // Store payment reference
    const paymentRef = result.data?.id;
    if (paymentRef) {
      await ctx.runMutation(
        internal.storage.mutations.updateInvoicePaymentRef,
        {
          invoiceId: args.invoiceId,
          paymentReference: paymentRef,
        },
      );
    }

    return { checkoutUrl };
  },
});

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

    // Fetch store + owner to build customer object required by Moneroo
    const storeOwner = await ctx.runQuery(
      internal.storage.queries.getStoreOwnerForPayment,
      { storeId: args.storeId },
    );

    const monerooAmount = centimesToMonerooAmount(args.amount, args.currency);
    const { first_name, last_name } = splitName(storeOwner?.storeName ?? "Vendeur");

    const body = {
      amount: monerooAmount,
      currency: args.currency,
      description: `Frais de stockage — facture ${args.invoiceId}`,
      customer: {
        email: storeOwner?.ownerEmail ?? `vendor+${args.storeId}@pixel-mart-bj.com`,
        first_name,
        last_name,
      },
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
