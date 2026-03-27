import { mutation } from "../_generated/server";
import { requireAdmin } from "../users/helpers";

const SEED_CATEGORIES = [
  { name: "Mode", slug: "mode", sort_order: 1 },
  { name: "Électronique", slug: "electronique", sort_order: 2 },
  { name: "Maison & Déco", slug: "maison-deco", sort_order: 3 },
  { name: "Beauté & Santé", slug: "beaute-sante", sort_order: 4 },
  { name: "Alimentation", slug: "alimentation", sort_order: 5 },
  { name: "Sport & Loisirs", slug: "sport-loisirs", sort_order: 6 },
] as const;

export const seedCategories = mutation({
  args: {},
  handler: async (ctx) => {
    // Vérifier si déjà seedé
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_sort")
      .first();
    if (existing) {
      throw new Error("Les catégories existent déjà");
    }

    const ids = [];
    for (const cat of SEED_CATEGORIES) {
      const id = await ctx.db.insert("categories", {
        name: cat.name,
        slug: cat.slug,
        parent_id: undefined,
        icon_url: undefined,
        sort_order: cat.sort_order,
        is_active: true,
      });
      ids.push(id);
    }

    return { inserted: ids.length };
  },
});

/**
 * Migration one-shot : supprime les catégories "Digital" et "Services".
 * À exécuter une fois : npx convex run categories/seed:removeDigitalAndServices
 */
export const removeDigitalAndServices = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const slugsToRemove = ["digital", "services"];
    let removed = 0;
    for (const slug of slugsToRemove) {
      const cat = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      if (cat) {
        await ctx.db.delete(cat._id);
        removed++;
      }
    }
    return { removed };
  },
});
