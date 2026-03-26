// filepath: convex/cart/mutations.ts

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser } from "../users/helpers";
import type { Doc, Id } from "../_generated/dataModel";

/**
 * Validated cart item returned by server
 */
export interface ValidatedCartItem {
  productId: Id<"products">;
  variantId?: Id<"product_variants">;
  title: string;
  variantTitle?: string;
  slug: string;
  image: string;
  currentPrice: number; // Current server price
  originalPrice?: number; // Client expected price (for comparison)
  comparePrice?: number;
  storeId: Id<"stores">;
  storeName: string;
  storeSlug: string;
  maxQuantity: number; // Current server stock
  isDigital: boolean;
  isAvailable: boolean;
  priceChanged: boolean; // True if price differs from client expectation
  stockChanged: boolean; // True if max quantity changed
}

/**
 * Cart validation result
 */
export interface CartValidationResult {
  items: ValidatedCartItem[];
  hasChanges: boolean; // True if any prices or stock changed
  unavailableItems: string[]; // Product IDs that are no longer available
  errors: string[];
}

/**
 * Validates cart items against current server data
 * Returns updated prices, stock levels, and availability
 */
export const validateCart = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        variantId: v.optional(v.id("product_variants")),
        quantity: v.number(),
        expectedPrice: v.number(),
        expectedTitle: v.string(),
      }),
    ),
  },
  handler: async (ctx, args): Promise<CartValidationResult> => {
    await requireAppUser(ctx);

    if (args.items.length === 0) {
      return {
        items: [],
        hasChanges: false,
        unavailableItems: [],
        errors: ["Le panier est vide"],
      };
    }

    if (args.items.length > 50) {
      return {
        items: [],
        hasChanges: false,
        unavailableItems: [],
        errors: ["Trop d'articles dans le panier (maximum 50)"],
      };
    }

    const validatedItems: ValidatedCartItem[] = [];
    const unavailableItems: string[] = [];
    const errors: string[] = [];
    let hasChanges = false;

    for (const item of args.items) {
      // Validate quantity
      if (item.quantity <= 0 || item.quantity > 1000) {
        errors.push(`Quantité invalide pour l'article ${item.expectedTitle}`);
        continue;
      }

      // Get current product data
      const product = await ctx.db.get(item.productId);
      if (!product) {
        unavailableItems.push(item.productId);
        errors.push(`Produit non trouvé: ${item.expectedTitle}`);
        continue;
      }

      // Check if product is still active
      if (product.status !== "active") {
        unavailableItems.push(item.productId);
        errors.push(`Produit plus disponible: ${product.title}`);
        continue;
      }

      // Check if store is still active
      const store = await ctx.db.get(product.store_id);
      if (!store || store.status !== "active") {
        unavailableItems.push(item.productId);
        errors.push(`Boutique fermée pour: ${product.title}`);
        continue;
      }

      let currentPrice = product.price;
      let variantTitle: string | undefined;
      let maxQuantity = product.quantity;
      let imageUrl = product.images[0] ?? "";

      // Handle variant if specified
      if (item.variantId) {
        const variant = await ctx.db.get(item.variantId);
        if (!variant || variant.product_id !== product._id) {
          unavailableItems.push(item.productId);
          errors.push(`Variante non trouvée pour: ${product.title}`);
          continue;
        }

        if (!variant.is_available) {
          unavailableItems.push(item.productId);
          errors.push(
            `Variante plus disponible: ${product.title} - ${variant.title}`,
          );
          continue;
        }

        if (variant.price !== undefined) {
          currentPrice = variant.price;
        }

        variantTitle = variant.title;
        maxQuantity = variant.quantity;

        if (variant.image_url) {
          imageUrl = variant.image_url;
        }
      }

      // Check for price changes
      const priceChanged = currentPrice !== item.expectedPrice;
      if (priceChanged) {
        hasChanges = true;
      }

      // Check for stock changes
      const stockChanged = maxQuantity < item.quantity;
      if (stockChanged) {
        hasChanges = true;
      }

      // Resolve image URL
      let resolvedImageUrl = "";
      if (imageUrl) {
        try {
          resolvedImageUrl =
            (await ctx.storage.getUrl(imageUrl as Id<"_storage">)) ?? "";
        } catch {
          // Image not found, use empty string
        }
      }

      validatedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        title: product.title,
        variantTitle,
        slug: product.slug,
        image: resolvedImageUrl,
        currentPrice,
        originalPrice: item.expectedPrice,
        comparePrice: product.compare_price,
        storeId: product.store_id,
        storeName: store.name,
        storeSlug: store.slug,
        maxQuantity,
        isDigital: product.is_digital,
        isAvailable: true,
        priceChanged,
        stockChanged,
      });
    }

    return {
      items: validatedItems,
      hasChanges,
      unavailableItems,
      errors,
    };
  },
});

/**
 * Validates a single product for adding to cart
 */
export const validateProductForCart = mutation({
  args: {
    productId: v.id("products"),
    variantId: v.optional(v.id("product_variants")),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    // Validate quantity
    if (args.quantity <= 0 || args.quantity > 1000) {
      throw new Error("Quantité invalide");
    }

    // Get product
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Produit introuvable");
    }

    if (product.status !== "active") {
      throw new Error("Ce produit n'est plus disponible");
    }

    // Get store
    const store = await ctx.db.get(product.store_id);
    if (!store || store.status !== "active") {
      throw new Error("Cette boutique n'est plus active");
    }

    // Prevent buying own products
    if (store.owner_id === user._id) {
      throw new Error("Vous ne pouvez pas acheter vos propres produits");
    }

    let finalPrice = product.price;
    let variantTitle: string | undefined;
    let availableQuantity = product.quantity;
    let imageUrl = product.images[0] ?? "";

    // Handle variant
    if (args.variantId) {
      const variant = await ctx.db.get(args.variantId);
      if (!variant || variant.product_id !== product._id) {
        throw new Error("Variante introuvable");
      }

      if (!variant.is_available) {
        throw new Error("Cette variante n'est plus disponible");
      }

      if (variant.price !== undefined) {
        finalPrice = variant.price;
      }

      variantTitle = variant.title;
      availableQuantity = variant.quantity;

      if (variant.image_url) {
        imageUrl = variant.image_url;
      }
    }

    // Check stock
    if (!product.track_inventory) {
      availableQuantity = 999; // High number for unlimited stock
    } else if (availableQuantity < args.quantity) {
      throw new Error(
        `Stock insuffisant. Seulement ${availableQuantity} disponible(s)`,
      );
    }

    // Resolve image URL
    let resolvedImageUrl = "";
    if (imageUrl) {
      try {
        resolvedImageUrl =
          (await ctx.storage.getUrl(imageUrl as Id<"_storage">)) ?? "";
      } catch {
        // Image not found, use empty string
      }
    }

    return {
      productId: product._id,
      variantId: args.variantId,
      title: product.title,
      variantTitle,
      slug: product.slug,
      image: resolvedImageUrl,
      price: finalPrice,
      comparePrice: product.compare_price,
      storeId: product.store_id,
      storeName: store.name,
      storeSlug: store.slug,
      maxQuantity: availableQuantity,
      isDigital: product.is_digital,
      quantity: args.quantity,
    };
  },
});

/**
 * Checks current stock for a specific product/variant
 */
export const checkStock = mutation({
  args: {
    productId: v.id("products"),
    variantId: v.optional(v.id("product_variants")),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Produit introuvable");
    }

    if (product.status !== "active") {
      return { available: false, quantity: 0 };
    }

    let availableQuantity = product.quantity;

    if (args.variantId) {
      const variant = await ctx.db.get(args.variantId);
      if (
        !variant ||
        variant.product_id !== product._id ||
        !variant.is_available
      ) {
        return { available: false, quantity: 0 };
      }

      availableQuantity = variant.quantity;
    }

    return {
      available: !product.track_inventory || availableQuantity > 0,
      quantity: product.track_inventory ? availableQuantity : 999,
    };
  },
});
