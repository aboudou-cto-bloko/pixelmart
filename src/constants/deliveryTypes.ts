// filepath: src/constants/deliveryTypes.ts

/**
 * Types de livraison pour le frontend.
 * Miroir de convex/delivery/constants.ts pour le client.
 */

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

export type DeliveryType = keyof typeof DELIVERY_TYPES;

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

export type PaymentMode = keyof typeof PAYMENT_MODES;

export const DELIVERY_BATCH_STATUSES = {
  pending: {
    label: "En attente",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
  },
  transmitted: {
    label: "Transmis",
    color: "bg-blue-500",
    textColor: "text-blue-500",
  },
  assigned: {
    label: "Assigné",
    color: "bg-indigo-500",
    textColor: "text-indigo-500",
  },
  in_progress: {
    label: "En cours",
    color: "bg-purple-500",
    textColor: "text-purple-500",
  },
  completed: {
    label: "Terminé",
    color: "bg-green-500",
    textColor: "text-green-500",
  },
  cancelled: {
    label: "Annulé",
    color: "bg-red-500",
    textColor: "text-red-500",
  },
} as const;

export type DeliveryBatchStatus = keyof typeof DELIVERY_BATCH_STATUSES;
