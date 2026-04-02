// filepath: convex/admin/actions.ts
"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { ADMIN_ROLES } from "../users/helpers";
import type { Id } from "../_generated/dataModel";

/**
 * Envoie une notification push + in-app à tous les vendeurs actifs.
 * Réservé aux administrateurs.
 */
export const broadcastPushToVendors = action({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Auth check via internal query (actions have no ctx.db)
    const admin = await ctx.runQuery(internal.admin.queries.getAdminUser);
    if (!admin || !(ADMIN_ROLES as readonly string[]).includes(admin.role)) {
      throw new Error("Accès réservé aux administrateurs");
    }

    const vendors = await ctx.runQuery(
      internal.admin.queries.listVendorUserIds,
    );

    let sent = 0;
    for (const vendor of vendors) {
      const userId = vendor._id as Id<"users">;

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
