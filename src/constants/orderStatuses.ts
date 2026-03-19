// filepath: src/constants/orderStatuses.ts
export const ORDER_STATUSES = {
  pending: {
    label: "En attente",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    icon: "Clock",
  },
  paid: {
    label: "Payé",
    color: "bg-blue-500",
    textColor: "text-blue-500",
    icon: "CreditCard",
  },
  processing: {
    label: "En préparation",
    color: "bg-indigo-500",
    textColor: "text-indigo-500",
    icon: "Package",
  },
  ready_for_delivery: {
    label: "Prêt pour livraison",
    color: "bg-cyan-500",
    textColor: "text-cyan-500",
    icon: "PackageCheck",
  },
  shipped: {
    label: "Expédié",
    color: "bg-purple-500",
    textColor: "text-purple-500",
    icon: "Truck",
  },
  delivered: {
    label: "Livré",
    color: "bg-green-500",
    textColor: "text-green-500",
    icon: "CheckCircle",
  },
  delivery_failed: {
    label: "Échec livraison",
    color: "bg-orange-500",
    textColor: "text-orange-500",
    icon: "XCircle",
  },
  cancelled: {
    label: "Annulé",
    color: "bg-red-500",
    textColor: "text-red-500",
    icon: "XCircle",
  },
  refunded: {
    label: "Remboursé",
    color: "bg-gray-500",
    textColor: "text-gray-500",
    icon: "RotateCcw",
  },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;

// Transitions autorisées — mise à jour avec le workflow livraison
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["processing", "cancelled", "refunded"],
  processing: ["ready_for_delivery", "shipped", "cancelled"],
  ready_for_delivery: ["shipped", "cancelled"],
  shipped: ["delivered", "delivery_failed"],
  delivered: ["refunded"],
  delivery_failed: ["shipped", "refunded", "cancelled"], // peut être re-expédié
  cancelled: [],
  refunded: [],
};
