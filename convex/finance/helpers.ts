// filepath: convex/finance/helpers.ts

import type { MutationCtx, QueryCtx } from "../_generated/server";

// ─── Invoice Number ──────────────────────────────────────────

/**
 * Génère un numéro de facture : INV-2026-0001
 * Basé sur le nombre total d'ordres livrés/payés de la boutique.
 */
export function generateInvoiceNumber(orderNumber: string): string {
  // PM-2026-0042 → INV-2026-0042
  return orderNumber.replace("PM-", "INV-");
}

// ─── Period Helpers ──────────────────────────────────────────

/**
 * Retourne les bornes d'une période en timestamps.
 */
export function getPeriodBounds(period: "7d" | "30d" | "90d" | "12m" | "all"): {
  start: number;
  end: number;
} {
  const end = Date.now();
  const DAY = 86_400_000;

  switch (period) {
    case "7d":
      return { start: end - 7 * DAY, end };
    case "30d":
      return { start: end - 30 * DAY, end };
    case "90d":
      return { start: end - 90 * DAY, end };
    case "12m":
      return { start: end - 365 * DAY, end };
    case "all":
      return { start: 0, end };
  }
}

/**
 * Groupe des timestamps par jour (YYYY-MM-DD).
 */
export function timestampToDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

/**
 * Groupe des timestamps par mois (YYYY-MM).
 */
export function timestampToMonthKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 7);
}
