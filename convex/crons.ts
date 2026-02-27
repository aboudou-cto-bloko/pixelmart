// filepath: convex/crons.ts

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ─── Auto-confirm Delivery (toutes les 6h) ──────────────────
// Passe shipped → delivered si > 7 jours sans confirmation
crons.interval(
  "auto-confirm-delivery",
  { hours: 6 },
  internal.orders.mutations.autoConfirmDelivery,
);

// ─── Balance Release (toutes les heures) ─────────────────────
// Transfert pending_balance → balance quand delivered_at > 48h
crons.interval(
  "balance-release",
  { hours: 1 },
  internal.crons_handlers.releaseBalances,
);

// ─── Low Stock Alerts (toutes les 4h) ────────────────────────
// Vérifie les produits sous le seuil de stock et notifie les vendeurs
crons.interval(
  "low-stock-alerts",
  { hours: 4 },
  internal.crons_handlers.checkLowStock,
);

// ─── Stale Payout Check (toutes les 12h) ─────────────────────
// Vérifie les payouts "processing" depuis > 72h et les relance
crons.interval(
  "stale-payout-check",
  { hours: 12 },
  internal.crons_handlers.checkStalePayouts,
);

export default crons;
