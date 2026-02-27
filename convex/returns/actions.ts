// filepath: convex/returns/actions.ts
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

/**
 * Initie un remboursement via Moneroo.
 *
 * Utilise l'endpoint payout pour renvoyer l'argent au client.
 * Le webhook Moneroo confirmera le succès/échec.
 */
export const processMonerooRefund = internalAction({
  args: {
    returnId: v.id("return_requests"),
    orderId: v.id("orders"),
    amount: v.number(),
    currency: v.string(),
    customerEmail: v.string(),
    customerName: v.string(),
    paymentReference: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = getMonerooKey();

    // Moneroo XOF : pas de sous-unités → convertir centimes → unité
    const monerooAmount =
      args.currency === "XOF" ? Math.round(args.amount / 100) : args.amount;

    const nameParts = args.customerName.split(" ");
    const firstName = nameParts[0] ?? "Client";
    const lastName = nameParts.slice(1).join(" ") || "PixelMart";

    const body = {
      amount: monerooAmount,
      currency: args.currency,
      description: `Remboursement commande — ${args.orderId}`,
      customer: {
        email: args.customerEmail,
        first_name: firstName,
        last_name: lastName,
      },
      metadata: {
        return_id: args.returnId,
        order_id: args.orderId,
        type: "refund",
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
          `Moneroo refund init failed (${response.status}):`,
          errorText,
        );
        return;
      }

      const result = await response.json();

      if (result.success && result.data?.id) {
        // Stocker la référence de remboursement
        await ctx.runMutation(
          internal.returns.mutations.updateRefundReference,
          {
            returnId: args.returnId,
            reference: result.data.id,
          },
        );

        console.log(
          `Refund for return ${args.returnId} initialized: ${result.data.id}`,
        );
      } else {
        console.error("Moneroo refund init: unexpected response", result);
      }
    } catch (error) {
      console.error("Moneroo refund init error:", error);
    }
  },
});
