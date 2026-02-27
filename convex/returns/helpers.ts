// filepath: convex/returns/helpers.ts

import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// ─── Constants ───────────────────────────────────────────────────

/** Délai maximum pour demander un retour : 48h après livraison */
const RETURN_WINDOW_MS = 48 * 60 * 60 * 1000;

/** Catégories de raison de retour */
export const RETURN_REASON_CATEGORIES = [
  { value: "defective", label: "Produit défectueux" },
  { value: "wrong_item", label: "Mauvais article reçu" },
  { value: "not_as_described", label: "Non conforme à la description" },
  { value: "changed_mind", label: "Changement d'avis" },
  { value: "damaged_in_transit", label: "Endommagé pendant le transport" },
  { value: "other", label: "Autre raison" },
] as const;

export type ReturnReasonCategory =
  (typeof RETURN_REASON_CATEGORIES)[number]["value"];

// ─── Status Transitions ─────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  requested: ["approved", "rejected"],
  approved: ["received"],
  received: ["refunded"],
  // rejected and refunded are terminal
};

/**
 * Valide qu'une transition de statut est permise.
 * Throws si la transition est interdite.
 */
export function assertValidReturnTransition(
  currentStatus: string,
  newStatus: string,
): void {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(`Transition interdite : ${currentStatus} → ${newStatus}`);
  }
}

// ─── Eligibility Check ──────────────────────────────────────────

interface ReturnEligibility {
  eligible: boolean;
  reason?: string;
}

/**
 * Vérifie si une commande est éligible au retour.
 *
 * Règles :
 *  1. Commande en statut "delivered"
 *  2. delivered_at + 48h non dépassé
 *  3. Pas de retour déjà en cours (requested/approved/received)
 */
export async function canRequestReturn(
  ctx: QueryCtx | MutationCtx,
  order: Doc<"orders">,
): Promise<ReturnEligibility> {
  // 1. Statut "delivered" uniquement
  if (order.status !== "delivered") {
    return {
      eligible: false,
      reason: "Seule une commande livrée peut faire l'objet d'un retour",
    };
  }

  // 2. Fenêtre de 48h
  if (!order.delivered_at) {
    return {
      eligible: false,
      reason: "Date de livraison non enregistrée",
    };
  }

  const elapsed = Date.now() - order.delivered_at;
  if (elapsed > RETURN_WINDOW_MS) {
    const hoursAgo = Math.floor(elapsed / (60 * 60 * 1000));
    return {
      eligible: false,
      reason: `Le délai de retour de 48h est dépassé (livré il y a ${hoursAgo}h)`,
    };
  }

  // 3. Pas de retour actif
  const activeReturn = await ctx.db
    .query("return_requests")
    .withIndex("by_order", (q) => q.eq("order_id", order._id))
    .filter((q) =>
      q.or(
        q.eq(q.field("status"), "requested"),
        q.eq(q.field("status"), "approved"),
        q.eq(q.field("status"), "received"),
      ),
    )
    .first();

  if (activeReturn) {
    return {
      eligible: false,
      reason: "Un retour est déjà en cours pour cette commande",
    };
  }

  return { eligible: true };
}

// ─── Return Items Validation ────────────────────────────────────

interface ReturnItemInput {
  product_id: Id<"products">;
  variant_id?: Id<"product_variants">;
  quantity: number;
}

interface ValidatedReturnItem {
  product_id: Id<"products">;
  variant_id?: Id<"product_variants">;
  title: string;
  quantity: number;
  unit_price: number;
}

/**
 * Valide les items à retourner contre la commande originale.
 *
 * Vérifie :
 *  - Chaque item existe dans la commande
 *  - La quantité retournée ≤ quantité commandée
 *  - Au moins 1 item valide
 */
export function validateReturnItems(
  orderItems: Doc<"orders">["items"],
  returnItems: ReturnItemInput[],
): ValidatedReturnItem[] {
  if (returnItems.length === 0) {
    throw new Error("Au moins un article doit être retourné");
  }

  const validated: ValidatedReturnItem[] = [];

  for (const returnItem of returnItems) {
    // Trouver l'item correspondant dans la commande
    const orderItem = orderItems.find((oi) => {
      const productMatch = oi.product_id === returnItem.product_id;
      const variantMatch = returnItem.variant_id
        ? oi.variant_id === returnItem.variant_id
        : !oi.variant_id;
      return productMatch && variantMatch;
    });

    if (!orderItem) {
      throw new Error(
        `Article ${returnItem.product_id} non trouvé dans la commande`,
      );
    }

    if (returnItem.quantity <= 0) {
      throw new Error("La quantité retournée doit être supérieure à 0");
    }

    if (returnItem.quantity > orderItem.quantity) {
      throw new Error(
        `Quantité retournée (${returnItem.quantity}) supérieure à la quantité commandée (${orderItem.quantity}) pour "${orderItem.title}"`,
      );
    }

    validated.push({
      product_id: returnItem.product_id,
      variant_id: returnItem.variant_id,
      title: orderItem.title,
      quantity: returnItem.quantity,
      unit_price: orderItem.unit_price,
    });
  }

  return validated;
}

// ─── Refund Amount Calculation ──────────────────────────────────

/**
 * Calcule le montant du remboursement basé sur les items retournés.
 * Retourne le montant en centimes.
 */
export function calculateRefundAmount(items: ValidatedReturnItem[]): number {
  return items.reduce(
    (total, item) => total + item.unit_price * item.quantity,
    0,
  );
}

/**
 * Détermine si le retour couvre la totalité de la commande.
 * Utilisé pour décider si order.payment_status → "refunded".
 */
export function isFullReturn(
  orderItems: Doc<"orders">["items"],
  returnItems: ValidatedReturnItem[],
): boolean {
  return orderItems.every((orderItem) => {
    const returnItem = returnItems.find((ri) => {
      const productMatch = ri.product_id === orderItem.product_id;
      const variantMatch = ri.variant_id
        ? ri.variant_id === orderItem.variant_id
        : !orderItem.variant_id;
      return productMatch && variantMatch;
    });
    return returnItem && returnItem.quantity === orderItem.quantity;
  });
}
