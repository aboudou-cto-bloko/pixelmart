// filepath: convex/demo/mutations.ts

import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { generateDemoToken } from "./helpers";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Admin — creates a demo invite and sends the email. */
export const createInvite = mutation({
  args: {
    email: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { email, note }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_better_auth_id", (q) =>
        q.eq("better_auth_user_id", identity.subject),
      )
      .first();
    if (!admin || admin.role !== "admin") throw new Error("Accès refusé");

    // Expire any existing pending invite for this email
    const existing = await ctx.db
      .query("demo_invites")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    for (const inv of existing) {
      if (inv.email === email) {
        await ctx.db.patch(inv._id, { status: "expired" });
      }
    }

    const token = generateDemoToken();
    const inviteId = await ctx.db.insert("demo_invites", {
      email,
      token,
      status: "pending",
      invited_by: admin._id,
      invited_by_name: admin.name,
      expires_at: Date.now() + INVITE_TTL_MS,
      note,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.notifications.send.notifyDemoInvite,
      { email, token, inviterName: admin.name, note },
    );

    return inviteId;
  },
});

/** Public — activates a demo account after Better Auth sign-up. */
export const activateDemoAccount = mutation({
  args: {
    token: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { token, email }) => {
    const invite = await ctx.db
      .query("demo_invites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!invite) throw new Error("Invitation invalide");
    if (invite.email !== email) throw new Error("Email non autorisé");
    if (invite.status !== "pending")
      throw new Error("Invitation déjà utilisée ou expirée");
    if (invite.expires_at < Date.now()) {
      await ctx.db.patch(invite._id, { status: "expired" });
      throw new Error("Invitation expirée");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!user)
      throw new Error("Compte introuvable — réessayez dans quelques secondes");

    // Promote to vendor + mark as demo
    await ctx.db.patch(user._id, {
      role: "vendor",
      is_demo: true,
      is_verified: true,
      updated_at: Date.now(),
    });

    // Create the demo store
    const slug = `demo-${token.slice(0, 10).toLowerCase()}`;
    const storeId = await ctx.db.insert("stores", {
      owner_id: user._id,
      name: `Boutique Démo`,
      slug,
      status: "active",
      subscription_tier: "pro",
      commission_rate: 300,
      balance: 0,
      pending_balance: 0,
      currency: "XOF",
      level: "bronze",
      total_orders: 0,
      avg_rating: 0,
      is_verified: true,
      country: "BJ",
      theme_id: "default",
      vendor_shop_enabled: true,
      is_demo: true,
      updated_at: Date.now(),
    });

    await ctx.db.patch(user._id, { active_store_id: storeId });

    await ctx.db.patch(invite._id, {
      status: "used",
      used_at: Date.now(),
      used_by: user._id,
    });

    return { storeId };
  },
});

/**
 * Admin — revokes a pending invite.
 */
export const revokeInvite = mutation({
  args: { inviteId: v.id("demo_invites") },
  handler: async (ctx, { inviteId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non authentifié");
    const admin = await ctx.db
      .query("users")
      .withIndex("by_better_auth_id", (q) =>
        q.eq("better_auth_user_id", identity.subject),
      )
      .first();
    if (!admin || admin.role !== "admin") throw new Error("Accès refusé");

    const invite = await ctx.db.get(inviteId);
    if (!invite || invite.status !== "pending")
      throw new Error("Invitation non révocable");
    await ctx.db.patch(inviteId, { status: "expired" });
  },
});

/**
 * Internal — deletes all demo data for a store.
 * Called by the resetDemoData action.
 */
export const deleteStoreDemoData = internalMutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, { storeId }) => {
    const store = await ctx.db.get(storeId);
    if (!store?.is_demo) throw new Error("Boutique non démo");

    // Helper: delete all docs from a collection
    async function deleteAll(items: { _id: string }[]) {
      for (const item of items) {
        await ctx.db.delete(item._id as Parameters<typeof ctx.db.delete>[0]);
      }
    }

    // Orders
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", storeId))
      .collect();
    await deleteAll(orders);

    // Transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_store", (q) => q.eq("store_id", storeId))
      .collect();
    await deleteAll(transactions);

    // Products
    const products = await ctx.db
      .query("products")
      .withIndex("by_store", (q) => q.eq("store_id", storeId))
      .collect();
    for (const product of products) {
      const variants = await ctx.db
        .query("product_variants")
        .withIndex("by_product", (q) => q.eq("product_id", product._id))
        .collect();
      await deleteAll(variants);
      const specs = await ctx.db
        .query("product_specs")
        .withIndex("by_product", (q) => q.eq("product_id", product._id))
        .collect();
      await deleteAll(specs);
    }
    await deleteAll(products);

    // Reviews for this store
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_store", (q) => q.eq("store_id", storeId))
      .collect();
    await deleteAll(reviews);

    // Coupons
    const coupons = await ctx.db
      .query("coupons")
      .withIndex("by_store", (q) => q.eq("store_id", storeId))
      .collect();
    await deleteAll(coupons);

    // Affiliate commissions
    const commissions = await ctx.db
      .query("affiliate_commissions")
      .withIndex("by_referlee_store", (q) => q.eq("referlee_store_id", storeId))
      .collect();
    await deleteAll(commissions);

    // Notifications for store owner
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("user_id", store.owner_id))
      .collect();
    await deleteAll(notifications);

    // Reset store financials
    await ctx.db.patch(storeId, {
      balance: 0,
      pending_balance: 0,
      total_orders: 0,
      avg_rating: 0,
      updated_at: Date.now(),
    });
  },
});
