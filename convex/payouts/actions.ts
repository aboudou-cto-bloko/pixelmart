// filepath: convex/payouts/actions.ts
"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

const MONEROO_API_URL = "https://api.moneroo.io/v1";

function getMonerooKey(): string {
  const key = process.env.MONEROO_SECRET_KEY;
  if (!key) throw new Error("MONEROO_SECRET_KEY non configurée");
  return key;
}

function getSiteUrl(): string {
  return process.env.SITE_URL ?? "http://localhost:3001";
}

// ─── Initialize Payout via Moneroo ──────────────────────────

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

    // Moneroo XOF : pas de sous-unités → amount en unité
    const monerooAmount =
      args.currency === "XOF" ? Math.round(args.amount / 100) : args.amount;

    // Construire le recipient selon la méthode
    const recipient: Record<string, string> = {};
    if (args.phoneNumber) {
      recipient.msisdn = args.phoneNumber;
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
        const errorText = await response.text();
        console.error(
          `Moneroo payout init failed (${response.status}):`,
          errorText,
        );

        // Fail le payout
        await ctx.runMutation(internal.payouts.mutations.failPayout, {
          payoutId: args.payoutId,
          reason: `Moneroo API error: ${response.status}`,
        });
        return;
      }

      const result = await response.json();

      if (!result.success || !result.data?.id) {
        console.error("Moneroo payout init: unexpected response", result);
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

      console.log(
        `Payout ${args.payoutId} initialized with Moneroo ID: ${result.data.id}`,
      );
    } catch (error) {
      console.error("Moneroo payout init error:", error);
      await ctx.runMutation(internal.payouts.mutations.failPayout, {
        payoutId: args.payoutId,
        reason: `Erreur réseau: ${error instanceof Error ? error.message : "unknown"}`,
      });
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
        console.error(`Moneroo payout verify failed: ${response.status}`);
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
    } catch (error) {
      console.error("Moneroo payout verify error:", error);
      return null;
    }
  },
});
