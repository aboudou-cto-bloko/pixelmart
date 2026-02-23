// filepath: src/lib/order-helpers.ts

import type { Doc } from "../../convex/_generated/dataModel";

type OrderStatus = Doc<"orders">["status"];
type PaymentStatus = Doc<"orders">["payment_status"];

// ─── Order Status ────────────────────────────────────────────

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

const ORDER_STATUS_MAP: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: "En attente",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
  },
  paid: {
    label: "Payée",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
  },
  processing: {
    label: "En traitement",
    color: "text-indigo-700 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
  },
  shipped: {
    label: "Expédiée",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
  },
  delivered: {
    label: "Livrée",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
  cancelled: {
    label: "Annulée",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/20",
  },
  refunded: {
    label: "Remboursée",
    color: "text-gray-700 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-900/20",
  },
};

export function getOrderStatusConfig(status: OrderStatus): StatusConfig {
  return ORDER_STATUS_MAP[status] ?? ORDER_STATUS_MAP.pending;
}

// ─── Payment Status ──────────────────────────────────────────

const PAYMENT_STATUS_MAP: Record<PaymentStatus, StatusConfig> = {
  pending: {
    label: "En attente",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
  },
  paid: {
    label: "Payé",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/20",
  },
  failed: {
    label: "Échoué",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/20",
  },
  refunded: {
    label: "Remboursé",
    color: "text-gray-700 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-900/20",
  },
};

export function getPaymentStatusConfig(status: PaymentStatus): StatusConfig {
  return PAYMENT_STATUS_MAP[status] ?? PAYMENT_STATUS_MAP.pending;
}

// ─── Timeline Steps ──────────────────────────────────────────

interface TimelineStep {
  label: string;
  status: "done" | "active" | "upcoming";
}

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Commande créée",
  paid: "Paiement confirmé",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
};

export function getOrderTimeline(status: OrderStatus): TimelineStep[] {
  if (status === "cancelled" || status === "refunded") {
    const config = getOrderStatusConfig(status);
    return [{ label: config.label, status: "active" }];
  }

  const currentIndex = STATUS_ORDER.indexOf(status);

  return STATUS_ORDER.map((s, i) => ({
    label: STATUS_LABELS[s] ?? s,
    status:
      i < currentIndex ? "done" : i === currentIndex ? "active" : "upcoming",
  }));
}

// ─── Date Formatting ─────────────────────────────────────────

export function formatOrderDate(timestamp: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function formatShortDate(timestamp: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}
