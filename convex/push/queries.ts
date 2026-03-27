// filepath: convex/push/queries.ts

import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser } from "../users/helpers";

/**
 * Retourne les subscriptions push de l'utilisateur courant.
 * Utilisé pour afficher les appareils enregistrés.
 */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);

    const subs = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    return subs.map((s) => ({
      _id: s._id,
      user_agent: s.user_agent ?? null,
      created_at: s.created_at,
      // Never expose endpoint/keys to the client
    }));
  },
});

/**
 * Retourne le statut push de l'utilisateur (activé/désactivé + nb d'appareils).
 */
export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);

    const count = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    return {
      enabled: user.push_notifications_enabled !== false, // default true
      deviceCount: count.length,
    };
  },
});

// ─── Internal queries (used by push/actions.ts) ───────────────

export const getSubsForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("push_subscriptions")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .collect();
  },
});

export const isPushEnabled = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.push_notifications_enabled !== false; // default true
  },
});
