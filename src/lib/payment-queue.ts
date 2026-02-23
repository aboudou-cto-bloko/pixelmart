// filepath: src/lib/payment-queue.ts

import type { Id } from "../../convex/_generated/dataModel";

const QUEUE_KEY = "pixelmart_payment_queue";
const PAID_KEY = "pixelmart_paid_orders";

export interface PaymentQueueState {
  /** Order IDs restants à payer */
  pending: Id<"orders">[];
  /** Order IDs + numéros déjà payés */
  paid: { orderId: Id<"orders">; orderNumber: string }[];
}

export function getPaymentQueue(): PaymentQueueState {
  if (typeof window === "undefined") {
    return { pending: [], paid: [] };
  }
  try {
    const pending = JSON.parse(
      localStorage.getItem(QUEUE_KEY) ?? "[]",
    ) as Id<"orders">[];
    const paid = JSON.parse(localStorage.getItem(PAID_KEY) ?? "[]") as {
      orderId: Id<"orders">;
      orderNumber: string;
    }[];
    return { pending, paid };
  } catch {
    return { pending: [], paid: [] };
  }
}

export function setPaymentQueue(orderIds: Id<"orders">[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(orderIds));
  localStorage.setItem(PAID_KEY, "[]");
}

export function markOrderPaid(
  orderId: Id<"orders">,
  orderNumber: string,
): void {
  if (typeof window === "undefined") return;
  const state = getPaymentQueue();

  // Retirer de pending
  const pending = state.pending.filter((id) => id !== orderId);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(pending));

  // Ajouter à paid
  const paid = [...state.paid, { orderId, orderNumber }];
  localStorage.setItem(PAID_KEY, JSON.stringify(paid));
}

export function clearPaymentQueue(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUEUE_KEY);
  localStorage.removeItem(PAID_KEY);
}

export function getNextPendingOrderId(): Id<"orders"> | null {
  const state = getPaymentQueue();
  return state.pending[0] ?? null;
}

export function getAllPaidOrderNumbers(): string[] {
  const state = getPaymentQueue();
  return state.paid.map((p) => p.orderNumber);
}
