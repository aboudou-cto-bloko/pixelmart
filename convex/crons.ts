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

crons.interval(
  "auto-publish-reviews",
  { hours: 1 }, // Vérifier toutes les heures
  internal.crons_handlers.autoPublishReviews,
);

crons.interval(
  "process-ad-bookings",
  { minutes: 15 }, // Toutes les 15 min
  internal.crons_handlers.processAdBookings,
);

// ─── Expire Pending Orders (toutes les 10min) ────────────────
// • Commandes avec payment_reference > 15min → verifyPayment (détection rapide d'échec)
// • Commandes sans payment_reference > 2h → annulation directe (panier abandonné)
crons.interval(
  "expire-pending-orders",
  { minutes: 10 },
  internal.crons_handlers.expirePendingOrders,
);

// ─── Wishlist Reminders (toutes les 24h) ─────────────────────
// Envoie un email de relance aux utilisateurs dont des articles en wishlist
// ont été ajoutés il y a 7-8 jours (une seule relance par article).
crons.interval(
  "wishlist-reminders",
  { hours: 24 },
  internal.crons_handlers.sendWishlistReminders,
);

// ─── Expire Stale Storage Requests (toutes les 6h) ───────────
// Auto-rejette les demandes pending_drop_off de plus de 30 jours
crons.interval(
  "expire-stale-storage-requests",
  { hours: 6 },
  internal.crons_handlers.expireStaleStorageRequests,
);

// ─── Notify Overdue Storage Debts (toutes les 24h) ───────────
// Notifie les vendeurs dont la facture de stockage est impayée > 30 jours
crons.interval(
  "notify-overdue-storage-debts",
  { hours: 24 },
  internal.crons_handlers.notifyOverdueStorageDebts,
);

// ─── Expire Affiliate Links (toutes les 24h) ─────────────────
// Désactive les liens affiliés dont la date d'expiration est dépassée
crons.interval(
  "expire-affiliate-links",
  { hours: 24 },
  internal.crons_handlers.expireAffiliateLinks,
);

export default crons;
