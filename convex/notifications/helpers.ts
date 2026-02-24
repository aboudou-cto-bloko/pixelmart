// filepath: convex/notifications/helpers.ts

import type { Id } from "../_generated/dataModel";

// ─── Notification Types ──────────────────────────────────────

export const NOTIFICATION_TYPES = {
  order_new: {
    label: "Nouvelle commande",
    icon: "shopping-cart",
    defaultChannels: ["email", "in_app"],
  },
  order_status: {
    label: "Statut commande",
    icon: "package",
    defaultChannels: ["email", "in_app"],
  },
  low_stock: {
    label: "Stock faible",
    icon: "alert-triangle",
    defaultChannels: ["email", "in_app"],
  },
  payment: {
    label: "Paiement",
    icon: "wallet",
    defaultChannels: ["email", "in_app"],
  },
  review: {
    label: "Nouvel avis",
    icon: "star",
    defaultChannels: ["in_app"],
  },
  system: {
    label: "Système",
    icon: "info",
    defaultChannels: ["in_app"],
  },
  promo: {
    label: "Promotion",
    icon: "tag",
    defaultChannels: ["in_app"],
  },
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

// ─── Notification Payloads ───────────────────────────────────

export interface OrderNotificationPayload {
  orderId: Id<"orders">;
  orderNumber: string;
  storeName: string;
  totalAmount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    image_url: string;
  }>;
}

export interface OrderStatusPayload {
  orderId: Id<"orders">;
  orderNumber: string;
  storeName: string;
  previousStatus: string;
  newStatus: string;
  customerName: string;
  customerEmail: string;
  trackingNumber?: string;
  carrier?: string;
}

export interface LowStockPayload {
  productId: Id<"products">;
  productTitle: string;
  currentQuantity: number;
  threshold: number;
  vendorEmail: string;
  storeName: string;
}

export interface PayoutPayload {
  payoutId: Id<"payouts">;
  amount: number;
  currency: string;
  method: string;
  vendorName: string;
  vendorEmail: string;
  storeName: string;
}

export interface ReviewPayload {
  reviewId: Id<"reviews">;
  productTitle: string;
  rating: number;
  customerName: string;
  vendorEmail: string;
  storeName: string;
}

// ─── Status Labels ───────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "En attente de paiement",
  paid: "Payée",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

export function getStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}
