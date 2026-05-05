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
   * COD pour les boutiques indépendantes (Scénario C : vendeur gère sa propre livraison).
   * Le vendeur encaisse lui-même — pas de réconciliation agent nécessaire.
   * Activé : opt-in par boutique via cod_enabled + contraintes anti-abus.
   */
  COD_ENABLED_INDEPENDENT: true,

  /**
   * COD pour les boutiques avec service Pixel-Mart (Scénarios A/B).
   * Nécessite un flux de réconciliation agent (Phase 2 — non implémenté).
   */
  COD_ENABLED_PM: false,

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
