import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../users/helpers";

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    parent_id: v.optional(v.id("categories")),
    icon_url: v.optional(v.string()),
    sort_order: v.number(),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Vérifier unicité du slug
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      throw new Error(`Le slug "${args.slug}" existe déjà`);
    }

    // Vérifier que le parent existe si fourni (max 2 niveaux)
    if (args.parent_id) {
      const parent = await ctx.db.get(args.parent_id);
      if (!parent) throw new Error("Catégorie parent introuvable");
      if (parent.parent_id) {
        throw new Error("Maximum 2 niveaux de profondeur");
      }
    }

    return await ctx.db.insert("categories", {
      name: args.name,
      slug: args.slug,
      parent_id: args.parent_id,
      icon_url: args.icon_url,
      sort_order: args.sort_order,
      is_active: args.is_active,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    icon_url: v.optional(v.string()),
    sort_order: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const category = await ctx.db.get(args.id);
    if (!category) throw new Error("Catégorie introuvable");

    // Vérifier unicité du slug si modifié
    if (args.slug !== undefined && args.slug !== category.slug) {
      const existingSlug = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
        .unique();
      if (existingSlug) {
        throw new Error(`Le slug "${args.slug}" existe déjà`);
      }
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.slug !== undefined) updates.slug = args.slug;
    if (args.icon_url !== undefined) updates.icon_url = args.icon_url;
    if (args.sort_order !== undefined) updates.sort_order = args.sort_order;
    if (args.is_active !== undefined) updates.is_active = args.is_active;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Vérifier qu'aucun produit n'utilise cette catégorie
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category_id", args.id))
      .first();
    if (products) {
      throw new Error(
        "Impossible de supprimer : des produits utilisent cette catégorie",
      );
    }

    // Vérifier qu'aucune sous-catégorie n'existe
    const children = await ctx.db
      .query("categories")
      .withIndex("by_parent", (q) => q.eq("parent_id", args.id))
      .first();
    if (children) {
      throw new Error(
        "Impossible de supprimer : cette catégorie a des sous-catégories",
      );
    }

    await ctx.db.delete(args.id);
  },
});
