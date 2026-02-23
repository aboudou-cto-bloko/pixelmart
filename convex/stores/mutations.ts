// filepath: convex/stores/mutations.ts

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getVendorStore } from "../users/helpers";

/**
 * Met à jour les informations de la boutique.
 * Le vendor ne peut modifier que sa propre boutique.
 */
export const updateStore = mutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logo_url: v.optional(v.string()),
    banner_url: v.optional(v.string()),
    theme_color: v.optional(v.string()),
    country: v.optional(v.string()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const updates: Record<string, unknown> = { updated_at: Date.now() };

    if (args.name !== undefined) {
      if (args.name.trim().length < 2) {
        throw new Error(
          "Le nom de la boutique doit faire au moins 2 caractères",
        );
      }
      updates.name = args.name.trim();

      // Regénérer le slug si le nom change
      const baseSlug = args.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      let slug = baseSlug;
      let counter = 0;
      while (true) {
        const existing = await ctx.db
          .query("stores")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique();
        if (!existing || existing._id === store._id) break;
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
      updates.slug = slug;
    }

    if (args.description !== undefined) updates.description = args.description;
    if (args.logo_url !== undefined) updates.logo_url = args.logo_url;
    if (args.banner_url !== undefined) updates.banner_url = args.banner_url;
    if (args.theme_color !== undefined) updates.theme_color = args.theme_color;
    if (args.country !== undefined) updates.country = args.country;
    if (args.currency !== undefined) updates.currency = args.currency;

    await ctx.db.patch(store._id, updates);
    return { success: true };
  },
});

/**
 * Génère une URL d'upload pour logo ou banner.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getVendorStore(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
