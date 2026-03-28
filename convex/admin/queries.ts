// filepath: convex/admin/queries.ts

import { query } from "../_generated/server";
import { requireAdmin } from "../users/helpers";

// ─── getPlatformStats ────────────────────────────────────────

export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTs = startOfToday.getTime();

    // All paid orders today
    const allOrders = await ctx.db.query("orders").collect();
    const paidOrders = allOrders.filter((o) => o.payment_status === "paid");
    const todayOrders = paidOrders.filter((o) => o._creationTime >= todayTs);

    const revenueToday = todayOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const ordersToday = todayOrders.length;

    // New users today
    const allUsers = await ctx.db.query("users").collect();
    const newUsersToday = allUsers.filter((u) => u._creationTime >= todayTs).length;

    // New stores today
    const allStores = await ctx.db.query("stores").collect();
    const newStoresToday = allStores.filter((s) => s._creationTime >= todayTs).length;

    // Alerts
    const pendingPayouts = await ctx.db
      .query("payouts")
      .withIndex("by_status_only", (q) => q.eq("status", "pending"))
      .collect();

    const unverifiedStores = allStores.filter((s) => !s.is_verified).length;

    const storageRequests = await ctx.db
      .query("storage_requests")
      .filter((q) => q.eq(q.field("status"), "received"))
      .collect();
    const storageReceivedCount = storageRequests.length;

    // Revenue by day (30 last days)
    const thirtyDaysAgo = now - 30 * 86400000;
    const recentPaidOrders = paidOrders.filter((o) => o._creationTime >= thirtyDaysAgo);

    const revenueByDay: Record<string, number> = {};
    for (const order of recentPaidOrders) {
      const d = new Date(order._creationTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      revenueByDay[key] = (revenueByDay[key] ?? 0) + order.total_amount;
    }

    const revenuePerDay = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top 5 stores by revenue
    const storeRevenue: Record<string, number> = {};
    for (const order of paidOrders) {
      const sid = order.store_id;
      storeRevenue[sid] = (storeRevenue[sid] ?? 0) + order.total_amount;
    }

    const topStoreIds = Object.entries(storeRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const topStores = await Promise.all(
      topStoreIds.map(async (sid) => {
        const store = allStores.find((s) => s._id === sid);
        return {
          storeId: sid,
          storeName: store?.name ?? "Inconnu",
          revenue: storeRevenue[sid] ?? 0,
        };
      }),
    );

    // Last 10 paid orders
    const lastOrders = paidOrders
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 10)
      .map((o) => ({
        _id: o._id,
        order_number: o.order_number,
        total_amount: o.total_amount,
        currency: o.currency,
        status: o.status,
        _creationTime: o._creationTime,
        store_id: o.store_id,
      }));

    // Orders by status
    const statusCounts: Record<string, number> = {};
    for (const order of allOrders) {
      statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1;
    }
    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // Global totals
    const totalUsers = allUsers.length;
    const totalStores = allStores.length;
    const totalOrders = allOrders.length;

    return {
      today: {
        revenue: revenueToday,
        orders: ordersToday,
        newUsers: newUsersToday,
        newStores: newStoresToday,
      },
      alerts: {
        pendingPayoutsCount: pendingPayouts.length,
        unverifiedStoresCount: unverifiedStores,
        storageReceivedCount,
      },
      revenuePerDay,
      topStores,
      lastOrders,
      ordersByStatus,
      totals: {
        users: totalUsers,
        stores: totalStores,
        orders: totalOrders,
      },
    };
  },
});

// ─── listStores ──────────────────────────────────────────────

export const listStores = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const stores = await ctx.db.query("stores").collect();

    const result = await Promise.all(
      stores.map(async (store) => {
        const owner = await ctx.db.get(store.owner_id);
        const orders = await ctx.db
          .query("orders")
          .withIndex("by_store", (q) => q.eq("store_id", store._id))
          .collect();

        return {
          _id: store._id,
          name: store.name,
          slug: store.slug,
          is_verified: store.is_verified,
          status: store.status,
          subscription_tier: store.subscription_tier,
          balance: store.balance,
          currency: store.currency,
          _creationTime: store._creationTime,
          ownerName: owner?.name ?? "Inconnu",
          ownerEmail: owner?.email ?? "—",
          orderCount: orders.length,
        };
      }),
    );

    return result.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// ─── listPendingPayouts ──────────────────────────────────────

export const listPendingPayouts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_status_only", (q) => q.eq("status", "pending"))
      .collect();

    const result = await Promise.all(
      payouts.map(async (payout) => {
        const store = await ctx.db.get(payout.store_id);
        return {
          _id: payout._id,
          storeId: payout.store_id,
          storeName: store?.name ?? "Inconnu",
          amount: payout.amount,
          fee: payout.fee,
          currency: payout.currency,
          payout_method: payout.payout_method,
          payout_details: payout.payout_details,
          requested_at: payout.requested_at,
        };
      }),
    );

    // FIFO — oldest first
    return result.sort((a, b) => a.requested_at - b.requested_at);
  },
});

// ─── listAllPayouts ──────────────────────────────────────────

export const listAllPayouts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const payouts = await ctx.db.query("payouts").order("desc").take(100);

    const result = await Promise.all(
      payouts.map(async (payout) => {
        const store = await ctx.db.get(payout.store_id);
        return {
          _id: payout._id,
          storeId: payout.store_id,
          storeName: store?.name ?? "Inconnu",
          amount: payout.amount,
          fee: payout.fee,
          currency: payout.currency,
          payout_method: payout.payout_method,
          payout_details: payout.payout_details,
          status: payout.status,
          requested_at: payout.requested_at,
          processed_at: payout.processed_at,
          notes: payout.notes,
        };
      }),
    );

    return result;
  },
});

// ─── listUsers ───────────────────────────────────────────────

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").order("desc").take(500);

    return users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      is_banned: u.is_banned,
      is_verified: u.is_verified,
      _creationTime: u._creationTime,
      last_login_at: u.last_login_at,
    }));
  },
});

// ─── listCountryConfig ───────────────────────────────────────

export const listCountryConfig = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("country_config").collect();
    // Returns a map country_code → is_active (rows only for overrides)
    return Object.fromEntries(rows.map((r) => [r.country_code, r.is_active]));
  },
});

// ─── listDeliveryRates ───────────────────────────────────────

export const listDeliveryRates = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rates = await ctx.db.query("delivery_rates").collect();
    return rates.sort((a, b) => {
      if (a.delivery_type !== b.delivery_type)
        return a.delivery_type.localeCompare(b.delivery_type);
      if (a.is_night_rate !== b.is_night_rate)
        return a.is_night_rate ? 1 : -1;
      return a.distance_min_km - b.distance_min_km;
    });
  },
});

// ─── listAdSpaces ────────────────────────────────────────────

export const listAdSpaces = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const spaces = await ctx.db.query("ad_spaces").withIndex("by_active").collect();
    const now = Date.now();

    return await Promise.all(
      spaces
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(async (space) => {
          const activeCount = (
            await ctx.db
              .query("ad_bookings")
              .withIndex("by_active_slot", (q) =>
                q.eq("slot_id", space.slot_id).eq("status", "active"),
              )
              .filter((q) =>
                q.and(
                  q.lte(q.field("starts_at"), now),
                  q.gte(q.field("ends_at"), now),
                ),
              )
              .collect()
          ).length;

          const queuedCount = (
            await ctx.db
              .query("ad_bookings")
              .withIndex("by_slot", (q) =>
                q.eq("slot_id", space.slot_id).eq("status", "queued"),
              )
              .collect()
          ).length;

          return {
            _id: space._id,
            slot_id: space.slot_id,
            name: space.name,
            format: space.format,
            width: space.width,
            height: space.height,
            max_slots: space.max_slots,
            base_price_daily: space.base_price_daily,
            demand_multiplier: space.demand_multiplier,
            is_active: space.is_active,
            sort_order: space.sort_order,
            active_count: activeCount,
            queued_count: queuedCount,
          };
        }),
    );
  },
});

// ─── getPlatformConfig ───────────────────────────────────────

export const getPlatformConfig = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const rows = await ctx.db.query("platform_config").collect();
    // Return as key → { value, label, updated_at } map for easy lookup
    return Object.fromEntries(
      rows.map((r) => [
        r.key,
        { value: r.value, label: r.label, updated_at: r.updated_at },
      ]),
    );
  },
});

// ─── listStorageRequests ─────────────────────────────────────

export const listStorageRequests = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const received = await ctx.db
      .query("storage_requests")
      .withIndex("by_status", (q) => q.eq("status", "received"))
      .order("asc")
      .collect();

    return await Promise.all(
      received.map(async (req) => {
        const store = await ctx.db.get(req.store_id);
        const product = req.product_id ? await ctx.db.get(req.product_id) : null;
        return {
          _id: req._id,
          storage_code: req.storage_code,
          status: req.status,
          storeName: store?.name ?? "Boutique inconnue",
          storeId: req.store_id,
          productTitle: product?.title ?? req.product_name,
          estimated_qty: req.estimated_qty,
          actual_qty: req.actual_qty,
          actual_weight_kg: req.actual_weight_kg,
          measurement_type: req.measurement_type,
          agent_notes: req.agent_notes,
          created_at: req._creationTime,
        };
      }),
    );
  },
});
