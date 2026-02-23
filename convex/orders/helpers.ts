// filepath: convex/orders/helpers.ts

import { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

// ─── Order Number ────────────────────────────────────────────

/**
 * Génère un numéro de commande séquentiel : PM-2026-0001
 */
export async function generateOrderNumber(ctx: MutationCtx): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PM-${year}-`;

  // Chercher la dernière commande de l'année
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

/**
 * Vérifie si une transition de statut est autorisée.
 */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Valide une transition et throw si invalide.
 */
export function assertValidTransition(
  from: OrderStatus,
  to: OrderStatus,
): void {
  if (!isValidTransition(from, to)) {
    throw new Error(`Transition de statut invalide : ${from} → ${to}`);
  }
}

// ─── Cancellation Rules ──────────────────────────────────────

const CANCELLATION_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 heures

/**
 * Vérifie si un client peut annuler sa commande.
 * - pending : toujours annulable
 * - paid : dans les 2h suivant la création
 */
export function canCustomerCancel(order: Doc<"orders">): boolean {
  if (order.status === "pending") return true;
  if (order.status === "paid") {
    const elapsed = Date.now() - order._creationTime;
    return elapsed <= CANCELLATION_WINDOW_MS;
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
 * Calcule la commission Pixel-Mart en centimes.
 * F-04: commission_amount = total_amount × commission_rate / 10000
 */
export function calculateCommission(
  totalAmount: number,
  commissionRate: number,
): number {
  return Math.round((totalAmount * commissionRate) / 10000);
}

/**
 * Retourne le taux de commission en basis points selon le plan.
 */
export function getCommissionRate(
  plan: Doc<"stores">["subscription_plan"],
): number {
  switch (plan) {
    case "business":
      return 200; // 2%
    case "pro":
      return 300; // 3%
    case "free":
    default:
      return 500; // 5%
  }
}

// ─── Order Totals ────────────────────────────────────────────

export interface OrderItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface ValidatedOrderItem {
  product_id: string;
  variant_id?: string;
  title: string;
  sku?: string;
  image_url: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

/**
 * Valide les items, vérifie le stock, et retourne les items enrichis.
 * Throw si un produit est indisponible ou stock insuffisant.
 */
export async function validateAndBuildItems(
  ctx: MutationCtx,
  storeId: string,
  items: OrderItemInput[],
): Promise<ValidatedOrderItem[]> {
  if (items.length === 0) {
    throw new Error("La commande doit contenir au moins un article");
  }

  const validatedItems: ValidatedOrderItem[] = [];

  for (const item of items) {
    const product = await ctx.db.get(item.productId as any);
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

    // Vérifier la variante si spécifiée
    if (item.variantId) {
      const variant = await ctx.db.get(item.variantId as any);
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
    } else {
      // Vérifier le stock produit principal
      if (product.track_inventory && product.quantity < item.quantity) {
        throw new Error(
          `Stock insuffisant pour "${product.title}" (${product.quantity} disponibles)`,
        );
      }
    }

    validatedItems.push({
      product_id: product._id,
      variant_id: item.variantId,
      title: item.variantId ? `${product.title}` : product.title,
      sku,
      image_url: imageUrl,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: unitPrice * item.quantity,
    });
  }

  return validatedItems;
}

/**
 * Décrémente le stock des produits et variantes après création de commande.
 */
export async function decrementInventory(
  ctx: MutationCtx,
  items: ValidatedOrderItem[],
): Promise<void> {
  for (const item of items) {
    if (item.variant_id) {
      const variant = await ctx.db.get(item.variant_id as any);
      if (variant) {
        const newQty = variant.quantity - item.quantity;
        await ctx.db.patch(variant._id, {
          quantity: newQty,
          is_available: newQty > 0,
        });
      }
    } else {
      const product = await ctx.db.get(item.product_id as any);
      if (product && product.track_inventory) {
        const newQty = product.quantity - item.quantity;
        const updates: Record<string, any> = {
          quantity: newQty,
          updated_at: Date.now(),
        };
        if (newQty <= 0) {
          updates.status = "out_of_stock";
        }
        await ctx.db.patch(product._id, updates);
      }
    }
  }
}

/**
 * Restaure le stock (pour annulation / remboursement).
 */
export async function restoreInventory(
  ctx: MutationCtx,
  items: Doc<"orders">["items"],
): Promise<void> {
  for (const item of items) {
    if (item.variant_id) {
      const variant = await ctx.db.get(item.variant_id as any);
      if (variant) {
        await ctx.db.patch(variant._id, {
          quantity: variant.quantity + item.quantity,
          is_available: true,
        });
      }
    } else {
      const product = await ctx.db.get(item.product_id as any);
      if (product && product.track_inventory) {
        const newQty = product.quantity + item.quantity;
        const updates: Record<string, any> = {
          quantity: newQty,
          updated_at: Date.now(),
        };
        if (product.status === "out_of_stock" && newQty > 0) {
          updates.status = "active";
        }
        await ctx.db.patch(product._id, updates);
      }
    }
  }
}
