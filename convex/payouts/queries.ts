// filepath: convex/payouts/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { getVendorStore } from "../users/helpers";
import { MIN_PAYOUT_AMOUNT, validatePayoutRequest } from "./helpers";

/**
 * Liste des payouts de la boutique du vendeur connecté.
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);
    const limit = args.limit ?? 20;

    let payoutsQuery = ctx.db
      .query("payouts")
      .withIndex("by_store", (q) => q.eq("store_id", store._id));

    if (args.status) {
      payoutsQuery = payoutsQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    }

    return payoutsQuery.order("desc").take(limit);
  },
});

/**
 * Payouts en attente/processing (pour le badge admin).
 */
export const getPending = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("payouts")
      .withIndex("by_status_only", (q) => q.eq("status", "processing"))
      .order("desc")
      .collect();
  },
});

/**
 * Infos nécessaires pour le formulaire de demande de retrait.
 * Retourne : solde disponible, éligibilité, validation.
 */
export const getPayoutEligibility = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    const validation = await validatePayoutRequest(
      ctx,
      store,
      store.balance, // on valide avec le solde total pour voir si éligible
    );

    return {
      balance: store.balance,
      currency: store.currency,
      minAmount: MIN_PAYOUT_AMOUNT,
      canRequestPayout: store.balance >= MIN_PAYOUT_AMOUNT && validation.valid,
      validationError: validation.error,
    };
  },
});
