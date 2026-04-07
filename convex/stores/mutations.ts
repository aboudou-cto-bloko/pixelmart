// filepath: convex/stores/mutations.ts

import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import { getVendorStore, requireVendor } from "../users/helpers";
import { rateLimiter } from "../lib/ratelimits";
import { STORE_THEMES } from "./themes";

/**
 * Server-side HTML sanitization for store descriptions
 */
function sanitizeHTML(html: string): string {
  if (!html) return "";

  // Remove script tags and their content
  let sanitized = html.replace(/<script[^>]*>.*?<\/script>/gi, "");

  // Remove dangerous event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Allow only safe HTML tags for store descriptions
  const allowedTags = ["p", "br", "strong", "b", "em", "i", "u"];

  // Remove any tag not in the allowed list
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // Remove dangerous attributes but keep the tag
      return match.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
    }
    return ""; // Remove disallowed tags completely
  });

  return sanitized.trim();
}

/**
 * Validate store data for security and business rules
 */
function validateStoreData(data: {
  name?: string;
  description?: string;
  primary_color?: string;
  country?: string;
  currency?: string;
}) {
  // Name validation
  if (data.name !== undefined) {
    if (data.name.trim().length < 2 || data.name.trim().length > 100) {
      throw new ConvexError("Le nom doit contenir entre 2 et 100 caractères");
    }

    // Check for dangerous characters in name
    if (/[<>"'&]/.test(data.name)) {
      throw new ConvexError("Le nom contient des caractères non autorisés");
    }
  }

  // Description validation
  if (data.description !== undefined && data.description.length > 2000) {
    throw new ConvexError(
      "La description ne peut pas dépasser 2000 caractères",
    );
  }

  // Color validation - accept 3 or 6 digit hex colors
  if (data.primary_color !== undefined) {
    if (
      !/^#[0-9A-Fa-f]{3}$/.test(data.primary_color) &&
      !/^#[0-9A-Fa-f]{6}$/.test(data.primary_color)
    ) {
      throw new ConvexError("Format de couleur invalide (ex: #6366f1 ou #fff)");
    }

    // Prevent too dark or too light colors (both 3 and 6 digit formats)
    const invalidColors = ["#000000", "#ffffff", "#000", "#fff"];
    if (invalidColors.includes(data.primary_color.toLowerCase())) {
      throw new ConvexError("Veuillez choisir une couleur plus distinctive");
    }
  }

  // Country validation
  if (data.country !== undefined) {
    const supportedCountries = [
      "BJ",
      "FR",
      "US",
      "CI",
      "SN",
      "ML",
      "BF",
      "TG",
      "NE",
    ];
    if (!supportedCountries.includes(data.country)) {
      throw new ConvexError("Pays non supporté");
    }
  }

  // Currency validation
  if (data.currency !== undefined) {
    const supportedCurrencies = ["XOF", "EUR", "USD"];
    if (!supportedCurrencies.includes(data.currency)) {
      throw new ConvexError("Devise non supportée");
    }
  }

  return {
    name: data.name?.trim(),
    description: data.description ? sanitizeHTML(data.description) : undefined,
    primary_color: data.primary_color,
    country: data.country,
    currency: data.currency,
  };
}

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
    // Contact
    contact_phone: v.optional(v.string()),
    contact_whatsapp: v.optional(v.string()),
    contact_email: v.optional(v.string()),
    contact_website: v.optional(v.string()),
    contact_facebook: v.optional(v.string()),
    contact_instagram: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    // Validate and sanitize input data
    const validatedData = validateStoreData({
      name: args.name,
      description: args.description,
      primary_color: args.primary_color,
      country: args.country,
      currency: args.currency,
    });

    const updates: Record<string, unknown> = { updated_at: Date.now() };

    if (validatedData.name !== undefined) {
      updates.name = validatedData.name;

      // Regénérer le slug si le nom change
      const baseSlug = validatedData.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
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

    if (validatedData.description !== undefined) {
      updates.description = validatedData.description;
    }
    if (args.logo_url !== undefined) {
      // Additional validation for storage IDs could be added here
      updates.logo_url = args.logo_url;
    }
    if (args.banner_url !== undefined) {
      // Additional validation for storage IDs could be added here
      updates.banner_url = args.banner_url;
    }
    if (validatedData.primary_color !== undefined) {
      updates.primary_color = validatedData.primary_color;
    }
    if (validatedData.country !== undefined) {
      updates.country = validatedData.country;
    }
    if (validatedData.currency !== undefined) {
      updates.currency = validatedData.currency;
    }
    if (args.contact_phone !== undefined)
      updates.contact_phone = args.contact_phone || undefined;
    if (args.contact_whatsapp !== undefined)
      updates.contact_whatsapp = args.contact_whatsapp || undefined;
    if (args.contact_email !== undefined)
      updates.contact_email = args.contact_email || undefined;
    if (args.contact_website !== undefined)
      updates.contact_website = args.contact_website || undefined;
    if (args.contact_facebook !== undefined)
      updates.contact_facebook = args.contact_facebook || undefined;
    if (args.contact_instagram !== undefined)
      updates.contact_instagram = args.contact_instagram || undefined;

    await ctx.db.patch(store._id, updates);
    return { success: true };
  },
});

/**
 * Met à jour les paramètres de livraison / point de retrait.
 * Bloqué si le store a des commandes actives.
 *
 * Modes:
 *   "full"          → use_pixelmart_service=true,  has_storage_plan=true,  no custom pickup
 *   "delivery_only" → use_pixelmart_service=true,  has_storage_plan=false, custom pickup required
 *   "none"          → use_pixelmart_service=false, has_storage_plan=false, no custom pickup
 */
export const updateDeliverySettings = mutation({
  args: {
    use_pixelmart_service: v.boolean(),
    has_storage_plan: v.boolean(),
    custom_pickup_lat: v.optional(v.number()),
    custom_pickup_lon: v.optional(v.number()),
    custom_pickup_label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    // ---- Validate state ----
    if (!args.use_pixelmart_service && args.has_storage_plan) {
      throw new ConvexError(
        "État invalide : impossible d'avoir un plan de stockage sans le service Pixel-Mart.",
      );
    }

    // delivery_only: use_pixelmart_service=true + has_storage_plan=false → custom pickup required
    const isDeliveryOnly = args.use_pixelmart_service && !args.has_storage_plan;

    if (isDeliveryOnly) {
      if (
        args.custom_pickup_lat === undefined ||
        args.custom_pickup_lon === undefined ||
        !args.custom_pickup_label?.trim()
      ) {
        throw new ConvexError(
          "L'adresse de retrait personnalisée est requise en mode livraison uniquement.",
        );
      }

      if (
        args.custom_pickup_lat < -90 ||
        args.custom_pickup_lat > 90 ||
        args.custom_pickup_lon < -180 ||
        args.custom_pickup_lon > 180
      ) {
        throw new ConvexError("Coordonnées géographiques invalides.");
      }

      if (
        args.custom_pickup_label.trim().length < 5 ||
        args.custom_pickup_label.trim().length > 200
      ) {
        throw new ConvexError(
          "L'adresse doit contenir entre 5 et 200 caractères.",
        );
      }

      if (/[<>"'&]/.test(args.custom_pickup_label)) {
        throw new ConvexError(
          "L'adresse contient des caractères non autorisés.",
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

    await ctx.db.patch(store._id, {
      use_pixelmart_service: args.use_pixelmart_service,
      has_storage_plan: args.has_storage_plan,
      // Custom pickup saved only for delivery_only mode
      custom_pickup_lat: isDeliveryOnly ? args.custom_pickup_lat : undefined,
      custom_pickup_lon: isDeliveryOnly ? args.custom_pickup_lon : undefined,
      custom_pickup_label: isDeliveryOnly
        ? args.custom_pickup_label?.trim()
        : undefined,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Génère une URL d'upload pour logo ou banner.
 * Inclut une validation de base pour éviter l'abus.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    const { ok } = await rateLimiter.limit(ctx, "generateUploadUrl", {
      key: store._id,
    });
    if (!ok) {
      throw new ConvexError(
        "Trop d'uploads récents. Veuillez patienter avant de réessayer.",
      );
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const updateStoreTheme = mutation({
  args: {
    theme_id: v.string(),
    primary_color: v.optional(v.string()),
    theme_mode: v.optional(v.union(v.literal("light"), v.literal("dark"))),
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
      theme_mode: args.theme_mode ?? "light",
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Change la boutique active du vendor (multi-boutiques).
 */
export const switchActiveStore = mutation({
  args: { store_id: v.id("stores") },
  handler: async (ctx, { store_id }) => {
    const user = await requireVendor(ctx);
    const targetStore = await ctx.db.get(store_id);
    if (!targetStore || targetStore.owner_id !== user._id) {
      throw new ConvexError("Boutique introuvable ou non autorisée");
    }
    await ctx.db.patch(user._id, {
      active_store_id: store_id,
      updated_at: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Crée une boutique supplémentaire pour un vendor déjà existant.
 */
export const createAdditionalStore = mutation({
  args: {
    store_name: v.string(),
    country: v.optional(v.string()),
    currency: v.optional(v.string()),
    description: v.optional(v.string()),
    contact_phone: v.optional(v.string()),
    contact_whatsapp: v.optional(v.string()),
    contact_email: v.optional(v.string()),
    use_pixelmart_service: v.optional(v.boolean()),
    custom_pickup_lat: v.optional(v.number()),
    custom_pickup_lon: v.optional(v.number()),
    custom_pickup_label: v.optional(v.string()),
    affiliate_code: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await getVendorStore(ctx);

    if (args.store_name.length < 3 || args.store_name.length > 60) {
      throw new ConvexError("Le nom doit contenir entre 3 et 60 caractères");
    }

    // Slug generation
    const baseSlug = args.store_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let slug = baseSlug;
    let counter = 0;
    while (true) {
      const existing = await ctx.db
        .query("stores")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      if (!existing) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const usePixelmartService = args.use_pixelmart_service ?? true;
    const hasCustomPickup = args.custom_pickup_lat !== undefined;
    const hasStoragePlan = usePixelmartService && !hasCustomPickup;
    const isDeliveryOnly = usePixelmartService && !hasStoragePlan;

    const storeId = await ctx.db.insert("stores", {
      owner_id: user._id,
      name: args.store_name,
      slug,
      description: args.description ?? "",
      theme_id: "default",
      status: "active",
      subscription_tier: "free",
      commission_rate: 500,
      balance: 0,
      pending_balance: 0,
      currency: args.currency ?? "XOF",
      level: "bronze",
      total_orders: 0,
      avg_rating: 0,
      is_verified: false,
      country: args.country ?? "BJ",
      use_pixelmart_service: usePixelmartService,
      custom_pickup_lat: isDeliveryOnly ? args.custom_pickup_lat : undefined,
      custom_pickup_lon: isDeliveryOnly ? args.custom_pickup_lon : undefined,
      custom_pickup_label: isDeliveryOnly
        ? args.custom_pickup_label
        : undefined,
      has_storage_plan: hasStoragePlan,
      contact_phone: args.contact_phone || undefined,
      contact_whatsapp: args.contact_whatsapp || undefined,
      contact_email: args.contact_email || undefined,
      updated_at: Date.now(),
    });

    // Activer immédiatement la nouvelle boutique
    await ctx.db.patch(user._id, {
      active_store_id: storeId,
      updated_at: Date.now(),
    });

    // Affiliation : lier la boutique au parrain si un code est fourni
    if (args.affiliate_code) {
      await ctx.scheduler.runAfter(
        0,
        internal.affiliate.mutations.linkStoreToAffiliate,
        {
          store_id: storeId,
          owner_id: user._id,
          affiliate_code: args.affiliate_code,
        },
      );
    }

    return { storeId, slug };
  },
});

/**
 * Active/désactive la visibilité des produits de cette boutique sur la marketplace.
 * Réservé aux vendeurs ayant une boutique personnelle (vendor_shop_enabled).
 */
export const toggleMarketplaceVisibility = mutation({
  args: {
    hide: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    if (!store.vendor_shop_enabled) {
      throw new ConvexError(
        "Cette option est réservée aux vendeurs ayant une boutique personnelle activée.",
      );
    }

    await ctx.db.patch(store._id, {
      hide_from_marketplace: args.hide,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});
