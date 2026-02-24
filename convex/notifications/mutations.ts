// filepath: convex/notifications/mutations.ts

import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser } from "../users/helpers";

/**
 * Marquer une notification comme lue.
 */
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.user_id !== user._id) {
      throw new Error("Notification introuvable");
    }

    if (notification.is_read) return { success: true };

    await ctx.db.patch(args.notificationId, { is_read: true });
    return { success: true };
  },
});

/**
 * Marquer toutes les notifications comme lues.
 */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("user_id", user._id).eq("is_read", false),
      )
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { is_read: true });
    }

    return { count: unread.length };
  },
});

/**
 * Créer une notification in-app (appelé par le dispatch action).
 * Internal — ne doit pas être appelé directement par le client.
 */
export const create = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    link: v.optional(v.string()),
    channels: v.array(v.string()),
    sentVia: v.array(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      user_id: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      link: args.link,
      is_read: false,
      channels: args.channels,
      sent_via: args.sentVia,
      metadata: args.metadata,
    });

    return notificationId;
  },
});
