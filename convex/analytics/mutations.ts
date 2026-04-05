// filepath: convex/analytics/mutations.ts

import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";

const EVENT_NAME_ARG = v.union(
  v.literal("PageView"),
  v.literal("ViewContent"),
  v.literal("AddToCart"),
  v.literal("InitiateCheckout"),
  v.literal("Purchase"),
);

/**
 * Enregistre une visite unique de boutique sur la marketplace.
 * Déduplication : une session ne compte qu'une fois par jour par boutique.
 * Public — ne stocke aucune PII (sessionId = UUID aléatoire côté navigateur).
 */
export const recordStoreView = mutation({
  args: {
    storeId: v.id("stores"),
    sessionId: v.string(),
  },
  handler: async (ctx, { storeId, sessionId }) => {
    // UUID v4 strict — rejette tout ce qui n'est pas un UUID valide
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        sessionId,
      )
    ) {
      return;
    }

    const store = await ctx.db.get(storeId);
    if (!store || store.status !== "active") return;

    const now = Date.now();
    const dayBucket = new Date(now).toISOString().slice(0, 10);

    const existing = await ctx.db
      .query("store_views")
      .withIndex("by_session_store_day", (q) =>
        q
          .eq("session_id", sessionId)
          .eq("store_id", storeId)
          .eq("day_bucket", dayBucket),
      )
      .first();

    if (existing) return;

    await ctx.db.insert("store_views", {
      store_id: storeId,
      session_id: sessionId,
      viewed_at: now,
      day_bucket: dayBucket,
    });
  },
});

/**
 * Journalise un événement Meta Pixel émis depuis le navigateur (fbq).
 * Appelé depuis MetaPixelProvider (PageView, ViewContent, InitiateCheckout, Purchase).
 */
export const logBrowserPixelEvent = mutation({
  args: {
    storeId: v.id("stores"),
    eventName: EVENT_NAME_ARG,
    eventId: v.optional(v.string()),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Ne journalise que si le store a un Pixel configuré
    const store = await ctx.db.get(args.storeId);
    if (!store?.meta_pixel_id) return;

    const now = Date.now();
    await ctx.db.insert("meta_pixel_events", {
      store_id: args.storeId,
      pixel_id: store.meta_pixel_id, // scopage : données liées au pixel actif
      event_name: args.eventName,
      event_id: args.eventId,
      value: args.value,
      currency: args.currency,
      occurred_at: now,
      day_bucket: new Date(now).toISOString().slice(0, 10),
      source: "browser",
    });
  },
});

/**
 * Journalise un événement Meta Pixel envoyé via CAPI côté serveur.
 * Internal — appelé uniquement depuis trackPurchase.
 */
export const logServerPixelEvent = internalMutation({
  args: {
    storeId: v.id("stores"),
    pixelId: v.string(),
    eventName: EVENT_NAME_ARG,
    eventId: v.optional(v.string()),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("meta_pixel_events", {
      store_id: args.storeId,
      pixel_id: args.pixelId,
      event_name: args.eventName,
      event_id: args.eventId,
      value: args.value,
      currency: args.currency,
      occurred_at: now,
      day_bucket: new Date(now).toISOString().slice(0, 10),
      source: "server",
    });
  },
});
