// filepath: convex/products/mutations.ts

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getVendorStore } from "../users/helpers";
import { generateProductSlug, safeDeleteFile } from "./helpers";

/**
 * Crée un nouveau produit.
 * Le vendor doit être authentifié et avoir une boutique.
 * Le produit est créé en statut "draft" par défaut.
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    short_description: v.optional(v.string()),
    category_id: v.id("categories"),
    tags: v.array(v.string()),
    images: v.array(v.string()), // storageIds from Convex Storage
    price: v.number(),
    compare_price: v.optional(v.number()),
    cost_price: v.optional(v.number()),
    sku: v.optional(v.string()),
    barcode: v.optional(v.string()),
    track_inventory: v.boolean(),
    quantity: v.number(),
    low_stock_threshold: v.optional(v.number()),
    weight: v.optional(v.number()),
    is_digital: v.boolean(),
    digital_file_url: v.optional(v.string()),
    seo_title: v.optional(v.string()),
    seo_description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    // ---- Validations ----
    if (args.price <= 0) {
      throw new Error("Le prix doit être supérieur à 0");
    }
    if (args.compare_price !== undefined && args.compare_price <= args.price) {
      throw new Error("Le prix barré doit être supérieur au prix de vente");
    }
    if (args.images.length === 0) {
      throw new Error("Au moins une image est requise");
    }
    if (args.images.length > 10) {
      throw new Error("Maximum 10 images par produit");
    }

    // Vérifier que la catégorie existe et est active
    const category = await ctx.db.get(args.category_id);
    if (!category || !category.is_active) {
      throw new Error("Catégorie invalide ou inactive");
    }

    // Générer le slug
    const slug = await generateProductSlug(ctx, args.title);

    const productId = await ctx.db.insert("products", {
      store_id: store._id,
      title: args.title,
      slug,
      description: args.description,
      short_description: args.short_description,
      category_id: args.category_id,
      tags: args.tags,
      images: args.images,
      price: args.price,
      compare_price: args.compare_price,
      cost_price: args.cost_price,
      sku: args.sku,
      barcode: args.barcode,
      track_inventory: args.track_inventory,
      quantity: args.quantity,
      low_stock_threshold: args.low_stock_threshold ?? 5,
      weight: args.weight,
      status: "draft",
      is_digital: args.is_digital,
      digital_file_url: args.digital_file_url,
      seo_title: args.seo_title,
      seo_description: args.seo_description,
      published_at: undefined,
      updated_at: Date.now(),
    });

    return { productId, slug };
  },
});

/**
 * Met à jour un produit existant.
 * Seul le owner de la boutique peut modifier.
 */
export const update = mutation({
  args: {
    id: v.id("products"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    short_description: v.optional(v.string()),
    category_id: v.optional(v.id("categories")),
    tags: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    price: v.optional(v.number()),
    compare_price: v.optional(v.number()),
    cost_price: v.optional(v.number()),
    sku: v.optional(v.string()),
    barcode: v.optional(v.string()),
    track_inventory: v.optional(v.boolean()),
    quantity: v.optional(v.number()),
    low_stock_threshold: v.optional(v.number()),
    weight: v.optional(v.number()),
    is_digital: v.optional(v.boolean()),
    digital_file_url: v.optional(v.string()),
    seo_title: v.optional(v.string()),
    seo_description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Produit introuvable");
    if (product.store_id !== store._id) {
      throw new Error("Ce produit n'appartient pas à votre boutique");
    }

    // ---- Validations conditionnelles ----
    const newPrice = args.price ?? product.price;
    if (args.price !== undefined && args.price <= 0) {
      throw new Error("Le prix doit être supérieur à 0");
    }
    const newComparePrice = args.compare_price ?? product.compare_price;
    if (newComparePrice !== undefined && newComparePrice <= newPrice) {
      throw new Error("Le prix barré doit être supérieur au prix de vente");
    }
    if (args.images !== undefined && args.images.length === 0) {
      throw new Error("Au moins une image est requise");
    }
    if (args.images !== undefined && args.images.length > 10) {
      throw new Error("Maximum 10 images par produit");
    }

    if (args.category_id) {
      const category = await ctx.db.get(args.category_id);
      if (!category || !category.is_active) {
        throw new Error("Catégorie invalide ou inactive");
      }
    }

    // ---- Build updates ----
    const updates: Record<string, unknown> = { updated_at: Date.now() };

    if (args.title !== undefined) {
      updates.title = args.title;
      updates.slug = await generateProductSlug(ctx, args.title, args.id);
    }
    if (args.description !== undefined) updates.description = args.description;
    if (args.short_description !== undefined)
      updates.short_description = args.short_description;
    if (args.category_id !== undefined) updates.category_id = args.category_id;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.images !== undefined) updates.images = args.images;
    if (args.price !== undefined) updates.price = args.price;
    if (args.compare_price !== undefined)
      updates.compare_price = args.compare_price;
    if (args.cost_price !== undefined) updates.cost_price = args.cost_price;
    if (args.sku !== undefined) updates.sku = args.sku;
    if (args.barcode !== undefined) updates.barcode = args.barcode;
    if (args.track_inventory !== undefined)
      updates.track_inventory = args.track_inventory;
    if (args.quantity !== undefined) updates.quantity = args.quantity;
    if (args.low_stock_threshold !== undefined)
      updates.low_stock_threshold = args.low_stock_threshold;
    if (args.weight !== undefined) updates.weight = args.weight;
    if (args.is_digital !== undefined) updates.is_digital = args.is_digital;
    if (args.digital_file_url !== undefined)
      updates.digital_file_url = args.digital_file_url;
    if (args.seo_title !== undefined) updates.seo_title = args.seo_title;
    if (args.seo_description !== undefined)
      updates.seo_description = args.seo_description;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

/**
 * Change le statut d'un produit.
 * Transitions autorisées :
 *   draft → active (publie le produit)
 *   active → archived
 *   active → draft (dépublie)
 *   archived → draft (restaure)
 *   * → out_of_stock (automatique via adjustStock)
 */
export const updateStatus = mutation({
  args: {
    id: v.id("products"),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("archived"),
    ),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Produit introuvable");
    if (product.store_id !== store._id) {
      throw new Error("Ce produit n'appartient pas à votre boutique");
    }

    // Validation des transitions
    const allowed: Record<string, string[]> = {
      draft: ["active", "archived"],
      active: ["draft", "archived"],
      archived: ["draft"],
      out_of_stock: ["draft", "active"],
    };

    if (!allowed[product.status]?.includes(args.status)) {
      throw new Error(
        `Transition ${product.status} → ${args.status} non autorisée`,
      );
    }

    // Si publication, vérifier que le produit est complet
    if (args.status === "active") {
      if (product.images.length === 0) {
        throw new Error("Au moins une image requise pour publier");
      }
      if (product.price <= 0) {
        throw new Error("Le prix doit être défini pour publier");
      }
    }

    const updates: Record<string, unknown> = {
      status: args.status,
      updated_at: Date.now(),
    };

    // Ajouter published_at à la première publication
    if (args.status === "active" && !product.published_at) {
      updates.published_at = Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

/**
 * Supprime un produit (hard delete).
 * Supprime aussi les variantes associées et les fichiers du storage.
 */
export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Produit introuvable");
    if (product.store_id !== store._id) {
      throw new Error("Ce produit n'appartient pas à votre boutique");
    }

    // Supprimer les variantes + leurs images
    const variants = await ctx.db
      .query("product_variants")
      .withIndex("by_product", (q) => q.eq("product_id", args.id))
      .collect();

    for (const variant of variants) {
      await safeDeleteFile(ctx, variant.image_url);
      await ctx.db.delete(variant._id);
    }

    // Supprimer les images du produit
    for (const storageId of product.images) {
      await safeDeleteFile(ctx, storageId);
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Ajuste le stock d'un produit.
 * Gère automatiquement le statut out_of_stock.
 */
export const adjustStock = mutation({
  args: {
    id: v.id("products"),
    quantity: v.number(), // positif = ajout, négatif = retrait
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Produit introuvable");
    if (product.store_id !== store._id) {
      throw new Error("Ce produit n'appartient pas à votre boutique");
    }

    if (!product.track_inventory) {
      throw new Error("Le suivi de stock n'est pas activé pour ce produit");
    }

    const newQuantity = product.quantity + args.quantity;
    if (newQuantity < 0) {
      throw new Error("Le stock ne peut pas être négatif");
    }

    const updates: Record<string, unknown> = {
      quantity: newQuantity,
      updated_at: Date.now(),
    };

    // Auto out_of_stock si quantité = 0 et produit actif
    if (newQuantity === 0 && product.status === "active") {
      updates.status = "out_of_stock";
    }

    // Auto réactivation si stock revient et était out_of_stock
    if (newQuantity > 0 && product.status === "out_of_stock") {
      updates.status = "active";
    }

    await ctx.db.patch(args.id, updates);
    return { newQuantity };
  },
});

/**
 * Duplique un produit existant et ses variantes.
 * Le clone est créé en statut "draft" avec un nouveau slug.
 * Les images sont partagées (même storageIds), pas dupliquées physiquement.
 */
export const duplicate = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Produit introuvable");
    if (source.store_id !== store._id) {
      throw new Error("Ce produit n'appartient pas à votre boutique");
    }

    // Générer un slug unique pour la copie
    const slug = await generateProductSlug(ctx, `${source.title} (copie)`);

    const cloneId = await ctx.db.insert("products", {
      store_id: store._id,
      title: `${source.title} (copie)`,
      slug,
      description: source.description,
      short_description: source.short_description,
      category_id: source.category_id,
      tags: [...source.tags],
      images: [...source.images], // storageIds partagés
      price: source.price,
      compare_price: source.compare_price,
      cost_price: source.cost_price,
      sku: undefined, // SKU doit être unique, on le vide
      barcode: undefined,
      track_inventory: source.track_inventory,
      quantity: source.quantity,
      low_stock_threshold: source.low_stock_threshold,
      weight: source.weight,
      status: "draft",
      is_digital: source.is_digital,
      digital_file_url: source.digital_file_url,
      seo_title: undefined, // SEO doit être unique
      seo_description: undefined,
      published_at: undefined,
      updated_at: Date.now(),
    });

    // Dupliquer les variantes
    const variants = await ctx.db
      .query("product_variants")
      .withIndex("by_product", (q) => q.eq("product_id", args.id))
      .collect();

    for (const variant of variants) {
      await ctx.db.insert("product_variants", {
        product_id: cloneId,
        store_id: store._id,
        title: variant.title,
        options: [...variant.options],
        price: variant.price,
        compare_price: variant.compare_price,
        sku: undefined, // SKU doit être unique
        quantity: variant.quantity,
        image_url: variant.image_url, // storageId partagé
        weight: variant.weight,
        is_available: variant.is_available,
      });
    }

    return { cloneId, slug };
  },
});

/**
 * Change le statut de plusieurs produits en une seule transaction.
 * Max 50 produits par appel (limite de sécurité Convex).
 * Respecte les mêmes règles de transition que updateStatus.
 */
export const bulkUpdateStatus = mutation({
  args: {
    ids: v.array(v.id("products")),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("archived"),
    ),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    if (args.ids.length === 0) {
      throw new Error("Aucun produit sélectionné");
    }
    if (args.ids.length > 50) {
      throw new Error("Maximum 50 produits par opération bulk");
    }

    const allowed: Record<string, string[]> = {
      draft: ["active", "archived"],
      active: ["draft", "archived"],
      archived: ["draft"],
      out_of_stock: ["draft", "active"],
    };

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const productId of args.ids) {
      const product = await ctx.db.get(productId);

      if (!product) {
        results.push({ id: productId, success: false, error: "Introuvable" });
        continue;
      }
      if (product.store_id !== store._id) {
        results.push({ id: productId, success: false, error: "Accès refusé" });
        continue;
      }
      if (!allowed[product.status]?.includes(args.status)) {
        results.push({
          id: productId,
          success: false,
          error: `Transition ${product.status} → ${args.status} non autorisée`,
        });
        continue;
      }

      // Validation pour activation
      if (args.status === "active") {
        if (product.images.length === 0 || product.price <= 0) {
          results.push({
            id: productId,
            success: false,
            error: "Image et prix requis pour publier",
          });
          continue;
        }
      }

      const updates: Record<string, unknown> = {
        status: args.status,
        updated_at: Date.now(),
      };

      if (args.status === "active" && !product.published_at) {
        updates.published_at = Date.now();
      }

      await ctx.db.patch(productId, updates);
      results.push({ id: productId, success: true });
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return { results, successCount, failCount };
  },
});

/**
 * Supprime plusieurs produits en une seule transaction.
 * Supprime aussi les variantes et les fichiers storage associés.
 * Max 50 produits par appel.
 */
export const bulkDelete = mutation({
  args: {
    ids: v.array(v.id("products")),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    if (args.ids.length === 0) {
      throw new Error("Aucun produit sélectionné");
    }
    if (args.ids.length > 50) {
      throw new Error("Maximum 50 produits par opération bulk");
    }

    let deletedCount = 0;

    for (const productId of args.ids) {
      const product = await ctx.db.get(productId);

      if (!product || product.store_id !== store._id) continue;

      // Supprimer les variantes + leurs images
      const variants = await ctx.db
        .query("product_variants")
        .withIndex("by_product", (q) => q.eq("product_id", productId))
        .collect();

      for (const variant of variants) {
        await safeDeleteFile(ctx, variant.image_url);
        await ctx.db.delete(variant._id);
      }

      // Supprimer les images du produit
      for (const storageId of product.images) {
        await safeDeleteFile(ctx, storageId);
      }

      await ctx.db.delete(productId);
      deletedCount++;
    }

    return { deletedCount };
  },
});
