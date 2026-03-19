// filepath: src/constants/features.ts

/**
 * Feature flags pour activer/désactiver des fonctionnalités.
 *
 * Usage:
 *   import { FEATURES } from "@/constants/features";
 *   if (FEATURES.COD_ENABLED) { ... }
 */
export const FEATURES = {
  /**
   * Paiement à la livraison (Cash On Delivery)
   * Désactivé en attendant l'implémentation du flux financier COD
   * @see convex/finance/mutations.ts - createSaleTransaction
   */
  COD_ENABLED: false,

  /**
   * Système de livraison avec lots
   * Activé - implémentation complète
   */
  DELIVERY_BATCHES_ENABLED: true,

  /**
   * Geocoding OpenStreetMap pour calcul distance
   * Activé - remplace les zones statiques
   */
  OSM_GEOCODING_ENABLED: true,
} as const;

export type FeatureFlag = keyof typeof FEATURES;
