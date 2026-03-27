import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser } from "./helpers";

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    locale: v.optional(v.union(v.literal("fr"), v.literal("en"))),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const updates: Record<string, unknown> = { updated_at: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.locale !== undefined) updates.locale = args.locale;

    await ctx.db.patch(user._id, updates);
    return { success: true };
  },
});

export const becomeVendor = mutation({
  args: {
    store_name: v.string(),
    country: v.optional(v.string()),
    currency: v.optional(v.string()),
    description: v.optional(v.string()),
    // Delivery settings — optional at creation, default = mode A (full Pixel-Mart)
    use_pixelmart_service: v.optional(v.boolean()),
    custom_pickup_lat: v.optional(v.number()),
    custom_pickup_lon: v.optional(v.number()),
    custom_pickup_label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    if (user.role !== "customer") {
      throw new Error("Seul un customer peut devenir vendor");
    }

    // ---- Server-side validation ----
    if (args.store_name.length < 3 || args.store_name.length > 60) {
      throw new Error("Le nom doit contenir entre 3 et 60 caractères");
    }
    if (!/^[a-zA-ZÀ-ÿ0-9\s\-'.]+$/.test(args.store_name)) {
      throw new Error("Caractères spéciaux non autorisés dans le nom");
    }
    if (args.description && args.description.length > 500) {
      throw new Error("La description ne peut pas dépasser 500 caractères");
    }

    // ---- Slug generation (collision-safe) ----
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

    // ---- Derive delivery mode ----
    // Mode A: use_pixelmart_service=true  + no custom pickup → has_storage_plan=true
    // Mode B: use_pixelmart_service=true  + custom pickup set → has_storage_plan=false
    // Mode C: use_pixelmart_service=false + no pickup         → has_storage_plan=false
    const usePixelmartService = args.use_pixelmart_service ?? true;
    const hasCustomPickup = args.custom_pickup_lat !== undefined;
    const hasStoragePlan = usePixelmartService && !hasCustomPickup;

    // Custom pickup only when NOT using Pixelmart service
    const pickupLat = !usePixelmartService ? args.custom_pickup_lat : undefined;
    const pickupLon = !usePixelmartService ? args.custom_pickup_lon : undefined;
    const pickupLabel = !usePixelmartService
      ? args.custom_pickup_label
      : undefined;

    // ---- Insert store ----
    const storeId = await ctx.db.insert("stores", {
      owner_id: user._id,
      name: args.store_name,
      slug,
      description: args.description ?? "",
      logo_url: undefined,
      banner_url: undefined,
      theme_id: "default",
      primary_color: undefined,
      status: "active",
      subscription_tier: "free",
      subscription_ends_at: undefined,
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
      custom_pickup_lat: pickupLat,
      custom_pickup_lon: pickupLon,
      custom_pickup_label: pickupLabel,
      has_storage_plan: hasStoragePlan,
      updated_at: Date.now(),
    });

    await ctx.db.patch(user._id, {
      role: "vendor",
      updated_at: Date.now(),
    });

    return { storeId, slug };
  },
});
