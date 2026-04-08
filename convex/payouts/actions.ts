// filepath: convex/payouts/actions.ts
"use node";

import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { centimesToMonerooAmount } from "../payments/helpers";

const MONEROO_API_URL = "https://api.moneroo.io/v1";

function getMonerooKey(): string {
  const key = process.env.MONEROO_SECRET_KEY;
  if (!key) throw new Error("MONEROO_SECRET_KEY non configurée");
  return key;
}

// ─── Initialize Payout via Moneroo ──────────────────────────

/** Champ recipient attendu par Moneroo selon le code de méthode */
function getRecipientField(method: string): "msisdn" | "account_number" {
  if (method === "moneroo_payout_demo") return "account_number";
  return "msisdn";
}

/** Normalise un numéro de téléphone en entier international (ex: "229 97 00 00 00" → "22997000000") */
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export const initializePayoutViaMoneroo = internalAction({
  args: {
    payoutId: v.id("payouts"),
    storeId: v.id("stores"),
    amount: v.number(),
    currency: v.string(),
    method: v.string(),
    phoneNumber: v.optional(v.string()),
    accountName: v.optional(v.string()),
    vendorEmail: v.string(),
    vendorName: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = getMonerooKey();

    const monerooAmount = centimesToMonerooAmount(args.amount, args.currency);

    // Construire le recipient avec le bon champ selon l'opérateur
    const recipient: Record<string, string> = {};
    if (args.phoneNumber) {
      const field = getRecipientField(args.method);
      recipient[field] = normalizePhoneNumber(args.phoneNumber);
    }

    // Séparer le nom en first/last
    const nameParts = args.vendorName.split(" ");
    const firstName = nameParts[0] ?? "Vendeur";
    const lastName = nameParts.slice(1).join(" ") || "PixelMart";

    const body = {
      amount: monerooAmount,
      currency: args.currency,
      description: `Retrait Pixel-Mart — ${args.storeId}`,
      customer: {
        email: args.vendorEmail,
        first_name: firstName,
        last_name: lastName,
      },
      method: args.method,
      recipient,
      metadata: {
        payout_id: args.payoutId,
        store_id: args.storeId,
      },
    };

    try {
      const response = await fetch(`${MONEROO_API_URL}/payouts/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // Fail le payout
        await ctx.runMutation(internal.payouts.mutations.failPayout, {
          payoutId: args.payoutId,
          reason: `Moneroo API error: ${response.status}`,
        });
        return;
      }

      const result = await response.json();

      if (!result.success || !result.data?.id) {
        await ctx.runMutation(internal.payouts.mutations.failPayout, {
          payoutId: args.payoutId,
          reason: "Moneroo: réponse inattendue",
        });
        return;
      }

      // Stocker la référence Moneroo + passer en processing
      await ctx.runMutation(internal.payouts.mutations.updatePayoutReference, {
        payoutId: args.payoutId,
        reference: result.data.id,
        status: "processing",
      });
    } catch (error) {
      await ctx.runMutation(internal.payouts.mutations.failPayout, {
        payoutId: args.payoutId,
        reason: `Erreur réseau: ${error instanceof Error ? error.message : "unknown"}`,
      });
    }
  },
});

// ─── List Payout Methods (Moneroo) ──────────────────────────

export const listPayoutMethods = action({
  args: {},
  handler: async () => {
    const apiKey = getMonerooKey();

    try {
      const response = await fetch(`${MONEROO_API_URL}/utils/payout/methods`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) return null;

      const result = await response.json();

      // Moneroo returns { data: [...] }
      const methods: unknown[] = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : [];

      return methods as Array<{
        id: string;
        name: string;
        country?: string;
        logo?: string;
        active?: boolean;
        type?: string;
      }>;
    } catch {
      return null;
    }
  },
});

// ─── Verify Payout (fallback) ────────────────────────────────

export const verifyPayout = internalAction({
  args: {
    payoutId: v.id("payouts"),
    monerooPayoutId: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = getMonerooKey();

    try {
      const response = await fetch(
        `${MONEROO_API_URL}/payouts/${args.monerooPayoutId}/verify`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      const status = result.data?.status;

      if (status === "success") {
        await ctx.runMutation(internal.payouts.mutations.confirmPayout, {
          payoutId: args.payoutId,
          externalRef: args.monerooPayoutId,
        });
      } else if (status === "failed") {
        await ctx.runMutation(internal.payouts.mutations.failPayout, {
          payoutId: args.payoutId,
          reason: result.data?.failure_message ?? "Moneroo: failed",
        });
      }

      return { status };
    } catch {
      return null;
    }
  },
});
