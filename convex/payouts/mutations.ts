// filepath: convex/payouts/mutations.ts

import { mutation, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getVendorStore } from "../users/helpers";
import { validatePayoutRequest, calculatePayoutFee } from "./helpers";

// ─── Request Payout (Vendor) ─────────────────────────────────

export const requestPayout = mutation({
  args: {
    amount: v.number(),
    payoutMethod: v.union(
      v.literal("bank_transfer"),
      v.literal("mobile_money"),
      v.literal("paypal"),
    ),
    payoutDetails: v.object({
      provider: v.string(),
      account_name: v.optional(v.string()),
      account_number: v.optional(v.string()),
      bank_code: v.optional(v.string()),
      phone_number: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { user, store } = await getVendorStore(ctx);

    // 1. Valider
    const validation = await validatePayoutRequest(ctx, store, args.amount);
    if (!validation.valid) {
      throw new Error(validation.error!);
    }

    // 2. Calculer les frais
    const fee = calculatePayoutFee(args.amount, args.payoutMethod);
    const netAmount = args.amount - fee;

    // 3. F-01 : Créer la transaction de débit AVANT le payout
    const balanceBefore = store.balance;
    const balanceAfter = balanceBefore - args.amount;

    const transactionId = await ctx.db.insert("transactions", {
      store_id: store._id,
      type: "payout",
      direction: "debit",
      amount: args.amount,
      currency: store.currency,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status: "pending",
      description: `Retrait de ${args.amount / 100} ${store.currency}`,
      processed_at: Date.now(),
    });

    // 4. Débiter le solde du store
    await ctx.db.patch(store._id, {
      balance: balanceAfter,
      updated_at: Date.now(),
    });

    // 5. Créer le payout record
    const payoutId = await ctx.db.insert("payouts", {
      store_id: store._id,
      amount: args.amount,
      currency: store.currency,
      fee,
      status: "pending",
      payout_method: args.payoutMethod,
      payout_details: args.payoutDetails,
      requires_2fa: false, // TODO Phase 2 : activer la 2FA
      verified_2fa: false,
      transaction_id: transactionId,
      requested_at: Date.now(),
    });

    // 6. Lancer l'action Moneroo en arrière-plan
    await ctx.scheduler.runAfter(
      0,
      internal.payouts.actions.initializePayoutViaMoneroo,
      {
        payoutId,
        storeId: store._id,
        amount: netAmount, // montant net envoyé au vendeur
        currency: store.currency,
        method: args.payoutDetails.provider,
        phoneNumber: args.payoutDetails.phone_number,
        accountName: args.payoutDetails.account_name,
        vendorEmail: user.email,
        vendorName: user.name ?? "Vendeur",
      },
    );

    return { payoutId, amount: args.amount, fee, netAmount };
  },
});

// ─── Confirm Payout (Internal — from webhook) ───────────────

export const confirmPayout = internalMutation({
  args: {
    payoutId: v.id("payouts"),
    externalRef: v.string(),
  },
  handler: async (ctx, args) => {
    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new Error("Payout introuvable");

    // Idempotence
    if (payout.status === "completed") {
      return { alreadyProcessed: true };
    }

    // 1. Mettre à jour le payout
    await ctx.db.patch(args.payoutId, {
      status: "completed",
      reference: args.externalRef,
      processed_at: Date.now(),
    });

    // 2. Mettre à jour la transaction associée
    if (payout.transaction_id) {
      await ctx.db.patch(payout.transaction_id, {
        status: "completed",
        reference: args.externalRef,
      });
    }

    // 3. Notification vendeur (email + in-app)
    const store = await ctx.db.get(payout.store_id);
    if (store) {
      const vendor = await ctx.db.get(store.owner_id);
      if (vendor) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.notifyPayoutCompleted,
          {
            vendorUserId: vendor._id,
            vendorEmail: vendor.email,
            amount: payout.amount,
            currency: payout.currency,
            method: payout.payout_method,
            storeName: store.name,
          },
        );
      }
    }

    return { success: true };
  },
});

// ─── Fail Payout (Internal — from webhook) ──────────────────

export const failPayout = internalMutation({
  args: {
    payoutId: v.id("payouts"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new Error("Payout introuvable");

    // Idempotence
    if (payout.status === "failed" || payout.status === "completed") {
      return { alreadyProcessed: true };
    }

    // 1. Mettre à jour le payout
    await ctx.db.patch(args.payoutId, {
      status: "failed",
      notes: args.reason ?? "Échec du traitement",
      processed_at: Date.now(),
    });

    // 2. Reversal — re-créditer le solde du store (F-01)
    const store = await ctx.db.get(payout.store_id);
    if (!store) throw new Error("Store introuvable pour reversal");

    const balanceBefore = store.balance;
    const balanceAfter = balanceBefore + payout.amount;

    await ctx.db.insert("transactions", {
      store_id: store._id,
      type: "credit",
      direction: "credit",
      amount: payout.amount,
      currency: payout.currency,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status: "completed",
      description: `Annulation retrait — ${args.reason ?? "échec"}`,
      processed_at: Date.now(),
    });

    await ctx.db.patch(store._id, {
      balance: balanceAfter,
      updated_at: Date.now(),
    });

    // 3. Marquer la transaction originale comme failed
    if (payout.transaction_id) {
      await ctx.db.patch(payout.transaction_id, {
        status: "failed",
      });
    }

    // 4. Notification vendeur (in-app seulement)
    const vendor = await ctx.db.get(store.owner_id);
    if (vendor) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.createInAppNotification,
        {
          userId: vendor._id,
          type: "payment",
          title: "Retrait échoué",
          body: `Votre retrait de ${payout.amount / 100} ${payout.currency} a échoué. Le montant a été re-crédité.`,
          link: "/vendor/finance",
          channels: ["in_app"],
          sentVia: ["in_app"],
          metadata: undefined,
        },
      );
    }

    return { success: true };
  },
});

// ─── Update Payout Status (from action after Moneroo init) ──

export const updatePayoutReference = internalMutation({
  args: {
    payoutId: v.id("payouts"),
    reference: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      reference: args.reference,
    };

    if (args.status === "processing") {
      updates.status = "processing";
    }

    await ctx.db.patch(args.payoutId, updates);
  },
});
