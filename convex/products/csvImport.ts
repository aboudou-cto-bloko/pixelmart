// filepath: convex/products/csvImport.ts

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getVendorStore } from "../users/helpers";
import { generateProductSlug } from "./helpers";

/**
 * Schéma d'un produit CSV à importer.
 * Le parsing et la validation primaire se font côté client.
 * La mutation fait la validation métier + insertion.
 */
const csvProductValidator = v.object({
  title: v.string(),
  description: v.string(),
  short_description: v.optional(v.string()),
  category_id: v.id("categories"),
  tags: v.array(v.string()),
  price: v.number(), // centimes
  compare_price: v.optional(v.number()),
  cost_price: v.optional(v.number()),
  sku: v.optional(v.string()),
  track_inventory: v.boolean(),
  quantity: v.number(),
  low_stock_threshold: v.optional(v.number()),
  weight: v.optional(v.number()),
  is_digital: v.boolean(),
});

/**
 * Importe un lot de produits depuis un CSV parsé côté client.
 * Tous les produits sont créés en statut "draft" sans images.
 * Le vendor devra ajouter les images manuellement après import.
 *
 * Max 100 produits par appel (limite Convex transaction).
 * Pour 500 produits, le client fait 5 appels séquentiels.
 */
export const importBatch = mutation({
  args: {
    products: v.array(csvProductValidator),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    if (args.products.length === 0) {
      throw new Error("Aucun produit à importer");
    }
    if (args.products.length > 100) {
      throw new Error(
        "Maximum 100 produits par lot (divisez en plusieurs appels)",
      );
    }

    const results: Array<{
      index: number;
      success: boolean;
      productId?: string;
      error?: string;
    }> = [];

    for (let i = 0; i < args.products.length; i++) {
      const row = args.products[i];

      try {
        // Validations métier
        if (row.price <= 0) {
          results.push({ index: i, success: false, error: "Prix invalide" });
          continue;
        }
        if (row.title.trim().length === 0) {
          results.push({ index: i, success: false, error: "Titre vide" });
          continue;
        }

        // Vérifier la catégorie
        const category = await ctx.db.get(row.category_id);
        if (!category || !category.is_active) {
          results.push({
            index: i,
            success: false,
            error: "Catégorie invalide",
          });
          continue;
        }

        const slug = await generateProductSlug(ctx, row.title);

        const productId = await ctx.db.insert("products", {
          store_id: store._id,
          title: row.title,
          slug,
          description: row.description,
          short_description: row.short_description,
          category_id: row.category_id,
          tags: row.tags,
          images: [], // Pas d'images dans le CSV
          price: row.price,
          compare_price: row.compare_price,
          cost_price: row.cost_price,
          sku: row.sku,
          barcode: undefined,
          track_inventory: row.track_inventory,
          quantity: row.quantity,
          low_stock_threshold: row.low_stock_threshold ?? 5,
          weight: row.weight,
          status: "draft", // Toujours draft — le vendor publie après ajout images
          is_digital: row.is_digital,
          digital_file_url: undefined,
          seo_title: undefined,
          seo_description: undefined,
          published_at: undefined,
          updated_at: Date.now(),
        });

        results.push({ index: i, success: true, productId });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        results.push({ index: i, success: false, error: message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return {
      results,
      successCount,
      failCount,
      totalProcessed: args.products.length,
    };
  },
});
