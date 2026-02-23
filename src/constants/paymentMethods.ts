// filepath: src/constants/paymentMethods.ts

import type { CountryCode } from "./countries";

export interface PaymentMethodConfig {
  id: string;
  label: string;
  description: string;
  provider: "moneroo" | "stripe";
  /** Pays où cette méthode est disponible */
  countries: readonly CountryCode[];
  /** Identifiant Moneroo (ex: "mtn_bj", "orange_ci") */
  monerooMethod?: string;
  type: "mobile_money" | "card" | "bank_transfer";
}

/**
 * Source de vérité pour les méthodes de paiement.
 * Aligné avec la doc Moneroo : https://docs.moneroo.io/payments/available-methods
 * et les pays supportés dans src/constants/countries.ts
 */
export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  // ── MTN Mobile Money ──
  {
    id: "moneroo_mtn_bj",
    label: "MTN Mobile Money",
    description: "Paiement via MTN MoMo",
    provider: "moneroo",
    monerooMethod: "mtn_bj",
    countries: ["BJ"],
    type: "mobile_money",
  },
  {
    id: "moneroo_mtn_ci",
    label: "MTN Mobile Money",
    description: "Paiement via MTN MoMo",
    provider: "moneroo",
    monerooMethod: "mtn_ci",
    countries: ["CI"],
    type: "mobile_money",
  },
  {
    id: "moneroo_mtn_cm",
    label: "MTN Mobile Money",
    description: "Paiement via MTN MoMo",
    provider: "moneroo",
    monerooMethod: "mtn_cm",
    countries: ["CM"],
    type: "mobile_money",
  },
  {
    id: "moneroo_mtn_gn",
    label: "MTN Mobile Money",
    description: "Paiement via MTN MoMo",
    provider: "moneroo",
    monerooMethod: "mtn_gn",
    countries: ["GN"],
    type: "mobile_money",
  },

  // ── Orange Money ──
  {
    id: "moneroo_orange_ci",
    label: "Orange Money",
    description: "Paiement via Orange Money",
    provider: "moneroo",
    monerooMethod: "orange_ci",
    countries: ["CI"],
    type: "mobile_money",
  },
  {
    id: "moneroo_orange_cm",
    label: "Orange Money",
    description: "Paiement via Orange Money",
    provider: "moneroo",
    monerooMethod: "orange_cm",
    countries: ["CM"],
    type: "mobile_money",
  },
  {
    id: "moneroo_orange_sn",
    label: "Orange Money",
    description: "Paiement via Orange Money",
    provider: "moneroo",
    monerooMethod: "orange_sn",
    countries: ["SN"],
    type: "mobile_money",
  },
  {
    id: "moneroo_orange_ml",
    label: "Orange Money",
    description: "Paiement via Orange Money",
    provider: "moneroo",
    monerooMethod: "orange_ml",
    countries: ["ML"],
    type: "mobile_money",
  },
  {
    id: "moneroo_orange_bf",
    label: "Orange Money",
    description: "Paiement via Orange Money",
    provider: "moneroo",
    monerooMethod: "orange_bf",
    countries: ["BF"],
    type: "mobile_money",
  },
  {
    id: "moneroo_orange_gn",
    label: "Orange Money",
    description: "Paiement via Orange Money",
    provider: "moneroo",
    monerooMethod: "orange_gn",
    countries: ["GN"],
    type: "mobile_money",
  },

  // ── Wave ──
  {
    id: "moneroo_wave_sn",
    label: "Wave",
    description: "Paiement via Wave",
    provider: "moneroo",
    monerooMethod: "wave_sn",
    countries: ["SN"],
    type: "mobile_money",
  },
  {
    id: "moneroo_wave_ci",
    label: "Wave",
    description: "Paiement via Wave",
    provider: "moneroo",
    monerooMethod: "wave_ci",
    countries: ["CI"],
    type: "mobile_money",
  },
  {
    id: "moneroo_wave_ml",
    label: "Wave",
    description: "Paiement via Wave",
    provider: "moneroo",
    monerooMethod: "wave_ml",
    countries: ["ML"],
    type: "mobile_money",
  },
  {
    id: "moneroo_wave_bf",
    label: "Wave",
    description: "Paiement via Wave",
    provider: "moneroo",
    monerooMethod: "wave_bf",
    countries: ["BF"],
    type: "mobile_money",
  },

  // ── Moov Money ──
  {
    id: "moneroo_moov_bj",
    label: "Moov Money",
    description: "Paiement via Moov Money",
    provider: "moneroo",
    monerooMethod: "moov_bj",
    countries: ["BJ"],
    type: "mobile_money",
  },
  {
    id: "moneroo_moov_tg",
    label: "Moov Money (Flooz)",
    description: "Paiement via Flooz",
    provider: "moneroo",
    monerooMethod: "moov_tg",
    countries: ["TG"],
    type: "mobile_money",
  },
  {
    id: "moneroo_moov_ne",
    label: "Moov Money",
    description: "Paiement via Moov Money",
    provider: "moneroo",
    monerooMethod: "moov_ne",
    countries: ["NE"],
    type: "mobile_money",
  },
  {
    id: "moneroo_moov_ci",
    label: "Moov Money",
    description: "Paiement via Moov Money",
    provider: "moneroo",
    monerooMethod: "moov_ci",
    countries: ["CI"],
    type: "mobile_money",
  },

  // ── Wizall ──
  {
    id: "moneroo_wizall_sn",
    label: "Wizall",
    description: "Paiement via Wizall",
    provider: "moneroo",
    monerooMethod: "wizall_sn",
    countries: ["SN"],
    type: "mobile_money",
  },

  // ── Carte bancaire (Stripe — pays hors Afrique + fallback) ──
  {
    id: "stripe_card",
    label: "Carte bancaire",
    description: "Visa, Mastercard, AMEX",
    provider: "stripe",
    countries: [
      "FR",
      "BE",
      "CH",
      "CA",
      "BJ",
      "SN",
      "CI",
      "CM",
      "GA",
      "TG",
      "BF",
      "ML",
      "NE",
      "GN",
      "CD",
    ],
    type: "card",
  },
] as const;

/**
 * Retourne les méthodes de paiement disponibles pour un pays donné.
 */
export function getPaymentMethodsForCountry(
  country: CountryCode,
): PaymentMethodConfig[] {
  return PAYMENT_METHODS.filter((m) =>
    (m.countries as readonly string[]).includes(country),
  );
}

/**
 * Retourne une méthode par son ID.
 */
export function getPaymentMethodById(
  id: string,
): PaymentMethodConfig | undefined {
  return PAYMENT_METHODS.find((m) => m.id === id);
}
