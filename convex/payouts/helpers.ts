// filepath: convex/payouts/helpers.ts

import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";

// ─── Constants ───────────────────────────────────────────────

/** Minimum payout: 100 centimes = 1 XOF / 0.01 EUR */
export const MIN_PAYOUT_AMOUNT = 100;

/** Cooldown entre deux demandes de payout : 24h */
const PAYOUT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** Méthodes Moneroo pour le Bénin / Afrique de l'Ouest */
export const MONEROO_PAYOUT_METHODS: Record<string, string> = {
  mtn_bj: "MTN Mobile Money (Bénin)",
  moov_bj: "Moov Money (Bénin)",
  mtn_ci: "MTN Mobile Money (Côte d'Ivoire)",
  orange_ci: "Orange Money (Côte d'Ivoire)",
  wave_ci: "Wave (Côte d'Ivoire)",
  wave_sn: "Wave (Sénégal)",
  orange_sn: "Orange Money (Sénégal)",
  togocel: "Togocel Money (Togo)",
};

// ─── Validation ──────────────────────────────────────────────

interface PayoutValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valide qu'un payout peut être initié.
 * Règles :
 *  1. store.balance >= amount
 *  2. amount >= MIN_PAYOUT_AMOUNT
 *  3. Pas de payout "processing" en cours sur la même boutique
 *  4. Cooldown de 24h depuis le dernier payout complété
 */
export async function validatePayoutRequest(
  ctx: QueryCtx | MutationCtx,
  store: Doc<"stores">,
  amount: number,
): Promise<PayoutValidationResult> {
  // 1. Montant minimum
  if (amount < MIN_PAYOUT_AMOUNT) {
    return {
      valid: false,
      error: `Montant minimum : ${MIN_PAYOUT_AMOUNT / 100} XOF`,
    };
  }

  // 2. Solde suffisant
  if (store.balance < amount) {
    return {
      valid: false,
      error: `Solde insuffisant. Disponible : ${store.balance / 100} XOF`,
    };
  }

  // 3. Pas de payout en cours
  const processing = await ctx.db
    .query("payouts")
    .withIndex("by_store", (q) => q.eq("store_id", store._id))
    .filter((q) => q.eq(q.field("status"), "processing"))
    .first();

  if (processing) {
    return {
      valid: false,
      error: "Un retrait est déjà en cours de traitement",
    };
  }

  // 4. Cooldown 24h
  const recentCompleted = await ctx.db
    .query("payouts")
    .withIndex("by_store", (q) => q.eq("store_id", store._id))
    .filter((q) => q.eq(q.field("status"), "completed"))
    .order("desc")
    .first();

  if (recentCompleted?.processed_at) {
    const elapsed = Date.now() - recentCompleted.processed_at;
    if (elapsed < PAYOUT_COOLDOWN_MS) {
      const remainingH = Math.ceil(
        (PAYOUT_COOLDOWN_MS - elapsed) / (60 * 60 * 1000),
      );
      return {
        valid: false,
        error: `Veuillez patienter ${remainingH}h avant le prochain retrait`,
      };
    }
  }

  return { valid: true };
}

// ─── Fee Calculation ─────────────────────────────────────────

/**
 * Calcule les frais de payout.
 * Mobile money XOF : 1% avec minimum 100 centimes (1 XOF).
 */
export function calculatePayoutFee(amount: number, method: string): number {
  // Mobile money : 1% min 100 centimes
  if (method === "mobile_money") {
    return Math.max(100, Math.round(amount * 0.01));
  }
  // Bank transfer : 1.5% min 500 centimes
  if (method === "bank_transfer") {
    return Math.max(500, Math.round(amount * 0.015));
  }
  // PayPal : 2%
  if (method === "paypal") {
    return Math.round(amount * 0.02);
  }
  return 0;
}
