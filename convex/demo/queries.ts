// filepath: convex/demo/queries.ts

import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/** Admin — list all demo invites (most recent first). */
export const listInvites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_better_auth_id", (q) =>
        q.eq("better_auth_user_id", identity.subject),
      )
      .first();
    if (!admin || admin.role !== "admin") throw new Error("Accès refusé");

    const invites = await ctx.db.query("demo_invites").collect();
    invites.sort((a, b) => b._creationTime - a._creationTime);

    // Enrich with used_by name + demo storeId
    const enriched = await Promise.all(
      invites.map(async (inv) => {
        let usedByName: string | undefined;
        let demoStoreId: string | undefined;
        if (inv.used_by) {
          const user = await ctx.db.get(inv.used_by);
          usedByName = user?.name;
          if (user?.active_store_id) {
            const store = await ctx.db.get(user.active_store_id);
            if (store?.is_demo) demoStoreId = store._id;
          }
        }
        return { ...inv, usedByName, demoStoreId };
      }),
    );
    return enriched;
  },
});

/**
 * Public — validates a demo invite token.
 * Returns the invite data (without sensitive info) or null if invalid.
 */
export const validateToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!token) return null;
    const invite = await ctx.db
      .query("demo_invites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!invite) return null;
    if (invite.status === "used")
      return { status: "used" as const, email: invite.email };
    if (invite.status === "expired" || invite.expires_at < Date.now())
      return { status: "expired" as const, email: invite.email };
    return {
      status: "pending" as const,
      email: invite.email,
      note: invite.note,
    };
  },
});

/** Public — returns true if the current user is a demo account. */
export const isCurrentUserDemo = query({
  args: {},
  handler: async (ctx) => {
    let identity;
    try {
      identity = await ctx.auth.getUserIdentity();
    } catch {
      return false;
    }
    if (!identity) return false;
    const user = await ctx.db
      .query("users")
      .withIndex("by_better_auth_id", (q) =>
        q.eq("better_auth_user_id", identity.subject),
      )
      .first();
    return user?.is_demo === true;
  },
});

/** Internal — used by simulatePayment action. */
export const getOrderWithStore = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    if (!order) return null;
    const store = await ctx.db.get(order.store_id);
    return { order, store };
  },
});
