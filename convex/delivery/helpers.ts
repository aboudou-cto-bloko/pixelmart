// filepath: convex/delivery/helpers.ts

import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";
import { generateBatchNumber } from "./constants";

/**
 * Génère le prochain numéro de lot séquentiel.
 */
export async function getNextBatchNumber(ctx: MutationCtx): Promise<string> {
  const year = new Date().getFullYear();
  const yearPrefix = `LOT-${year}-`;

  // Trouver le dernier lot de l'année
  const lastBatch = await ctx.db
    .query("delivery_batches")
    .order("desc")
    .first();

  let nextSequence = 1;

  if (lastBatch && lastBatch.batch_number.startsWith(yearPrefix)) {
    const lastSequence = parseInt(
      lastBatch.batch_number.replace(yearPrefix, ""),
      10,
    );
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  return generateBatchNumber(nextSequence);
}

/**
 * Vérifie que toutes les commandes appartiennent à la même boutique.
 */
export async function validateOrdersOwnership(
  ctx: QueryCtx,
  orderIds: Id<"orders">[],
  storeId: Id<"stores">,
): Promise<Doc<"orders">[]> {
  const orders: Doc<"orders">[] = [];

  for (const orderId of orderIds) {
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new Error(`Commande ${orderId} introuvable`);
    }
    if (order.store_id !== storeId) {
      throw new Error(
        `Commande ${order.order_number} n'appartient pas à votre boutique`,
      );
    }
    orders.push(order);
  }

  return orders;
}

/**
 * Vérifie que les commandes sont éligibles pour être ajoutées à un lot.
 * Conditions :
 * - Statut "processing" ou "ready_for_delivery"
 * - Pas déjà dans un autre lot actif
 * - payment_status = "paid" OU payment_mode = "cod"
 */
export function validateOrdersForBatch(orders: Doc<"orders">[]): void {
  for (const order of orders) {
    const eligibleStatuses = ["processing", "ready_for_delivery"];

    if (!eligibleStatuses.includes(order.status)) {
      throw new Error(
        `Commande ${order.order_number} : statut "${order.status}" non éligible (requis : en préparation ou prêt pour livraison)`,
      );
    }

    if (order.batch_id) {
      throw new Error(
        `Commande ${order.order_number} déjà assignée à un lot de livraison`,
      );
    }

    // Vérifier le paiement : soit payé, soit COD
    const isPaid = order.payment_status === "paid";
    const isCOD = order.payment_mode === "cod";

    if (!isPaid && !isCOD) {
      throw new Error(
        `Commande ${order.order_number} : paiement non confirmé et pas en mode "à la livraison"`,
      );
    }
  }
}

/**
 * Calcule le total des frais de livraison d'un lot.
 */
export function calculateBatchTotalFee(orders: Doc<"orders">[]): number {
  return orders.reduce((sum, order) => sum + (order.delivery_fee ?? 0), 0);
}
