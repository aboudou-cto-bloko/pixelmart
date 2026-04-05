// filepath: convex/meta/mutations.ts

import {
  mutation,
  internalMutation,
  internalAction,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getVendorStore } from "../users/helpers";
import { formatUserData, formatCustomData, generateEventId } from "./helpers";

const META_GRAPH_URL = "https://graph.facebook.com/v18.0";

// ─── Vendor: update Meta config ──────────────────────────────

/**
 * Met à jour la configuration Meta Pixel du store connecté.
 */
export const updateMetaConfig = mutation({
  args: {
    pixelId: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    testEventCode: v.optional(v.string()),
    vendorShopEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    if (args.pixelId && !/^\d{15,16}$/.test(args.pixelId)) {
      throw new Error("Le Pixel ID doit contenir 15 ou 16 chiffres");
    }

    await ctx.db.patch(store._id, {
      meta_pixel_id: args.pixelId ?? undefined,
      meta_access_token: args.accessToken ?? undefined,
      meta_test_event_code: args.testEventCode ?? undefined,
      vendor_shop_enabled: args.vendorShopEnabled,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

// ─── Internal: track Purchase via CAPI ───────────────────────

/**
 * Déclenche un événement Purchase Meta CAPI pour une commande vendor_shop.
 * Appelé depuis le webhook de paiement (internalMutation).
 */
export const trackPurchase = internalMutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return;

    // Seulement pour les commandes provenant d'une boutique vendeur
    if (order.source !== "vendor_shop") return;

    // Récupérer le store pour la config Meta
    const store = await ctx.db.get(order.store_id);
    if (!store?.meta_pixel_id || !store?.meta_access_token) {
      return;
    }

    const customer = await ctx.db.get(order.customer_id);

    const eventId = generateEventId();
    const eventTime = Math.floor(Date.now() / 1000);

    const nameParts = order.shipping_address.full_name.split(" ");
    const userData = await formatUserData({
      email: customer?.email,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(" ") || undefined,
      city: order.shipping_address.city,
      country: order.shipping_address.country,
      phone: order.shipping_address.phone,
    });

    const contentIds = order.items.map((item) => item.product_id as string);
    const customData = formatCustomData({
      contentIds,
      contentType: "product",
      value: order.total_amount, // centimes → converti dans formatCustomData
      currency: store.currency ?? "XOF",
      numItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
      orderId: order.order_number,
    });

    const appUrl = process.env.SITE_URL ?? "https://www.pixel-mart-bj.com";

    await ctx.scheduler.runAfter(0, internal.meta.mutations.sendPurchaseEvent, {
      pixelId: store.meta_pixel_id,
      accessToken: store.meta_access_token,
      testEventCode: store.meta_test_event_code,
      eventId,
      eventTime,
      eventSourceUrl: `${appUrl}/shop/${store.slug}/checkout/confirmation`,
      userData,
      customData,
    });

    // Journalise l'événement Purchase côté serveur pour les analytics vendeur
    const now = Date.now();
    await ctx.db.insert("meta_pixel_events", {
      store_id: store._id as Id<"stores">,
      pixel_id: store.meta_pixel_id, // scopage : données liées au pixel actif
      event_name: "Purchase",
      event_id: eventId,
      value: order.total_amount,
      currency: store.currency ?? "XOF",
      occurred_at: now,
      day_bucket: new Date(now).toISOString().slice(0, 10),
      source: "server",
    });
  },
});

/**
 * Envoi effectif de l'événement Purchase à Meta CAPI (internalAction).
 * Appelé via scheduler depuis trackPurchase.
 */
export const sendPurchaseEvent = internalAction({
  args: {
    pixelId: v.string(),
    accessToken: v.string(),
    testEventCode: v.optional(v.string()),
    eventId: v.string(),
    eventTime: v.number(),
    eventSourceUrl: v.string(),
    userData: v.any(),
    customData: v.any(),
  },
  handler: async (_ctx, args) => {
    const url = `${META_GRAPH_URL}/${args.pixelId}/events`;

    const payload = {
      data: [
        {
          event_name: "Purchase",
          event_time: args.eventTime,
          event_id: args.eventId,
          event_source_url: args.eventSourceUrl,
          action_source: "website",
          user_data: args.userData,
          custom_data: args.customData,
        },
      ],
      ...(args.testEventCode ? { test_event_code: args.testEventCode } : {}),
    };

    const response = await fetch(`${url}?access_token=${args.accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return;
    }
  },
});
