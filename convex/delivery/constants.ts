// filepath: convex/delivery/constants.ts

/**
 * Grille tarifaire Pixel-Mart Livraison
 * Tous les montants en centimes XOF (1 XOF = 100 centimes)
 *
 * Source: Modèle de tarification affiché aux clients
 */

// ─── Types ───────────────────────────────────────────────────

export type DeliveryType = "standard" | "urgent" | "fragile";
export type PaymentMode = "online" | "cod";

// ─── Tarification Course Urgente/Fragile ─────────────────────

export const URGENT_FRAGILE_RATES = {
  // Palier 1: 1-5 km → 700 FCFA fixe
  tier1: {
    maxKm: 5,
    fixedPrice: 70000, // 700 FCFA en centimes
  },
  // Palier 2: 6-10 km → 200 FCFA/km
  tier2: {
    minKm: 6,
    maxKm: 10,
    pricePerKm: 20000, // 200 FCFA/km en centimes
  },
  // Palier 3: 11+ km → 150 FCFA/km
  tier3: {
    minKm: 11,
    pricePerKm: 15000, // 150 FCFA/km en centimes
  },
} as const;

// ─── Tarification Course Standard ────────────────────────────

export const STANDARD_RATES = {
  // Palier 1: 1-5 km → 600 FCFA fixe
  tier1: {
    maxKm: 5,
    fixedPrice: 60000, // 600 FCFA en centimes
  },
  // Palier 2: 6+ km → 170 FCFA/km
  tier2: {
    minKm: 6,
    pricePerKm: 17000, // 170 FCFA/km en centimes
  },
} as const;

// ─── Tarification Nuit (21h-06h) ─────────────────────────────

export const NIGHT_RATES = {
  startHour: 21, // 21:00
  endHour: 6, // 06:00
  pricePerKm: 25000, // 250 FCFA/km en centimes (tous les km)
} as const;

// ─── Supplément Poids ────────────────────────────────────────

export const WEIGHT_SURCHARGE = {
  thresholdKg: 20, // seuil en kg
  pricePerKg: 5000, // 50 FCFA/kg au-dessus du seuil, en centimes
} as const;

// ─── Helpers de calcul ───────────────────────────────────────

/**
 * Vérifie si l'heure actuelle est dans la plage tarifaire de nuit.
 */
export function isNightTime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= NIGHT_RATES.startHour || hour < NIGHT_RATES.endHour;
}

/**
 * Calcule les frais de livraison en centimes XOF.
 *
 * @param distanceKm - Distance en kilomètres
 * @param deliveryType - Type de course (standard, urgent, fragile)
 * @param weightKg - Poids total en kg (optionnel)
 * @param isNight - Tarification de nuit (optionnel, auto-détecté si non fourni)
 * @returns Frais de livraison en centimes
 */
export function calculateDeliveryFee(
  distanceKm: number,
  deliveryType: DeliveryType,
  weightKg: number = 0,
  isNight?: boolean,
): number {
  // Arrondir la distance au km supérieur
  const distance = Math.ceil(distanceKm);

  // Vérifier si tarification de nuit s'applique
  const nightRate = isNight ?? isNightTime();

  let baseFee: number;

  // ── Tarification de nuit (prioritaire) ──
  if (nightRate) {
    baseFee = distance * NIGHT_RATES.pricePerKm;
  }
  // ── Tarification urgent/fragile ──
  else if (deliveryType === "urgent" || deliveryType === "fragile") {
    if (distance <= URGENT_FRAGILE_RATES.tier1.maxKm) {
      baseFee = URGENT_FRAGILE_RATES.tier1.fixedPrice;
    } else if (distance <= URGENT_FRAGILE_RATES.tier2.maxKm) {
      baseFee = distance * URGENT_FRAGILE_RATES.tier2.pricePerKm;
    } else {
      baseFee = distance * URGENT_FRAGILE_RATES.tier3.pricePerKm;
    }
  }
  // ── Tarification standard ──
  else {
    if (distance <= STANDARD_RATES.tier1.maxKm) {
      baseFee = STANDARD_RATES.tier1.fixedPrice;
    } else {
      baseFee = distance * STANDARD_RATES.tier2.pricePerKm;
    }
  }

  // ── Supplément poids ──
  let weightSurcharge = 0;
  if (weightKg > WEIGHT_SURCHARGE.thresholdKg) {
    const extraKg = weightKg - WEIGHT_SURCHARGE.thresholdKg;
    weightSurcharge = extraKg * WEIGHT_SURCHARGE.pricePerKg;
  }

  return Math.round(baseFee + weightSurcharge);
}

/**
 * Formate les frais de livraison pour affichage.
 *
 * @param centimes - Montant en centimes
 * @returns String formaté (ex: "700 FCFA")
 */
export function formatDeliveryFee(centimes: number): string {
  const amount = Math.round(centimes / 100);
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

// ─── Batch Number Generation ─────────────────────────────────

/**
 * Génère un numéro de lot unique.
 * Format: LOT-{YEAR}-{XXXX}
 */
export function generateBatchNumber(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const paddedSequence = String(sequenceNumber).padStart(4, "0");
  return `LOT-${year}-${paddedSequence}`;
}

// ─── Delivery Statuses ───────────────────────────────────────

export const DELIVERY_BATCH_STATUSES = {
  pending: {
    label: "En attente",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    description: "Lot créé, en attente de transmission à l'admin",
  },
  transmitted: {
    label: "Transmis",
    color: "bg-blue-500",
    textColor: "text-blue-500",
    description: "Envoyé à l'administrateur",
  },
  assigned: {
    label: "Assigné",
    color: "bg-indigo-500",
    textColor: "text-indigo-500",
    description: "Assigné au service de livraison",
  },
  in_progress: {
    label: "En cours",
    color: "bg-purple-500",
    textColor: "text-purple-500",
    description: "Livraisons en cours",
  },
  completed: {
    label: "Terminé",
    color: "bg-green-500",
    textColor: "text-green-500",
    description: "Toutes les livraisons terminées",
  },
  cancelled: {
    label: "Annulé",
    color: "bg-red-500",
    textColor: "text-red-500",
    description: "Lot annulé",
  },
} as const;

export type DeliveryBatchStatus = keyof typeof DELIVERY_BATCH_STATUSES;

// ─── Delivery Types Labels ───────────────────────────────────

export const DELIVERY_TYPES = {
  standard: {
    label: "Standard",
    description: "Livraison normale (2-5 jours)",
    icon: "Package",
  },
  urgent: {
    label: "Urgente",
    description: "Livraison express (24-48h)",
    icon: "Zap",
  },
  fragile: {
    label: "Fragile",
    description: "Manipulation avec précaution",
    icon: "AlertTriangle",
  },
} as const;

// ─── Payment Modes Labels ────────────────────────────────────

export const PAYMENT_MODES = {
  online: {
    label: "Paiement en ligne",
    description: "Payer maintenant via Mobile Money",
    icon: "CreditCard",
  },
  cod: {
    label: "Paiement à la livraison",
    description: "Payer au livreur à la réception",
    icon: "Banknote",
  },
} as const;
