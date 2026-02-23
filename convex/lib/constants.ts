// filepath: convex/lib/constants.ts

/**
 * Source de vérité backend pour les taux de commission.
 * DOIT être synchronisé avec src/constants/subscriptionPlans.ts
 *
 * Note : les fichiers convex/ ne peuvent pas importer depuis src/
 * car ils tournent dans le runtime Convex (pas Next.js).
 */

export const COMMISSION_RATES = {
  free: 500, // 5% — basis points
  pro: 300, // 3%
  business: 200, // 2%
} as const;

export type SubscriptionTier = keyof typeof COMMISSION_RATES;

/** Devise par défaut du système */
export const DEFAULT_CURRENCY = "XOF";

/** Délai d'annulation client après paiement (2 heures) */
export const CANCELLATION_WINDOW_MS = 2 * 60 * 60 * 1000;

/** Délai avant libération du solde vendor (48 heures) */
export const BALANCE_RELEASE_DELAY_MS = 48 * 60 * 60 * 1000;

/** Format du numéro de commande */
export const ORDER_NUMBER_PREFIX = "PM";
