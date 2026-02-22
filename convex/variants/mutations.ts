import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getVendorStore } from "../users/helpers";

const variantOptionValidator = v.object({
  name: v.string(),
  value: v.string(),
});

/**
 * Ajoute une variante à un produit.
 */
export const create = mutation({
  args: {
    product_id: v.id("products"),
    title: v.string(),
    options: v.array(variantOptionValidator),
    price: v.optional(v.number()),
    compare_price: v.optional(v.number()),
    sku: v.optional(v.string()),
    quantity: v.number(),
    image_url: v.optional(v.string()), // storageId
    weight: v.optional(v.number()),
    is_available: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    // Vérifier que le produit appartient à la boutique
    const product = await ctx.db.get(args.product_id);
    if (!product) throw new Error("Produit introuvable");
    if (product.store_id !== store._id) {
      throw new Error("Ce produit n'appartient pas à votre boutique");
    }

    if (args.options.length === 0) {
      throw new Error("Au moins une option est requise (ex: Couleur/Taille)");
    }

    if (args.price !== undefined && args.price <= 0) {
      throw new Error("Le prix de la variante doit être supérieur à 0");
    }

    return await ctx.db.insert("product_variants", {
      product_id: args.product_id,
      store_id: store._id,
      title: args.title,
      options: args.options,
      price: args.price,
      compare_price: args.compare_price,
      sku: args.sku,
      quantity: args.quantity,
      image_url: args.image_url,
      weight: args.weight,
      is_available: args.is_available,
    });
  },
});

/**
 * Met à jour une variante.
 */
export const update = mutation({
  args: {
    id: v.id("product_variants"),
    title: v.optional(v.string()),
    options: v.optional(v.array(variantOptionValidator)),
    price: v.optional(v.number()),
    compare_price: v.optional(v.number()),
    sku: v.optional(v.string()),
    quantity: v.optional(v.number()),
    image_url: v.optional(v.string()),
    weight: v.optional(v.number()),
    is_available: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const variant = await ctx.db.get(args.id);
    if (!variant) throw new Error("Variante introuvable");
    if (variant.store_id !== store._id) {
      throw new Error("Cette variante n'appartient pas à votre boutique");
    }

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.options !== undefined) updates.options = args.options;
    if (args.price !== undefined) updates.price = args.price;
    if (args.compare_price !== undefined)
      updates.compare_price = args.compare_price;
    if (args.sku !== undefined) updates.sku = args.sku;
    if (args.quantity !== undefined) updates.quantity = args.quantity;
    if (args.image_url !== undefined) updates.image_url = args.image_url;
    if (args.weight !== undefined) updates.weight = args.weight;
    if (args.is_available !== undefined)
      updates.is_available = args.is_available;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

/**
 * Supprime une variante.
 * Supprime aussi l'image du storage si elle existe.
 */
export const remove = mutation({
  args: { id: v.id("product_variants") },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const variant = await ctx.db.get(args.id);
    if (!variant) throw new Error("Variante introuvable");
    if (variant.store_id !== store._id) {
      throw new Error("Cette variante n'appartient pas à votre boutique");
    }

    // Supprimer l'image de la variante du storage
    if (variant.image_url) {
      try {
        await ctx.storage.delete(variant.image_url as any);
      } catch {
        // Fichier déjà supprimé
      }
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Ajuste le stock d'une variante spécifique.
 */
export const adjustStock = mutation({
  args: {
    id: v.id("product_variants"),
    quantity: v.number(), // positif = ajout, négatif = retrait
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const variant = await ctx.db.get(args.id);
    if (!variant) throw new Error("Variante introuvable");
    if (variant.store_id !== store._id) {
      throw new Error("Cette variante n'appartient pas à votre boutique");
    }

    const newQuantity = variant.quantity + args.quantity;
    if (newQuantity < 0) {
      throw new Error("Le stock ne peut pas être négatif");
    }

    const updates: Record<string, unknown> = { quantity: newQuantity };

    // Désactiver la variante si stock = 0
    if (newQuantity === 0) {
      updates.is_available = false;
    }

    // Réactiver si stock revient
    if (newQuantity > 0 && !variant.is_available) {
      updates.is_available = true;
    }

    await ctx.db.patch(args.id, updates);
    return { newQuantity };
  },
});
