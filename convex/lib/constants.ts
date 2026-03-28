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

// ── Stockage entrepôt ─────────────────────────────────────────────────────────

/** Préfixe des codes de stockage (ex: PM-102) */
export const STORAGE_CODE_PREFIX = "PM";

/**
 * Tarifs de stockage — valeurs XOF.
 *
 * Pour XOF : centimes = valeur FCFA (pas de ÷100).
 *
 * Palier unités :
 *   ≤ 50 unités  → 100 XOF/unité
 *   > 50 unités  →  60 XOF/unité
 *
 * Palier poids :
 *    0–5 kg      → inclus dans le palier unités (ou gratuit si uniquement du poids)
 *   5–25 kg      → 5 000 XOF forfait
 *   > 25 kg      → 5 000 XOF + 250 XOF/kg supplémentaire au-dessus de 25 kg
 */
export const STORAGE_FEES = {
  /** 100 XOF par unité (≤ 50 unités) */
  PER_UNIT: 100,
  /** 60 XOF par unité (> 50 unités) */
  PER_UNIT_BULK: 60,
  /** Seuil de basculement vers le tarif bulk */
  BULK_THRESHOLD_UNITS: 50,
  /** Forfait 5–25 kg : 5 000 XOF */
  MEDIUM_KG_FLAT: 5_000,
  /** Base > 25 kg : 5 000 XOF */
  HEAVY_BASE: 5_000,
  /** Surcoût > 25 kg : 250 XOF par kg supplémentaire */
  HEAVY_PER_KG: 250,
  /** Seuil medium/heavy en kg */
  MEDIUM_MAX_KG: 25,
  /** Seuil free/medium en kg */
  FREE_MAX_KG: 5,
} as const;

/**
 * Délai avant blocage du retrait si facture impayée (30 jours).
 * Règle F-06 : un vendeur avec une facture impayée > 30 j ne peut pas
 * retirer ses produits physiques.
 */
export const STORAGE_DEBT_BLOCK_DELAY_MS = 30 * 24 * 60 * 60 * 1000;
