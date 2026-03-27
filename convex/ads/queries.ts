// filepath: convex/ads/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { resolveImageUrl } from "../products/helpers";
import { getActiveBookingsForSlot, calculateBookingPrice } from "./helpers";

/**
 * Récupérer les annonces actives pour un emplacement — PUBLIC
 * Utilisé par le storefront pour afficher les pubs
 */

export const getActiveAdsForSlot = query({
  args: { slot_id: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const bookings = await getActiveBookingsForSlot(ctx, args.slot_id, now);

    const enriched = await Promise.all(
      bookings.map(async (booking) => {
        let productData = null;
        let storeData = null;

        if (booking.product_id) {
          const product = await ctx.db.get(booking.product_id);
          if (product) {
            productData = {
              title: product.title,
              slug: product.slug,
              price: product.price,
              compare_price: product.compare_price,
              images: product.images, // si nécessaire, normaliser aussi
            };
          }
        }

        if (booking.store_id) {
          const store = await ctx.db.get(booking.store_id);
          if (store) {
            storeData = {
              name: store.name,
              slug: store.slug,
              logo_url: await resolveImageUrl(ctx, store.logo_url),
            };
          }
        }

        const imageUrl = await resolveImageUrl(ctx, booking.image_url);

        return {
          _id: booking._id,
          content_type: booking.content_type,
          image_url: imageUrl,
          title: booking.title ?? undefined,
          subtitle: booking.subtitle ?? undefined,
          cta_text: booking.cta_text ?? undefined,
          cta_link: booking.cta_link ?? undefined,
          background_color: booking.background_color ?? undefined,
          source: booking.source,
          product: productData,
          store: storeData,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Catalogue des espaces disponibles — Vendor (pour réserver)
 */
export const listAvailableSpaces = query({
  args: {},
  handler: async (ctx) => {
    const spaces = await ctx.db
      .query("ad_spaces")
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    const now = Date.now();

    // Enrichir avec le nb de slots occupés
    const enriched = await Promise.all(
      spaces.map(async (space) => {
        const activeBookings = await ctx.db
          .query("ad_bookings")
          .withIndex("by_active_slot", (q) =>
            q.eq("slot_id", space.slot_id).eq("status", "active"),
          )
          .filter((q) =>
            q.and(
              q.lte(q.field("starts_at"), now),
              q.gte(q.field("ends_at"), now),
            ),
          )
          .collect();

        const queuedCount = (
          await ctx.db
            .query("ad_bookings")
            .withIndex("by_slot", (q) =>
              q.eq("slot_id", space.slot_id).eq("status", "queued"),
            )
            .collect()
        ).length;

        return {
          ...space,
          active_count: activeBookings.length,
          available_slots: Math.max(0, space.max_slots - activeBookings.length),
          queued_count: queuedCount,
        };
      }),
    );

    return enriched.sort((a, b) => a.sort_order - b.sort_order);
  },
});

/**
 * Tous les bookings — Admin
 */
export const listAllBookings = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("active"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("queued"),
      ),
    ),
  },

  handler: async (ctx, args) => {
    let bookings;

    if (args.status !== undefined) {
      bookings = await ctx.db
        .query("ad_bookings")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      bookings = await ctx.db.query("ad_bookings").collect();
    }

    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const store = b.store_id ? await ctx.db.get(b.store_id) : null;
        const adSpace = await ctx.db.get(b.ad_space_id);

        return {
          ...b,
          store_name: store?.name ?? "Marketplace",
          space_name: adSpace?.name ?? "Inconnu",
        };
      }),
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});
/**
 * Bookings d'un vendor — Vendor dashboard
 */
export const listMyBookings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();
    if (!user) return [];

    const store = await ctx.db
      .query("stores")
      .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
      .first();
    if (!store) return [];

    const bookings = await ctx.db
      .query("ad_bookings")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const adSpace = await ctx.db.get(b.ad_space_id);
        return {
          ...b,
          space_name: adSpace?.name ?? "Inconnu",
          space_format: adSpace?.format ?? "unknown",
        };
      }),
    );

    return enriched.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Calculer le prix d'un booking (preview) — Vendor
 */
export const previewPrice = query({
  args: {
    ad_space_id: v.id("ad_spaces"),
    starts_at: v.number(),
    ends_at: v.number(),
  },
  handler: async (ctx, args) => {
    const adSpace = await ctx.db.get(args.ad_space_id);
    if (!adSpace) return null;

    const { totalPrice, breakdown } = calculateBookingPrice(adSpace, args.starts_at, args.ends_at);

    return { totalPrice, breakdown, currency: "XOF" };
  },
});

export const getBookingById = query({
  args: { booking_id: v.id("ad_bookings") },
  handler: async (ctx, { booking_id }) => {
    return await ctx.db.get(booking_id);
  },
});
