// filepath: convex/admin/commissions.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

type CommissionStats = {
  totalCommissions: number;
  totalOrders: number;
  breakdown: {
    online: { total: number; orders: number; percentage: number };
    cod: { total: number; orders: number; percentage: number };
  };
};

type CommissionItem = {
  _id: string;
  order_id: string;
  store_id: string;
  commission_amount: number;
  commission_rate: number;
  order_total: number;
  payment_mode: "online" | "cod";
  currency: string;
  collected_at: number;
  collection_trigger: string;
  description: string;
  processed_by?: string;
  order_number?: string;
  store_name?: string;
};

export const getCommissionStats = query({
  args: {
    period: v.optional(
      v.union(v.literal("7d"), v.literal("30d"), v.literal("90d")),
    ),
    paymentMode: v.optional(v.union(v.literal("online"), v.literal("cod"))),
  },
  handler: async (ctx, args): Promise<CommissionStats> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Access denied - admin only");
    }

    const now = Date.now();
    let startDate: number | undefined;

    switch (args.period) {
      case "7d":
        startDate = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "30d":
        startDate = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case "90d":
        startDate = now - 90 * 24 * 60 * 60 * 1000;
        break;
    }

    return ctx.runQuery(internal.platform.commissions.getCommissionStats, {
      startDate,
      endDate: now,
      paymentMode: args.paymentMode,
    }) as Promise<CommissionStats>;
  },
});

export const listCommissions = query({
  args: {
    limit: v.optional(v.number()),
    paymentMode: v.optional(v.union(v.literal("online"), v.literal("cod"))),
    storeId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args): Promise<CommissionItem[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Access denied - admin only");
    }

    return ctx.runQuery(internal.platform.commissions.listCommissions, {
      limit: args.limit ?? 50,
      paymentMode: args.paymentMode,
      storeId: args.storeId,
    }) as Promise<CommissionItem[]>;
  },
});

export const getCommissionDetail = query({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Access denied - admin only");
    }

    const commission = await ctx.db
      .query("platform_commissions")
      .withIndex("by_order", (q) => q.eq("order_id", args.orderId))
      .first();

    if (!commission) return null;

    const order = await ctx.db.get(commission.order_id);
    const store = await ctx.db.get(commission.store_id);

    return {
      ...commission,
      order: order
        ? {
            order_number: order.order_number,
            status: order.status,
            payment_status: order.payment_status,
            created_at: order._creationTime,
            customer_id: order.customer_id,
          }
        : null,
      store: store
        ? {
            name: store.name,
            slug: store.slug,
            subscription_tier: store.subscription_tier,
          }
        : null,
    };
  },
});
