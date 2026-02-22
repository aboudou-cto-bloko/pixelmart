// filepath: convex/categories/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Liste toutes les catégories actives, triées par sort_order.
 * Utilisé côté storefront et dans les formulaires produit.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").withIndex("by_sort").collect();
  },
});

/**
 * Liste seulement les catégories actives.
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("categories").withIndex("by_sort").collect();
    return all.filter((c) => c.is_active);
  },
});

/**
 * Récupère une catégorie par son slug.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

/**
 * Arbre de catégories (racines + enfants).
 * Retourne un tableau de catégories racines avec leurs enfants.
 */
export const getTree = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("categories").withIndex("by_sort").collect();

    const active = all.filter((c) => c.is_active);
    const roots = active.filter((c) => c.parent_id === undefined);
    const children = active.filter((c) => c.parent_id !== undefined);

    return roots.map((root) => ({
      ...root,
      children: children
        .filter((c) => c.parent_id === root._id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }));
  },
});
