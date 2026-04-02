// filepath: convex/orders/helpers.ts

import { ConvexError } from "convex/values";
import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import {
  COMMISSION_RATES,
  CANCELLATION_WINDOW_MS,
  ORDER_NUMBER_PREFIX,
  type SubscriptionTier,
} from "../lib/constants";
import { getStorageCodeForProduct } from "../storage/helpers";

/**
 * Address validation for server-side security
 */
export function validateAddress(address: {
  full_name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  phone?: string;
}) {
  // Name validation
  if (address.full_name.length < 2 || address.full_name.length > 100) {
    throw new ConvexError("Le nom doit contenir entre 2 et 100 caractères");
  }

  if (!/^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff\s'-]+$/.test(address.full_name)) {
    throw new ConvexError("Le nom contient des caractères non autorisés");
  }

  // Address validation
  if (address.line1.length < 5 || address.line1.length > 200) {
    throw new ConvexError("L'adresse doit contenir entre 5 et 200 caractères");
  }

  if (!/^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff0-9\s'",.\-#]+$/.test(address.line1)) {
    throw new ConvexError("L'adresse contient des caractères non autorisés");
  }

  // City validation
  if (address.city.length < 2 || address.city.length > 100) {
    throw new ConvexError("La ville doit contenir entre 2 et 100 caractères");
  }

  if (!/^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff\s'-]+$/.test(address.city)) {
    throw new ConvexError("La ville contient des caractères non autorisés");
  }

  // Country validation
  if (!/^[A-Z]{2}$/.test(address.country)) {
    throw new ConvexError("Code pays invalide");
  }

  // Phone validation
  if (address.phone && !/^\+?[\d\s\-()]{10,20}$/.test(address.phone)) {
    throw new ConvexError("Format de téléphone invalide");
  }

  // Optional fields validation
  if (address.line2 && address.line2.length > 200) {
    throw new ConvexError(
      "Le complément d'adresse ne peut pas dépasser 200 caractères",
    );
  }

  if (address.state && address.state.length > 100) {
    throw new ConvexError("L'état/région ne peut pas dépasser 100 caractères");
  }

  if (
    address.postal_code &&
    (address.postal_code.length < 2 || address.postal_code.length > 20)
  ) {
    throw new ConvexError(
      "Le code postal doit contenir entre 2 et 20 caractères",
    );
  }

  return {
    full_name: address.full_name.trim(),
    line1: address.line1.trim(),
    line2: address.line2?.trim(),
    city: address.city.trim(),
    state: address.state?.trim(),
    postal_code: address.postal_code?.trim(),
    country: address.country,
    phone: address.phone?.replace(/\s/g, ""),
  };
}

/**
 * @deprecated Ne plus appeler directement.
 * Le rate limiting des commandes est géré via rateLimiter.limit() dans createOrder.
 * Cette fonction est conservée pour référence uniquement.
 */
export async function checkOrderRateLimit(
  _ctx: MutationCtx,
  _userId: Id<"users">,
): Promise<void> {
  // Migré vers @convex-dev/ratelimiter — voir convex/lib/ratelimits.ts
}

/**
 * Sanitize order notes
 */
export function sanitizeOrderNotes(notes?: string): string | undefined {
  if (!notes) return undefined;

  // Remove dangerous characters
  let sanitized = notes.replace(/[<>"'&]/g, "");

  // Limit length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }

  return sanitized.trim() || undefined;
}

/**
 * Validate delivery coordinates
 */
export function validateDeliveryCoordinates(lat?: number, lon?: number): void {
  if (lat !== undefined || lon !== undefined) {
    if (lat === undefined || lon === undefined) {
      throw new ConvexError(
        "Les coordonnées de livraison doivent être complètes",
      );
    }

    if (lat < -90 || lat > 90) {
      throw new ConvexError("Latitude invalide");
    }

    if (lon < -180 || lon > 180) {
      throw new ConvexError("Longitude invalide");
    }

    // Additional validation for reasonable delivery locations (adjust based on your region)
    // This example assumes West Africa region
    if (lat < -5 || lat > 20 || lon < -20 || lon > 15) {
      throw new ConvexError("Zone de livraison non supportée");
    }
  }
}

/**
 * Validate and sanitize coupon code
 */
export function validateCouponCode(couponCode?: string): string | undefined {
  if (!couponCode) return undefined;

  const sanitized = couponCode.trim().toUpperCase();

  if (sanitized.length < 3 || sanitized.length > 50) {
    throw new ConvexError("Code coupon invalide");
  }

  if (!/^[A-Z0-9\-_]+$/.test(sanitized)) {
    throw new ConvexError("Format de code coupon invalide");
  }

  return sanitized;
}

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
  processing: ["ready_for_delivery", "shipped", "cancelled"],
  ready_for_delivery: ["shipped", "cancelled"],
  shipped: ["delivered", "delivery_failed"],
  delivered: ["refunded"],
  delivery_failed: ["shipped", "refunded", "cancelled"],
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
export function canCustomerCancel(
  order: Doc<"orders">,
  windowMs: number = CANCELLATION_WINDOW_MS,
): boolean {
  if (order.status === "pending") return true;
  if (order.status === "paid") {
    return Date.now() - order._creationTime <= windowMs;
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
export function getCommissionRate(
  tier: SubscriptionTier,
  rates: Record<SubscriptionTier, number> = COMMISSION_RATES,
): number {
  return rates[tier] ?? rates.free;
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
  variant_title?: string;
  title: string;
  sku?: string;
  image_url: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  storage_code?: string; // présent si le produit est stocké en entrepôt Pixel-Mart
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
    let variantTitle: string | undefined;

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
      variantTitle = variant.title;
    } else if (product.track_inventory && product.quantity < item.quantity) {
      throw new Error(
        `Stock insuffisant pour "${product.title}" (${product.quantity} disponibles)`,
      );
    }

    const storageCode = await getStorageCodeForProduct(ctx, product._id);

    validatedItems.push({
      product_id: product._id,
      variant_id: item.variantId,
      variant_title: variantTitle,
      title: product.title,
      sku,
      image_url: imageUrl,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: unitPrice * item.quantity,
      storage_code: storageCode,
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
        // Si l'article vient de l'entrepôt PM, décrémenter aussi le stock entrepôt
        const newWarehouseQty =
          item.storage_code !== undefined && product.warehouse_qty !== undefined
            ? Math.max(0, product.warehouse_qty - item.quantity)
            : product.warehouse_qty;
        await ctx.db.patch(product._id, {
          quantity: newQty,
          warehouse_qty: newWarehouseQty,
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
