// filepath: convex/analytics/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
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
    const store = await getVendorStore(ctx);
    if (!store) return null;

    const { current, previous } = getDateRanges(period as AnalyticsPeriod);

    // Fetch all paid/delivered/processing/shipped orders for current & previous period
    const allOrders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const paidStatuses = new Set([
      "paid",
      "processing",
      "shipped",
      "delivered",
    ]);

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

    // Current period metrics
    const currentRevenue = currentOrders.reduce(
      (sum, o) => sum + o.total_amount,
      0,
    );
    const currentCount = currentOrders.length;
    const currentAov =
      currentCount > 0 ? Math.round(currentRevenue / currentCount) : 0;

    // Previous period metrics
    const previousRevenue = previousOrders.reduce(
      (sum, o) => sum + o.total_amount,
      0,
    );
    const previousCount = previousOrders.length;
    const previousAov =
      previousCount > 0 ? Math.round(previousRevenue / previousCount) : 0;

    // Refunds (current period)
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

    // Cancelled (current period)
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
      conversionNote: "Taux de conversion disponible avec PostHog (Phase 2)",
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
    const store = await getVendorStore(ctx);
    if (!store) return null;

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

    // Aggregate by date bucket
    type BucketData = { revenue: number; orders: number };
    const bucketMap = new Map<string, BucketData>();

    for (const order of filteredOrders) {
      const key = groupByDate(order._creationTime, granularity);
      const existing = bucketMap.get(key) ?? { revenue: 0, orders: 0 };
      existing.revenue += order.total_amount;
      existing.orders += 1;
      bucketMap.set(key, existing);
    }

    // Generate all buckets (fill gaps with zeros)
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
    const store = await getVendorStore(ctx);
    if (!store) return null;

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

    // Aggregate by product
    type ProductStat = { revenue: number; quantity: number; orders: number };
    const productMap = new Map<string, ProductStat>();

    for (const order of filteredOrders) {
      for (const item of order.items) {
        const productId = item.product_id as string;
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

    // Sort by revenue descending, take top N
    const sorted = Array.from(productMap.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, limit);

    // Hydrate product info
    const results = await Promise.all(
      sorted.map(async ([productId, stats]) => {
        const product = await ctx.db.get(productId as any);
        return {
          productId,
          title: product?.title ?? "Produit supprimé",
          image: product?.images?.[0] ?? null,
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
    const store = await getVendorStore(ctx);
    if (!store) return null;

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

    // We need product → category mapping
    // Collect all unique product IDs from order items
    const productIds = new Set<string>();
    for (const order of filteredOrders) {
      for (const item of order.items) {
        productIds.add(item.product_id as string);
      }
    }

    // Batch fetch products to get category_id
    type ProductCategoryMap = Map<string, string>; // productId → categoryId
    const productCategoryMap: ProductCategoryMap = new Map();
    for (const productId of productIds) {
      const product = await ctx.db.get(productId as any);
      if (product?.category_id) {
        productCategoryMap.set(productId, product.category_id as string);
      }
    }

    // Aggregate revenue by category
    const categoryRevenueMap = new Map<string, number>();
    let totalRevenue = 0;

    for (const order of filteredOrders) {
      for (const item of order.items) {
        const categoryId =
          productCategoryMap.get(item.product_id as string) ?? "uncategorized";
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
          const category = await ctx.db.get(categoryId as any);
          return {
            category: category?.name ?? "Catégorie supprimée",
            revenue,
            percentage: 0,
          };
        },
      ),
    );

    // Calculate percentages
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
    const store = await getVendorStore(ctx);
    if (!store) return null;

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

    // Determine new vs returning customers in current period
    // A "new" customer had no orders before the current period start
    const customerFirstOrder = new Map<string, number>(); // customerId → earliest order timestamp
    for (const order of paidOrders) {
      const customerId = order.customer_id as string;
      const existing = customerFirstOrder.get(customerId);
      if (!existing || order._creationTime < existing) {
        customerFirstOrder.set(customerId, order._creationTime);
      }
    }

    // Unique customers in current period
    const currentCustomerIds = new Set(
      currentOrders.map((o) => o.customer_id as string),
    );
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

    // Top customers by spend in current period
    type CustomerSpend = {
      customerId: string;
      totalSpent: number;
      orderCount: number;
    };
    const customerSpendMap = new Map<string, CustomerSpend>();

    for (const order of currentOrders) {
      const customerId = order.customer_id as string;
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

    // Hydrate customer names
    const hydratedTopCustomers = await Promise.all(
      topCustomers.map(async (c) => {
        const user = await ctx.db.get(c.customerId as any);
        return {
          name: user?.name ?? "Client inconnu",
          email: user?.email ?? "",
          totalSpent: c.totalSpent,
          orderCount: c.orderCount,
        };
      }),
    );

    // Average order value
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
