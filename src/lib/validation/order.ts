// filepath: src/lib/validation/order.ts

import { z } from "zod";

/**
 * Phone number validation - international format
 */
const phoneRegex = /^\+?[\d\s\-()]{10,20}$/;

/**
 * Name validation - letters, spaces, apostrophes, hyphens, international chars
 */
const nameRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff\s'-]+$/;

/**
 * Address line validation - alphanumeric, spaces, common punctuation
 */
const addressRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff0-9\s'",.-/#]+$/;

/**
 * City name validation
 */
const cityRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff\s'-]+$/;

/**
 * Postal code validation (flexible for international)
 */
const postalCodeRegex = /^[a-zA-Z0-9\s-]{2,20}$/;

/**
 * Address validation schema
 */
export const addressSchema = z.object({
  full_name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .regex(nameRegex, "Le nom contient des caractères non autorisés")
    .transform((name) => name.trim()),

  line1: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caractères")
    .max(200, "L'adresse ne peut pas dépasser 200 caractères")
    .regex(addressRegex, "L'adresse contient des caractères non autorisés")
    .transform((line) => line.trim()),

  line2: z
    .string()
    .max(200, "Le complément d'adresse ne peut pas dépasser 200 caractères")
    .regex(
      addressRegex,
      "Le complément d'adresse contient des caractères non autorisés",
    )
    .transform((line) => line.trim())
    .optional(),

  city: z
    .string()
    .min(2, "La ville doit contenir au moins 2 caractères")
    .max(100, "La ville ne peut pas dépasser 100 caractères")
    .regex(cityRegex, "La ville contient des caractères non autorisés")
    .transform((city) => city.trim()),

  state: z
    .string()
    .max(100, "L'état/région ne peut pas dépasser 100 caractères")
    .regex(cityRegex, "L'état/région contient des caractères non autorisés")
    .transform((state) => state.trim())
    .optional(),

  postal_code: z
    .string()
    .min(2, "Le code postal doit contenir au moins 2 caractères")
    .max(20, "Le code postal ne peut pas dépasser 20 caractères")
    .regex(postalCodeRegex, "Format de code postal invalide")
    .transform((code) => code.trim())
    .optional(),

  country: z
    .string()
    .length(2, "Code pays invalide")
    .regex(/^[A-Z]{2}$/, "Format de code pays invalide"),

  phone: z
    .string()
    .min(10, "Le numéro de téléphone doit contenir au moins 10 caractères")
    .max(20, "Le numéro de téléphone ne peut pas dépasser 20 caractères")
    .regex(phoneRegex, "Format de téléphone invalide")
    .transform((phone) => phone.replace(/\s/g, ""))
    .optional(),
});

/**
 * Cart item validation schema
 */
export const cartItemSchema = z.object({
  productId: z.string().min(1, "ID produit requis"),
  variantId: z.string().optional(),
  quantity: z
    .number()
    .int("La quantité doit être un nombre entier")
    .min(1, "La quantité doit être d'au moins 1")
    .max(1000, "La quantité ne peut pas dépasser 1000"),

  // Client data that needs server validation
  expectedPrice: z.number().min(0, "Prix invalide"),
  expectedTitle: z.string().min(1, "Titre produit requis"),
});

/**
 * Order creation validation schema
 */
export const createOrderSchema = z
  .object({
    storeId: z.string().min(1, "ID boutique requis"),

    items: z
      .array(cartItemSchema)
      .min(1, "La commande doit contenir au moins un article")
      .max(50, "Maximum 50 articles par commande"),

    shippingAddress: addressSchema,
    billingAddress: addressSchema.optional(),

    couponCode: z
      .string()
      .max(50, "Code coupon trop long")
      .regex(/^[A-Z0-9\-_]{3,50}$/, "Format de code coupon invalide")
      .optional(),

    notes: z
      .string()
      .max(500, "Les notes ne peuvent pas dépasser 500 caractères")
      .refine(
        (notes) => !notes || !/[<>"'&]/.test(notes),
        "Les notes contiennent des caractères non autorisés",
      )
      .transform((notes) => (notes ? notes.trim() : undefined))
      .optional(),

    paymentMethod: z
      .enum(
        ["mtn_momo", "orange_money", "wave", "flooz", "visa", "mastercard"],
        {
          message: "Méthode de paiement non supportée",
        },
      )
      .optional(),

    // Delivery validation
    deliveryLat: z
      .number()
      .min(-90, "Latitude invalide")
      .max(90, "Latitude invalide")
      .optional(),

    deliveryLon: z
      .number()
      .min(-180, "Longitude invalide")
      .max(180, "Longitude invalide")
      .optional(),

    deliveryDistanceKm: z
      .number()
      .min(0, "Distance invalide")
      .max(500, "Distance de livraison trop importante")
      .optional(),

    deliveryFee: z
      .number()
      .min(0, "Frais de livraison invalides")
      .max(100000, "Frais de livraison trop élevés")
      .optional(),

    deliveryType: z
      .enum(["standard", "urgent", "fragile"], {
        message: "Type de livraison non supporté",
      })
      .optional(),

    paymentMode: z
      .enum(["online", "cod"], {
        message: "Mode de paiement non supporté",
      })
      .optional(),

    estimatedWeightKg: z
      .number()
      .min(0, "Poids invalide")
      .max(1000, "Poids trop important")
      .optional(),

    source: z
      .enum(["marketplace", "vendor_shop"], {
        message: "Source non supportée",
      })
      .optional(),
  })
  .refine(
    (data) => {
      // If coordinates provided, both lat and lon must be present
      const hasLat = data.deliveryLat !== undefined;
      const hasLon = data.deliveryLon !== undefined;

      if (hasLat !== hasLon) {
        return false;
      }

      return true;
    },
    {
      message:
        "Les coordonnées de livraison doivent être complètes (latitude ET longitude)",
      path: ["deliveryLat"],
    },
  );

/**
 * Cart validation schema for server-side validation
 */
export const validateCartSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Le panier ne peut pas être vide"),
});

/**
 * Order status update validation
 */
export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "ID commande requis"),
  status: z.enum(
    [
      "pending",
      "paid",
      "processing",
      "ready_for_delivery",
      "shipped",
      "delivered",
      "delivery_failed",
      "cancelled",
      "refunded",
    ],
    {
      message: "Statut de commande invalide",
    },
  ),
  notes: z
    .string()
    .max(500, "Les notes ne peuvent pas dépasser 500 caractères")
    .optional(),
});

/**
 * Type definitions
 */
export type AddressData = z.infer<typeof addressSchema>;
export type CartItemData = z.infer<typeof cartItemSchema>;
export type CreateOrderData = z.infer<typeof createOrderSchema>;
export type ValidateCartData = z.infer<typeof validateCartSchema>;
export type UpdateOrderStatusData = z.infer<typeof updateOrderStatusSchema>;

/**
 * Safe error messages for orders
 */
export const ORDER_ERROR_MESSAGES: Record<string, string> = {
  // Cart errors
  CART_EMPTY: "Votre panier est vide",
  CART_INVALID: "Le contenu de votre panier est invalide",
  PRODUCT_NOT_FOUND: "Un produit de votre panier n'est plus disponible",
  PRODUCT_UNAVAILABLE: "Un produit de votre panier n'est plus en vente",
  INSUFFICIENT_STOCK: "Stock insuffisant pour certains articles",
  PRICE_CHANGED:
    "Le prix de certains articles a changé. Veuillez actualiser votre panier",
  VARIANT_UNAVAILABLE: "Une variante sélectionnée n'est plus disponible",

  // Order creation errors
  STORE_INACTIVE: "Cette boutique n'est plus active",
  CANNOT_BUY_OWN_PRODUCTS: "Vous ne pouvez pas acheter vos propres produits",
  INVALID_ADDRESS: "Adresse de livraison invalide",
  INVALID_PHONE: "Numéro de téléphone invalide",
  INVALID_COUPON: "Code coupon invalide ou expiré",
  DELIVERY_UNAVAILABLE: "Livraison non disponible pour cette adresse",
  PAYMENT_METHOD_INVALID: "Méthode de paiement non supportée",

  // Rate limiting
  TOO_MANY_ORDERS:
    "Trop de commandes récentes. Veuillez patienter quelques minutes",
  ORDER_COOLDOWN: "Veuillez attendre avant de passer une nouvelle commande",

  // Generic
  ORDER_CREATION_FAILED:
    "Erreur lors de la création de la commande. Veuillez réessayer",
  VALIDATION_FAILED: "Données invalides. Veuillez vérifier vos informations",
  UNKNOWN_ERROR: "Une erreur inattendue est survenue. Veuillez réessayer",
};

/**
 * Get safe error message for display
 */
export function getSafeOrderErrorMessage(error: unknown): string {
  if (!error) return ORDER_ERROR_MESSAGES.UNKNOWN_ERROR;

  // Type guard for error-like objects
  const isErrorLike = (
    err: unknown,
  ): err is { code?: string; type?: string; message?: string } =>
    typeof err === "object" && err !== null;

  if (!isErrorLike(error)) {
    return ORDER_ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // Check if error has a known code/type
  const errorCode = error.code || error.type || error.message;

  // Map specific error codes to safe messages
  if (errorCode && ORDER_ERROR_MESSAGES[errorCode]) {
    return ORDER_ERROR_MESSAGES[errorCode];
  }

  // Handle specific error patterns
  if (error.message) {
    const message = error.message.toLowerCase();

    if (message.includes("stock")) {
      return ORDER_ERROR_MESSAGES.INSUFFICIENT_STOCK;
    }

    if (message.includes("prix") || message.includes("price")) {
      return ORDER_ERROR_MESSAGES.PRICE_CHANGED;
    }

    if (message.includes("produit") || message.includes("product")) {
      return ORDER_ERROR_MESSAGES.PRODUCT_NOT_FOUND;
    }

    if (message.includes("boutique") || message.includes("store")) {
      return ORDER_ERROR_MESSAGES.STORE_INACTIVE;
    }

    if (message.includes("adresse") || message.includes("address")) {
      return ORDER_ERROR_MESSAGES.INVALID_ADDRESS;
    }
  }

  // Generic fallback for security
  return ORDER_ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Rate limiting for order operations
 */
export class OrderRateLimiter {
  private static lastOrderTime: Map<string, number> = new Map();
  private static orderCounts: Map<string, { count: number; window: number }> =
    new Map();

  static checkOrderRateLimit(userId: string): {
    allowed: boolean;
    remainingTime?: number;
  } {
    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minute window
    const maxOrders = 5; // Max 5 orders per minute

    const userKey = `orders:${userId}`;
    const existing = this.orderCounts.get(userKey);

    if (!existing || now - existing.window > windowSize) {
      // New window
      this.orderCounts.set(userKey, { count: 1, window: now });
      return { allowed: true };
    }

    if (existing.count >= maxOrders) {
      const remainingTime = windowSize - (now - existing.window);
      return { allowed: false, remainingTime };
    }

    // Increment counter
    existing.count++;
    this.orderCounts.set(userKey, existing);
    return { allowed: true };
  }

  static checkOrderCooldown(userId: string): {
    allowed: boolean;
    remainingTime?: number;
  } {
    const now = Date.now();
    const cooldownMs = 10 * 1000; // 10 seconds between orders

    const lastTime = this.lastOrderTime.get(userId) || 0;
    const timeSinceLastOrder = now - lastTime;

    if (timeSinceLastOrder < cooldownMs) {
      return {
        allowed: false,
        remainingTime: cooldownMs - timeSinceLastOrder,
      };
    }

    this.lastOrderTime.set(userId, now);
    return { allowed: true };
  }

  static formatRemainingTime(remainingMs: number): string {
    const seconds = Math.ceil(remainingMs / 1000);
    return `${seconds} seconde${seconds > 1 ? "s" : ""}`;
  }
}
