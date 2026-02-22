import { mutation } from "../_generated/server";
import { requireAdmin } from "../users/helpers";

const SEED_CATEGORIES = [
  { name: "Mode", slug: "mode", sort_order: 1 },
  { name: "Électronique", slug: "electronique", sort_order: 2 },
  { name: "Maison & Déco", slug: "maison-deco", sort_order: 3 },
  { name: "Beauté & Santé", slug: "beaute-sante", sort_order: 4 },
  { name: "Alimentation", slug: "alimentation", sort_order: 5 },
  { name: "Sport & Loisirs", slug: "sport-loisirs", sort_order: 6 },
  { name: "Digital", slug: "digital", sort_order: 7 },
  { name: "Services", slug: "services", sort_order: 8 },
] as const;

export const seedCategories = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

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
