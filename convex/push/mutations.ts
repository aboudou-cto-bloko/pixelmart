// filepath: convex/push/mutations.ts

import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser } from "../users/helpers";

/**
 * Enregistre une subscription Web Push pour l'utilisateur courant.
 * Appelé côté client après `PushManager.subscribe()`.
 */
export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    user_agent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    // Vérifier si la subscription existe déjà (même endpoint)
    const existing = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      // Mettre à jour les clés si elles ont changé
      if (existing.p256dh !== args.p256dh || existing.auth !== args.auth) {
        await ctx.db.patch(existing._id, {
          p256dh: args.p256dh,
          auth: args.auth,
          user_agent: args.user_agent,
        });
      }
      return existing._id;
    }

    const id = await ctx.db.insert("push_subscriptions", {
      user_id: user._id,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      user_agent: args.user_agent,
      created_at: Date.now(),
    });

    return id;
  },
});

/**
 * Supprime la subscription du navigateur courant (désabonnement ou permission révoquée).
 */
export const unsubscribe = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const sub = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (sub && sub.user_id === user._id) {
      await ctx.db.delete(sub._id);
    }
  },
});

/**
 * Active ou désactive les notifications push pour l'utilisateur courant.
 */
export const setEnabled = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    await ctx.db.patch(user._id, { push_notifications_enabled: args.enabled });
  },
});

/**
 * Supprime une subscription invalide (endpoint 410 Gone).
 * Appelé par le backend après un envoi échoué.
 */
export const removeStale = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
    if (sub) await ctx.db.delete(sub._id);
  },
});
