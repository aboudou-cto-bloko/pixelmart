// filepath: convex/stores/mutations.ts

import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { getVendorStore } from "../users/helpers";
import { STORE_THEMES } from "./themes";

/** Statuts considérés comme "commandes actives" bloquant le changement de livraison */
const ACTIVE_ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "ready_for_delivery",
  "shipped",
] as const;

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
    primary_color: v.optional(v.string()),
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
    if (args.primary_color !== undefined)
      updates.primary_color = args.primary_color;
    if (args.country !== undefined) updates.country = args.country;
    if (args.currency !== undefined) updates.currency = args.currency;

    await ctx.db.patch(store._id, updates);
    return { success: true };
  },
});

/**
 * Met à jour les paramètres de livraison / point de retrait.
 * Bloqué si le store a des commandes actives.
 */
export const updateDeliverySettings = mutation({
  args: {
    use_pixelmart_service: v.boolean(),
    custom_pickup_lat: v.optional(v.number()),
    custom_pickup_lon: v.optional(v.number()),
    custom_pickup_label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    // ---- Validate per mode ----
    // Mode B: use_pixelmart_service=true + custom pickup → coordinates required
    if (
      args.use_pixelmart_service &&
      (args.custom_pickup_lat !== undefined ||
        args.custom_pickup_lon !== undefined ||
        args.custom_pickup_label)
    ) {
      if (
        args.custom_pickup_lat === undefined ||
        args.custom_pickup_lon === undefined ||
        !args.custom_pickup_label?.trim()
      ) {
        throw new ConvexError(
          "Les coordonnées et l'adresse sont toutes obligatoires pour le point de retrait personnalisé.",
        );
      }
    }

    // Mode C: use_pixelmart_service=false → no pickup address allowed
    if (!args.use_pixelmart_service) {
      if (
        args.custom_pickup_lat !== undefined ||
        args.custom_pickup_lon !== undefined ||
        args.custom_pickup_label
      ) {
        throw new ConvexError(
          "Aucun point de retrait n'est autorisé en mode livraison autonome.",
        );
      }
    }

    // ---- Block if active orders ----
    for (const status of ACTIVE_ORDER_STATUSES) {
      const active = await ctx.db
        .query("orders")
        .withIndex("by_store", (q) => q.eq("store_id", store._id))
        .filter((q) => q.eq(q.field("status"), status))
        .first();

      if (active) {
        throw new ConvexError(
          "Vous avez des commandes en cours. Vous pourrez modifier vos paramètres de livraison une fois toutes les commandes terminées.",
        );
      }
    }

    // ---- Derive has_storage_plan ----
    // Mode A: use_pixelmart_service=true  + no custom pickup → true
    // Mode B: use_pixelmart_service=true  + custom pickup    → false
    // Mode C: use_pixelmart_service=false                    → false
    const hasCustomPickup = args.custom_pickup_lat !== undefined;
    const hasStoragePlan = args.use_pixelmart_service && !hasCustomPickup;

    await ctx.db.patch(store._id, {
      use_pixelmart_service: args.use_pixelmart_service,
      // Mode C clears pickup; Mode A/B keeps or sets it
      custom_pickup_lat: args.use_pixelmart_service
        ? args.custom_pickup_lat
        : undefined,
      custom_pickup_lon: args.use_pixelmart_service
        ? args.custom_pickup_lon
        : undefined,
      custom_pickup_label: args.use_pixelmart_service
        ? args.custom_pickup_label?.trim()
        : undefined,
      has_storage_plan: hasStoragePlan,
      updated_at: Date.now(),
    });

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

export const updateStoreTheme = mutation({
  args: {
    theme_id: v.string(),
    primary_color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    // Valider que le theme_id existe
    if (!(args.theme_id in STORE_THEMES)) {
      throw new ConvexError("Thème invalide");
    }

    // Valider le format hex si fourni
    if (args.primary_color && !/^#[0-9A-Fa-f]{6}$/.test(args.primary_color)) {
      throw new ConvexError("Format couleur invalide (attendu: #RRGGBB)");
    }

    await ctx.db.patch(store._id, {
      theme_id: args.theme_id,
      primary_color: args.primary_color,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});
