// filepath: src/constants/cod.ts

/**
 * Constantes COD (Cash on Delivery) côté frontend.
 * Doivent rester synchronisées avec convex/lib/constants.ts.
 */

/** Montant maximum par défaut pour les commandes COD (XOF / centimes) */
export const COD_DEFAULT_MAX_AMOUNT = 50_000;

/** Nombre maximum de commandes COD actives simultanément par client */
export const COD_MAX_PENDING_ORDERS = 2;

/** Nb max de livraisons non honorées avant blocage automatique du COD */
export const COD_MAX_FAILURES = 3;
