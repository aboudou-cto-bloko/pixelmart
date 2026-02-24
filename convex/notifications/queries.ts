// filepath: convex/notifications/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAppUser, requireAppUser } from "../users/helpers";

/**
 * Nombre de notifications non lues pour le badge.
 */
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAppUser(ctx);
    if (!user) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("user_id", user._id).eq("is_read", false),
      )
      .collect();

    return unread.length;
  },
});

/**
 * Liste des notifications de l'utilisateur courant.
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    onlyUnread: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const limit = args.limit ?? 50;

    let notifications;

    if (args.onlyUnread) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_unread", (q) =>
          q.eq("user_id", user._id).eq("is_read", false),
        )
        .order("desc")
        .take(limit);
    } else {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("user_id", user._id))
        .order("desc")
        .take(limit);
    }

    return notifications;
  },
});

/**
 * Détail d'une notification.
 */
export const getById = query({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const notification = await ctx.db.get(args.notificationId);

    if (!notification || notification.user_id !== user._id) return null;
    return notification;
  },
});
