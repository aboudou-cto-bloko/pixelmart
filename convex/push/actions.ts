// filepath: convex/push/actions.ts
"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import webpush from "web-push";

/**
 * Envoie une notification push à un utilisateur sur tous ses appareils.
 * Appelé via ctx.scheduler.runAfter depuis les dispatchers de notifications.
 */
export const sendToUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:noreply@pixel-mart-bj.com";

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn("[push] VAPID keys not configured — skipping push notification");
      return;
    }

    // Récupérer les subscriptions de l'utilisateur
    const subs: Array<{
      _id: Id<"push_subscriptions">;
      endpoint: string;
      p256dh: string;
      auth: string;
    }> = await ctx.runQuery(internal.push.queries.getSubsForUser, {
      userId: args.userId,
    });

    if (subs.length === 0) return;

    // Check if user has push notifications enabled
    const pushEnabled: boolean = await ctx.runQuery(
      internal.push.queries.isPushEnabled,
      { userId: args.userId },
    );
    if (!pushEnabled) return;

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.url ?? "/",
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
        } catch (err: unknown) {
          // 410 Gone = subscription expired, remove it
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 410 || status === 404) {
            await ctx.runMutation(internal.push.mutations.removeStale, {
              endpoint: sub.endpoint,
            });
          } else {
            console.error("[push] Failed to send notification:", err);
          }
        }
      }),
    );
  },
});
