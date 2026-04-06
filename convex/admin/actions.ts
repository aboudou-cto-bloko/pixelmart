// filepath: convex/admin/actions.ts
"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { ADMIN_ROLES } from "../users/helpers";
import type { Id } from "../_generated/dataModel";

/**
 * Envoie une notification push + in-app à une cible donnée.
 * target:
 *   "vendors"   — tous les vendeurs actifs
 *   "customers" — tous les clients avec un compte réel (non provisoire)
 *   "both"      — vendeurs + clients
 * Réservé aux administrateurs.
 */
export const broadcastPush = action({
  args: {
    target: v.union(
      v.literal("vendors"),
      v.literal("customers"),
      v.literal("both"),
    ),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.runQuery(internal.admin.queries.getAdminUser);
    if (!admin || !(ADMIN_ROLES as readonly string[]).includes(admin.role)) {
      throw new Error("Accès réservé aux administrateurs");
    }

    const userIds: Id<"users">[] = [];

    if (args.target === "vendors" || args.target === "both") {
      const vendors = await ctx.runQuery(
        internal.admin.queries.listVendorUserIds,
      );
      vendors.forEach((v) => userIds.push(v._id as Id<"users">));
    }

    if (args.target === "customers" || args.target === "both") {
      const customers = await ctx.runQuery(
        internal.admin.queries.listCustomerUserIds,
      );
      customers.forEach((c) => userIds.push(c._id as Id<"users">));
    }

    let sent = 0;
    for (const userId of userIds) {
      await ctx.runMutation(internal.notifications.mutations.create, {
        userId,
        type: "promo",
        title: args.title,
        body: args.body,
        link: args.url,
        channels: ["in_app"],
        sentVia: ["in_app"],
        metadata: undefined,
      });

      await ctx.runAction(internal.push.actions.sendToUser, {
        userId,
        title: args.title,
        body: args.body,
        url: args.url,
      });

      sent++;
    }

    return { sent };
  },
});
