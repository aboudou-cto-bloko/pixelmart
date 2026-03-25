// filepath: convex/product_specs/mutations.ts

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getVendorStore } from "../users/helpers";

export const createMany = mutation({
  args: {
    product_id: v.id("products"),
    specs: v.array(
      v.object({
        spec_key: v.string(),
        spec_value: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    // Verify product belongs to vendor
    const product = await ctx.db.get(args.product_id);
    if (!product || product.store_id !== store._id) {
      throw new Error("Produit introuvable ou accès refusé");
    }

    // Delete existing specs for this product
    const existingSpecs = await ctx.db
      .query("product_specs")
      .withIndex("by_product", (q) => q.eq("product_id", args.product_id))
      .collect();

    for (const spec of existingSpecs) {
      await ctx.db.delete(spec._id);
    }

    // Create new specs
    const specIds = [];
    for (let i = 0; i < args.specs.length; i++) {
      const spec = args.specs[i];
      if (spec.spec_key.trim() && spec.spec_value.trim()) {
        const specId = await ctx.db.insert("product_specs", {
          product_id: args.product_id,
          store_id: store._id,
          spec_key: spec.spec_key.trim(),
          spec_value: spec.spec_value.trim(),
          display_order: i,
        });
        specIds.push(specId);
      }
    }

    return { specIds };
  },
});

export const deleteByProduct = mutation({
  args: {
    product_id: v.id("products"),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const specs = await ctx.db
      .query("product_specs")
      .withIndex("by_product", (q) => q.eq("product_id", args.product_id))
      .collect();

    for (const spec of specs) {
      if (spec.store_id === store._id) {
        await ctx.db.delete(spec._id);
      }
    }
  },
});
