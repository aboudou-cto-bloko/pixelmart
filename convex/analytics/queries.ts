// filepath: convex/analytics/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { getVendorStore } from "../users/helpers";
import {
  type AnalyticsPeriod,
  type Granularity,
  getDateRanges,
  percentChange,
  groupByDate,
  generateDateBuckets,
  inferGranularity,
  formatBucketLabel,
} from "./helpers";

// ──────────────────────────────────────────────
// 1. SALES OVERVIEW — KPIs with period comparison
// ──────────────────────────────────────────────

export const getSalesOverview = query({
  args: {
    period: v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("12m"),
    ),
  },
  handler: async (ctx, { period }) => {
    const result = await getVendorStore(ctx);
    if (!result) return null;
    const { store } = result;

    const { current, previous } = getDateRanges(period as AnalyticsPeriod);

    const paidStatuses = new Set([
      "paid",
      "processing",
      "shipped",
      "delivered",
    ]);

    const allOrders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const currentOrders = allOrders.filter(
      (o) =>
        o._creationTime >= current.start &&
        o._creationTime <= current.end &&
        paidStatuses.has(o.status),
    );
    const previousOrders = allOrders.filter(
      (o) =>
        o._creationTime >= previous.start &&
        o._creationTime <= previous.end &&
        paidStatuses.has(o.status),
    );

    const currentRevenue = currentOrders.reduce(
      (sum, o) => sum + o.total_amount,
      0,
    );
    const currentCount = currentOrders.length;
    const currentAov =
      currentCount > 0 ? Math.round(currentRevenue / currentCount) : 0;

    const previousRevenue = previousOrders.reduce(
      (sum, o) => sum + o.total_amount,
      0,
    );
    const previousCount = previousOrders.length;
    const previousAov =
      previousCount > 0 ? Math.round(previousRevenue / previousCount) : 0;

    const refundedOrders = allOrders.filter(
      (o) =>
        o._creationTime >= current.start &&
        o._creationTime <= current.end &&
        o.status === "refunded",
    );
    const refundAmount = refundedOrders.reduce(
      (sum, o) => sum + o.total_amount,
      0,
    );

    const cancelledCount = allOrders.filter(
      (o) =>
        o._creationTime >= current.start &&
        o._creationTime <= current.end &&
        o.status === "cancelled",
    ).length;

    return {
      revenue: {
        value: currentRevenue,
        previous: previousRevenue,
        change: percentChange(currentRevenue, previousRevenue),
      },
      orders: {
        value: currentCount,
        previous: previousCount,
        change: percentChange(currentCount, previousCount),
      },
      averageOrderValue: {
        value: currentAov,
        previous: previousAov,
        change: percentChange(currentAov, previousAov),
      },
      refunds: {
        count: refundedOrders.length,
        amount: refundAmount,
      },
      cancellations: cancelledCount,
    };
  },
});

// ──────────────────────────────────────────────
// 2. SALES CHART — Time-series for line/bar chart
// ──────────────────────────────────────────────

export const getSalesChart = query({
  args: {
    period: v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("12m"),
    ),
    granularity: v.optional(
      v.union(v.literal("day"), v.literal("week"), v.literal("month")),
    ),
  },
  handler: async (ctx, { period, granularity: granularityArg }) => {
    const result = await getVendorStore(ctx);
    if (!result) return null;
    const { store } = result;

    const typedPeriod = period as AnalyticsPeriod;
    const granularity: Granularity =
      (granularityArg as Granularity | undefined) ??
      inferGranularity(typedPeriod);
    const { current } = getDateRanges(typedPeriod);

    const paidStatuses = new Set([
      "paid",
      "processing",
      "shipped",
      "delivered",
    ]);

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const filteredOrders = orders.filter(
      (o) =>
        o._creationTime >= current.start &&
        o._creationTime <= current.end &&
        paidStatuses.has(o.status),
    );

    type BucketData = { revenue: number; orders: number };
    const bucketMap = new Map<string, BucketData>();

    for (const order of filteredOrders) {
      const key = groupByDate(order._creationTime, granularity);
      const existing = bucketMap.get(key) ?? { revenue: 0, orders: 0 };
      existing.revenue += order.total_amount;
      existing.orders += 1;
      bucketMap.set(key, existing);
    }

    const allBuckets = generateDateBuckets(
      current.start,
      current.end,
      granularity,
    );

    return allBuckets.map((bucket) => {
      const data = bucketMap.get(bucket) ?? { revenue: 0, orders: 0 };
      return {
        date: bucket,
        label: formatBucketLabel(bucket, granularity),
        revenue: data.revenue,
        orders: data.orders,
      };
    });
  },
});

// ──────────────────────────────────────────────
// 3. TOP PRODUCTS — Best sellers by revenue
// ──────────────────────────────────────────────

export const getTopProducts = query({
  args: {
    period: v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("12m"),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { period, limit = 10 }) => {
    const result = await getVendorStore(ctx);
    if (!result) return null;
    const { store } = result;

    const { current } = getDateRanges(period as AnalyticsPeriod);
    const paidStatuses = new Set([
      "paid",
      "processing",
      "shipped",
      "delivered",
    ]);

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const filteredOrders = orders.filter(
      (o) =>
        o._creationTime >= current.start &&
        o._creationTime <= current.end &&
        paidStatuses.has(o.status),
    );

    type ProductStat = { revenue: number; quantity: number; orders: number };
    const productMap = new Map<string, ProductStat>();

    for (const order of filteredOrders) {
      for (const item of order.items) {
        const productId = item.product_id;
        const existing = productMap.get(productId) ?? {
          revenue: 0,
          quantity: 0,
          orders: 0,
        };
        existing.revenue += item.total_price;
        existing.quantity += item.quantity;
        existing.orders += 1;
        productMap.set(productId, existing);
      }
    }

    const sorted = Array.from(productMap.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, limit);

    const results = await Promise.all(
      sorted.map(async ([productId, stats]) => {
        const product = await ctx.db.get(productId as Id<"products">);
        return {
          productId,
          title: product?.title ?? "Produit supprimé",
          image: product?.images[0] ?? null,
          slug: product?.slug ?? null,
          revenue: stats.revenue,
          quantity: stats.quantity,
          orders: stats.orders,
        };
      }),
    );

    return results;
  },
});

// ──────────────────────────────────────────────
// 4. REVENUE BY CATEGORY — Pie/donut chart data
// ──────────────────────────────────────────────

export const getRevenueByCategory = query({
  args: {
    period: v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("12m"),
    ),
  },
  handler: async (ctx, { period }) => {
    const result = await getVendorStore(ctx);
    if (!result) return null;
    const { store } = result;

    const { current } = getDateRanges(period as AnalyticsPeriod);
    const paidStatuses = new Set([
      "paid",
      "processing",
      "shipped",
      "delivered",
    ]);

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const filteredOrders = orders.filter(
      (o) =>
        o._creationTime >= current.start &&
        o._creationTime <= current.end &&
        paidStatuses.has(o.status),
    );

    // Collect unique product IDs
    const productIds = new Set<Id<"products">>();
    for (const order of filteredOrders) {
      for (const item of order.items) {
        productIds.add(item.product_id);
      }
    }

    // Build product → category mapping
    const productCategoryMap = new Map<string, Id<"categories">>();
    for (const productId of productIds) {
      const product = await ctx.db.get(productId);
      if (product) {
        productCategoryMap.set(productId, product.category_id);
      }
    }

    // Aggregate revenue by category
    const categoryRevenueMap = new Map<string, number>();
    let totalRevenue = 0;

    for (const order of filteredOrders) {
      for (const item of order.items) {
        const categoryId =
          productCategoryMap.get(item.product_id) ?? "uncategorized";
        const existing = categoryRevenueMap.get(categoryId) ?? 0;
        categoryRevenueMap.set(categoryId, existing + item.total_price);
        totalRevenue += item.total_price;
      }
    }

    // Hydrate category names
    const results = await Promise.all(
      Array.from(categoryRevenueMap.entries()).map(
        async ([categoryId, revenue]) => {
          if (categoryId === "uncategorized") {
            return { category: "Non catégorisé", revenue, percentage: 0 };
          }
          const category = await ctx.db.get(categoryId as Id<"categories">);
          return {
            category: category?.name ?? "Catégorie supprimée",
            revenue,
            percentage: 0,
          };
        },
      ),
    );

    for (const item of results) {
      item.percentage =
        totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;
    }

    return results.sort((a, b) => b.revenue - a.revenue);
  },
});

// ──────────────────────────────────────────────
// 5. CUSTOMER INSIGHTS — New vs returning, top buyers
// ──────────────────────────────────────────────

export const getCustomerInsights = query({
  args: {
    period: v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("12m"),
    ),
  },
  handler: async (ctx, { period }) => {
    const result = await getVendorStore(ctx);
    if (!result) return null;
    const { store } = result;

    const { current } = getDateRanges(period as AnalyticsPeriod);
    const paidStatuses = new Set([
      "paid",
      "processing",
      "shipped",
      "delivered",
    ]);

    const allOrders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const paidOrders = allOrders.filter((o) => paidStatuses.has(o.status));

    const currentOrders = paidOrders.filter(
      (o) => o._creationTime >= current.start && o._creationTime <= current.end,
    );

    // Determine first order per customer (across all time)
    const customerFirstOrder = new Map<string, number>();
    for (const order of paidOrders) {
      const customerId = order.customer_id;
      const existing = customerFirstOrder.get(customerId);
      if (!existing || order._creationTime < existing) {
        customerFirstOrder.set(customerId, order._creationTime);
      }
    }

    // Unique customers in current period
    const currentCustomerIds = new Set(currentOrders.map((o) => o.customer_id));
    let newCustomers = 0;
    let returningCustomers = 0;

    for (const customerId of currentCustomerIds) {
      const firstOrder = customerFirstOrder.get(customerId);
      if (firstOrder && firstOrder >= current.start) {
        newCustomers++;
      } else {
        returningCustomers++;
      }
    }

    // Top customers by spend
    type CustomerSpend = {
      customerId: Id<"users">;
      totalSpent: number;
      orderCount: number;
    };
    const customerSpendMap = new Map<string, CustomerSpend>();

    for (const order of currentOrders) {
      const customerId = order.customer_id;
      const existing = customerSpendMap.get(customerId) ?? {
        customerId,
        totalSpent: 0,
        orderCount: 0,
      };
      existing.totalSpent += order.total_amount;
      existing.orderCount += 1;
      customerSpendMap.set(customerId, existing);
    }

    const topCustomers = Array.from(customerSpendMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    const hydratedTopCustomers = await Promise.all(
      topCustomers.map(async (c) => {
        const user = await ctx.db.get(c.customerId);
        return {
          name: user?.name ?? "Client inconnu",
          email: user?.email ?? "",
          totalSpent: c.totalSpent,
          orderCount: c.orderCount,
        };
      }),
    );

    const totalRevenue = currentOrders.reduce(
      (sum, o) => sum + o.total_amount,
      0,
    );
    const avgOrderValue =
      currentOrders.length > 0
        ? Math.round(totalRevenue / currentOrders.length)
        : 0;

    return {
      totalCustomers: currentCustomerIds.size,
      newCustomers,
      returningCustomers,
      repeatRate:
        currentCustomerIds.size > 0
          ? Math.round((returningCustomers / currentCustomerIds.size) * 100)
          : 0,
      averageOrderValue: avgOrderValue,
      topCustomers: hydratedTopCustomers,
    };
  },
});
