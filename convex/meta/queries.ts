// filepath: convex/meta/queries.ts

import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { resolveImageUrl } from "../products/helpers";
import { buildCssVariables, getThemeById } from "../stores/themes";

/**
 * Config publique Meta Pixel (sans token secret).
 * Utilisé par le frontend pour initialiser fbq et afficher le shop.
 */
export const getPublicConfig = query({
  args: { storeSlug: v.string() },
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", args.storeSlug))
      .first();

    if (!store || store.status !== "active") {
      return null;
    }

    const logoUrl = store.logo_url
      ? await resolveImageUrl(ctx, store.logo_url)
      : null;

    const themeId = store.theme_id ?? "default";
    const themeMode = (store.theme_mode ?? "light") as "light" | "dark";
    const theme = getThemeById(themeId);
    const cssVars = buildCssVariables(
      theme,
      store.primary_color,
      themeMode === "dark",
    );

    return {
      storeId: store._id,
      storeName: store.name,
      storeSlug: store.slug,
      storeDescription: store.description ?? null,
      pixelId: store.meta_pixel_id ?? null,
      testEventCode: store.meta_test_event_code ?? null,
      vendorShopEnabled: store.vendor_shop_enabled ?? false,
      primaryColor: store.primary_color ?? "#6366f1",
      themeId,
      themeMode,
      themeCssVars: cssVars,
      logoUrl,
      currency: store.currency ?? "XOF",
      isVerified: store.is_verified,
      avgRating: store.avg_rating,
      totalOrders: store.total_orders,
      contact: {
        phone: store.contact_phone ?? null,
        whatsapp: store.contact_whatsapp ?? null,
        email: store.contact_email ?? null,
        website: store.contact_website ?? null,
        facebook: store.contact_facebook ?? null,
        instagram: store.contact_instagram ?? null,
      },
    };
  },
});

/**
 * Config complète Meta (avec token) — usage interne uniquement.
 * Ne jamais exposer côté client.
 */
export const getStoreMetaConfig = internalQuery({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) return null;

    return {
      pixelId: store.meta_pixel_id ?? null,
      accessToken: store.meta_access_token ?? null,
      testEventCode: store.meta_test_event_code ?? null,
      currency: store.currency ?? "XOF",
      storeSlug: store.slug,
    };
  },
});
