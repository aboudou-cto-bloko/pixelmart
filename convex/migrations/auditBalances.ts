// filepath: convex/migrations/auditBalances.ts
//
// Audit d'intégrité des soldes vendeur.
//
// Formule pour store.balance :
//   + type=credit, direction=credit, status=completed   (releases + reversals payout)
//   - type=credit, direction=debit,  status=completed   (corrections audit — runs futurs)
//   - type=payout, direction=debit,  status IN [pending, completed]
//     (le débit est appliqué dès requestPayout, avant confirmation Moneroo)
//
// Formule pour store.pending_balance (rapport uniquement — pas de correction auto) :
//   + type=sale,   direction=credit, status=completed   (ventes → pending)
//   - type=refund, direction=debit,  status=completed   (remboursements déductibles de pending)
//   - releases (type=credit, direction=credit, description LIKE "Release commande %")
//
// Boutiques is_demo ignorées.
//
// Utiliser via :
//   npx convex run migrations/auditBalances:run '{"dry_run": true}'
//   npx convex run migrations/auditBalances:run '{"dry_run": false}'
//
// ⚠️  Toujours lancer dry_run=true en premier pour valider les écarts.

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

type DiscrepancyEntry = {
  storeId: string;
  storeName: string;
  currency: string;
  // balance
  actualBalance: number;
  expectedBalance: number;
  balanceDiff: number;
  // pending_balance (rapport uniquement)
  actualPending: number;
  expectedPending: number;
  pendingDiff: number;
  // correction
  corrected: boolean;
};

export const run = internalMutation({
  args: {
    dry_run: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dry_run = args.dry_run !== false; // default: true (sécurité)

    const stores = await ctx.db.query("stores").collect();
    const productionStores = stores.filter((s) => !s.is_demo);

    const discrepancies: DiscrepancyEntry[] = [];

    for (const store of productionStores) {
      const txs = await ctx.db
        .query("transactions")
        .withIndex("by_store", (q) => q.eq("store_id", store._id))
        .collect();

      // ── Balance (store.balance) ──────────────────────────────

      // +: releases (pending→balance) + reversals payout failé
      const creditIn = txs
        .filter(
          (t) =>
            t.type === "credit" &&
            t.direction === "credit" &&
            t.status === "completed",
        )
        .reduce((s, t) => s + t.amount, 0);

      // -: corrections audit appliquées lors de runs précédents
      const creditOut = txs
        .filter(
          (t) =>
            t.type === "credit" &&
            t.direction === "debit" &&
            t.status === "completed",
        )
        .reduce((s, t) => s + t.amount, 0);

      // -: retraits (débit au moment de requestPayout, avant confirmation)
      const payoutOut = txs
        .filter(
          (t) =>
            t.type === "payout" &&
            t.direction === "debit" &&
            (t.status === "pending" || t.status === "completed"),
        )
        .reduce((s, t) => s + t.amount, 0);

      const expectedBalance = creditIn - creditOut - payoutOut;
      const balanceDiff = expectedBalance - store.balance;

      // ── Pending balance (store.pending_balance) ─────────────

      // +: ventes créditées en attente de release
      const saleIn = txs
        .filter(
          (t) =>
            t.type === "sale" &&
            t.direction === "credit" &&
            t.status === "completed",
        )
        .reduce((s, t) => s + t.amount, 0);

      // -: remboursements déduits du pending (balance_before != balance_after = déduction réelle)
      const refundFromPending = txs
        .filter(
          (t) =>
            t.type === "refund" &&
            t.direction === "debit" &&
            t.status === "completed" &&
            t.balance_before !== t.balance_after,
        )
        .reduce((s, t) => s + t.amount, 0);

      // -: releases transférées de pending vers balance (décrits "Release commande XXX")
      const releaseOut = txs
        .filter(
          (t) =>
            t.type === "credit" &&
            t.direction === "credit" &&
            t.status === "completed" &&
            t.description.startsWith("Release commande"),
        )
        .reduce((s, t) => s + t.amount, 0);

      const expectedPending = saleIn - refundFromPending - releaseOut;
      const pendingDiff = expectedPending - store.pending_balance;

      // ── Vérification ────────────────────────────────────────

      const balanceOk = Math.abs(balanceDiff) < 1;
      const pendingOk = Math.abs(pendingDiff) < 1;

      if (balanceOk && pendingOk) continue;

      const entry: DiscrepancyEntry = {
        storeId: store._id,
        storeName: store.name,
        currency: store.currency,
        actualBalance: store.balance,
        expectedBalance,
        balanceDiff,
        actualPending: store.pending_balance,
        expectedPending,
        pendingDiff,
        corrected: false,
      };

      // ── Correction automatique du balance (F-01) ─────────────
      if (!balanceOk && !dry_run) {
        const balanceBefore = store.balance;
        const balanceAfter = expectedBalance;

        await ctx.db.insert("transactions", {
          store_id: store._id,
          type: "credit",
          direction: balanceDiff > 0 ? "credit" : "debit",
          amount: Math.abs(balanceDiff),
          currency: store.currency,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          status: "completed",
          description: `Correction audit solde ${balanceDiff > 0 ? "+" : ""}${balanceDiff}`,
          processed_at: Date.now(),
        });

        await ctx.db.patch(store._id, {
          balance: balanceAfter,
          updated_at: Date.now(),
        });

        entry.corrected = true;
      }

      discrepancies.push(entry);
    }

    return {
      dry_run,
      checked: productionStores.length,
      discrepancies: discrepancies.length,
      balance_corrected: discrepancies.filter((d) => d.corrected).length,
      details: discrepancies,
    };
  },
});
