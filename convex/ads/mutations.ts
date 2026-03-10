// filepath: convex/ads/mutations.ts

import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { requireAdmin, getVendorStore } from "../users/helpers";
import { calculateBookingPrice } from "./helpers";
import { AD_PRIORITY } from "./constants";

/**
 * Vendor réserve un espace pub
 */
export const createBooking = mutation({
  args: {
    ad_space_id: v.id("ad_spaces"),
    content_type: v.union(
      v.literal("product"),
      v.literal("store"),
      v.literal("banner"),
      v.literal("promotion"),
    ),
    product_id: v.optional(v.id("products")),
    image_url: v.optional(v.string()),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    cta_text: v.optional(v.string()),
    cta_link: v.optional(v.string()),
    background_color: v.optional(v.string()),
    starts_at: v.number(),
    ends_at: v.number(),
  },
  handler: async (ctx, args) => {
    const { user, store } = await getVendorStore(ctx);

    // Validation dates
    const now = Date.now();
    if (args.starts_at < now - 60000) {
      throw new ConvexError("La date de début doit être dans le futur");
    }
    if (args.ends_at <= args.starts_at) {
      throw new ConvexError("La date de fin doit être après la date de début");
    }

    // Récupérer l'espace
    const adSpace = await ctx.db.get(args.ad_space_id);
    if (!adSpace || !adSpace.is_active) {
      throw new ConvexError("Espace publicitaire indisponible");
    }

    // Validation produit si content_type = product
    if (args.content_type === "product") {
      if (!args.product_id) {
        throw new ConvexError("product_id requis pour le type 'product'");
      }
      const product = await ctx.db.get(args.product_id);
      if (!product || product.store_id !== store._id) {
        throw new ConvexError("Produit invalide ou non autorisé");
      }
    }

    // Validation banner
    if (args.content_type === "banner" && !args.image_url) {
      throw new ConvexError("image_url requis pour le type 'banner'");
    }

    // Calculer le prix
    const { totalPrice, breakdown } = calculateBookingPrice(
      adSpace,
      args.starts_at,
      args.ends_at,
    );

    // Vérifier si des slots sont dispo ou si on met en queue
    const activeBookings = await ctx.db
      .query("ad_bookings")
      .withIndex("by_active_slot", (q) =>
        q.eq("slot_id", adSpace.slot_id).eq("status", "active"),
      )
      .filter((q) =>
        q.and(
          q.lte(q.field("starts_at"), args.ends_at),
          q.gte(q.field("ends_at"), args.starts_at),
        ),
      )
      .collect();

    const isQueueNeeded = activeBookings.length >= adSpace.max_slots;

    const bookingId = await ctx.db.insert("ad_bookings", {
      ad_space_id: args.ad_space_id,
      slot_id: adSpace.slot_id,
      store_id: store._id,
      booked_by: user._id,
      content_type: args.content_type,
      product_id: args.product_id,
      image_url: args.image_url,
      title: args.title,
      subtitle: args.subtitle,
      cta_text: args.cta_text,
      cta_link: args.cta_link,
      background_color: args.background_color,
      starts_at: args.starts_at,
      ends_at: args.ends_at,
      total_price: totalPrice,
      currency: store.currency || "XOF",
      source: "vendor",
      priority: isQueueNeeded ? AD_PRIORITY.QUEUED : AD_PRIORITY.VENDOR_PAID,
      status: isQueueNeeded ? "queued" : "pending",
      payment_status: "unpaid",
      impressions: 0,
      clicks: 0,
      updated_at: now,
    });

    return {
      bookingId,
      totalPrice,
      breakdown,
      status: isQueueNeeded ? "queued" : "pending",
    };
  },
});

/**
 * Admin place une annonce (override prioritaire, peut être gratuit)
 */
export const adminCreateBooking = mutation({
  args: {
    ad_space_id: v.id("ad_spaces"),
    store_id: v.optional(v.id("stores")), // optionnel pour contenu marketplace
    content_type: v.union(
      v.literal("product"),
      v.literal("store"),
      v.literal("banner"),
      v.literal("promotion"),
    ),
    product_id: v.optional(v.id("products")),
    image_url: v.optional(v.string()),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    cta_text: v.optional(v.string()),
    cta_link: v.optional(v.string()),
    background_color: v.optional(v.string()),
    starts_at: v.number(),
    ends_at: v.number(),
    is_free: v.optional(v.boolean()),
    admin_notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);

    const adSpace = await ctx.db.get(args.ad_space_id);
    if (!adSpace) throw new ConvexError("Espace introuvable");

    // Pour les bannières marketplace (sans store)
    // On utilise un store_id factice ou on le rend optionnel
    // Ici on requiert quand même un store sauf pour les bannières génériques

    const bookingId = await ctx.db.insert("ad_bookings", {
      ad_space_id: args.ad_space_id,
      slot_id: adSpace.slot_id,
      store_id: args.store_id,
      booked_by: user._id,
      content_type: args.content_type,
      product_id: args.product_id,
      image_url: args.image_url,
      title: args.title,
      subtitle: args.subtitle,
      cta_text: args.cta_text,
      cta_link: args.cta_link,
      background_color: args.background_color,
      starts_at: args.starts_at,
      ends_at: args.ends_at,
      total_price: args.is_free ? 0 : 0, // admin peut set un prix custom plus tard
      currency: "XOF",
      source: "admin",
      priority: AD_PRIORITY.ADMIN_OVERRIDE, // TOUJOURS en override
      status: "active", // Admin = direct actif, pas de file
      payment_status: args.is_free ? "waived" : "paid",
      impressions: 0,
      clicks: 0,
      admin_notes: args.admin_notes,
      updated_at: Date.now(),
    });

    return { bookingId };
  },
});

/**
 * Admin confirme un booking vendor (après paiement)
 */
export const confirmBooking = mutation({
  args: {
    booking_id: v.id("ad_bookings"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const booking = await ctx.db.get(args.booking_id);
    if (!booking) throw new ConvexError("Réservation introuvable");
    if (booking.status !== "pending") {
      throw new ConvexError(
        "Seuls les bookings en attente peuvent être confirmés",
      );
    }

    await ctx.db.patch(args.booking_id, {
      status: "confirmed",
      priority: AD_PRIORITY.VENDOR_PAID,
      payment_status: "paid",
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Admin annule un booking
 */
export const cancelBooking = mutation({
  args: {
    booking_id: v.id("ad_bookings"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const booking = await ctx.db.get(args.booking_id);
    if (!booking) throw new ConvexError("Réservation introuvable");

    await ctx.db.patch(args.booking_id, {
      status: "cancelled",
      admin_notes: args.reason,
      updated_at: Date.now(),
    });

    // Si payé, créer un remboursement
    if (booking.payment_status === "paid" && booking.total_price > 0) {
      await ctx.db.patch(args.booking_id, {
        payment_status: "refunded",
      });
      // TODO: Créer une transaction de remboursement
    }

    return { success: true };
  },
});

/**
 * Incrémenter les stats (impression ou clic)
 */
export const trackInteraction = mutation({
  args: {
    booking_id: v.id("ad_bookings"),
    type: v.union(v.literal("impression"), v.literal("click")),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.booking_id);
    if (!booking) return;

    if (args.type === "impression") {
      await ctx.db.patch(args.booking_id, {
        impressions: booking.impressions + 1,
      });
    } else {
      await ctx.db.patch(args.booking_id, {
        clicks: booking.clicks + 1,
      });
    }
  },
});

/**
 * Admin met à jour le demand_multiplier d'un espace
 */
export const updateDemandMultiplier = mutation({
  args: {
    ad_space_id: v.id("ad_spaces"),
    demand_multiplier: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.demand_multiplier < 0.5 || args.demand_multiplier > 5.0) {
      throw new ConvexError("Le multiplicateur doit être entre 0.5 et 5.0");
    }

    await ctx.db.patch(args.ad_space_id, {
      demand_multiplier: args.demand_multiplier,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Admin ajoute une période de pointe
 */
export const addPeakPeriod = mutation({
  args: {
    ad_space_id: v.id("ad_spaces"),
    name: v.string(),
    starts_at: v.number(),
    ends_at: v.number(),
    multiplier: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const adSpace = await ctx.db.get(args.ad_space_id);
    if (!adSpace) throw new ConvexError("Espace introuvable");

    const currentPeaks = adSpace.peak_periods ?? [];
    currentPeaks.push({
      name: args.name,
      starts_at: args.starts_at,
      ends_at: args.ends_at,
      multiplier: args.multiplier,
    });

    await ctx.db.patch(args.ad_space_id, {
      peak_periods: currentPeaks,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});
