// filepath: convex/orders/helpers.ts

import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import {
  COMMISSION_RATES,
  CANCELLATION_WINDOW_MS,
  ORDER_NUMBER_PREFIX,
  type SubscriptionTier,
} from "../lib/constants";

// ─── Order Number ────────────────────────────────────────────

/**
 * Génère un numéro de commande séquentiel : PM-2026-0001
 */
export async function generateOrderNumber(ctx: MutationCtx): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${ORDER_NUMBER_PREFIX}-${year}-`;

  const lastOrder = await ctx.db
    .query("orders")
    .withIndex("by_order_number")
    .order("desc")
    .first();

  let nextSeq = 1;
  if (lastOrder && lastOrder.order_number.startsWith(prefix)) {
    const lastSeq = parseInt(lastOrder.order_number.slice(prefix.length), 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

// ─── Status Machine ──────────────────────────────────────────

type OrderStatus = Doc<"orders">["status"];

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["processing", "cancelled", "refunded"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertValidTransition(
  from: OrderStatus,
  to: OrderStatus,
): void {
  if (!isValidTransition(from, to)) {
    throw new Error(`Transition de statut invalide : ${from} → ${to}`);
  }
}

// ─── Cancellation Rules ──────────────────────────────────────

/**
 * Un client peut annuler :
 * - pending : toujours
 * - paid : dans les 2h suivant la création
 */
export function canCustomerCancel(order: Doc<"orders">): boolean {
  if (order.status === "pending") return true;
  if (order.status === "paid") {
    return Date.now() - order._creationTime <= CANCELLATION_WINDOW_MS;
  }
  return false;
}

/**
 * Un vendor peut annuler uniquement en status "processing".
 */
export function canVendorCancel(order: Doc<"orders">): boolean {
  return order.status === "processing";
}

// ─── Commission ──────────────────────────────────────────────

/**
 * Retourne le taux de commission en basis points selon le plan.
 * Source de vérité : convex/lib/constants.ts
 */
export function getCommissionRate(tier: SubscriptionTier): number {
  return COMMISSION_RATES[tier] ?? COMMISSION_RATES.free;
}

/**
 * F-04: commission_amount = total_amount × commission_rate / 10000
 */
export function calculateCommission(
  totalAmount: number,
  commissionRate: number,
): number {
  return Math.round((totalAmount * commissionRate) / 10000);
}

// ─── Order Item Types ────────────────────────────────────────

export interface OrderItemInput {
  productId: Id<"products">;
  variantId?: Id<"product_variants">;
  quantity: number;
}

/** Type conforme au schema orders.items */
export interface ValidatedOrderItem {
  product_id: Id<"products">;
  variant_id?: Id<"product_variants">;
  title: string;
  sku?: string;
  image_url: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// ─── Item Validation ─────────────────────────────────────────

/**
 * Valide les items, vérifie le stock, retourne les items enrichis.
 */
export async function validateAndBuildItems(
  ctx: MutationCtx,
  storeId: Id<"stores">,
  items: OrderItemInput[],
): Promise<ValidatedOrderItem[]> {
  if (items.length === 0) {
    throw new Error("La commande doit contenir au moins un article");
  }

  const validatedItems: ValidatedOrderItem[] = [];

  for (const item of items) {
    const product = await ctx.db.get(item.productId);
    if (!product) {
      throw new Error(`Produit introuvable : ${item.productId}`);
    }

    if (product.store_id !== storeId) {
      throw new Error(
        `Le produit "${product.title}" n'appartient pas à cette boutique`,
      );
    }

    if (product.status !== "active") {
      throw new Error(`Le produit "${product.title}" n'est pas disponible`);
    }

    let unitPrice = product.price;
    let sku = product.sku;
    let imageUrl = product.images[0] ?? "";

    if (item.variantId) {
      const variant = await ctx.db.get(item.variantId);
      if (!variant || variant.product_id !== product._id) {
        throw new Error(`Variante introuvable pour "${product.title}"`);
      }
      if (!variant.is_available) {
        throw new Error(`La variante "${variant.title}" n'est plus disponible`);
      }
      if (variant.quantity < item.quantity) {
        throw new Error(
          `Stock insuffisant pour "${product.title} — ${variant.title}" (${variant.quantity} disponibles)`,
        );
      }
      if (variant.price !== undefined) {
        unitPrice = variant.price;
      }
      if (variant.sku) {
        sku = variant.sku;
      }
      if (variant.image_url) {
        imageUrl = variant.image_url;
      }
    } else if (product.track_inventory && product.quantity < item.quantity) {
      throw new Error(
        `Stock insuffisant pour "${product.title}" (${product.quantity} disponibles)`,
      );
    }

    validatedItems.push({
      product_id: product._id,
      variant_id: item.variantId,
      title: product.title,
      sku,
      image_url: imageUrl,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: unitPrice * item.quantity,
    });
  }

  return validatedItems;
}

// ─── Inventory Management ────────────────────────────────────

/**
 * Décrémente le stock après création de commande.
 */
export async function decrementInventory(
  ctx: MutationCtx,
  items: ValidatedOrderItem[],
): Promise<void> {
  for (const item of items) {
    if (item.variant_id) {
      const variant = await ctx.db.get(item.variant_id);
      if (variant) {
        const newQty = variant.quantity - item.quantity;
        await ctx.db.patch(variant._id, {
          quantity: newQty,
          is_available: newQty > 0,
        });
      }
    } else {
      const product = await ctx.db.get(item.product_id);
      if (product && product.track_inventory) {
        const newQty = product.quantity - item.quantity;
        await ctx.db.patch(product._id, {
          quantity: newQty,
          status: newQty <= 0 ? "out_of_stock" : product.status,
          updated_at: Date.now(),
        });
      }
    }
  }
}

/**
 * Restaure le stock (annulation / remboursement).
 */
export async function restoreInventory(
  ctx: MutationCtx,
  items: Doc<"orders">["items"],
): Promise<void> {
  for (const item of items) {
    if (item.variant_id) {
      const variant = await ctx.db.get(item.variant_id);
      if (variant) {
        await ctx.db.patch(variant._id, {
          quantity: variant.quantity + item.quantity,
          is_available: true,
        });
      }
    } else {
      const product = await ctx.db.get(item.product_id);
      if (product && product.track_inventory) {
        const newQty = product.quantity + item.quantity;
        await ctx.db.patch(product._id, {
          quantity: newQty,
          status:
            product.status === "out_of_stock" && newQty > 0
              ? "active"
              : product.status,
          updated_at: Date.now(),
        });
      }
    }
  }
}
