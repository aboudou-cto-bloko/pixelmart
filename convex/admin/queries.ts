// filepath: convex/admin/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
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

// ─── getAnalytics ─────────────────────────────────────────────
// Analytics plateforme avec comparaison de période

export const getAnalytics = query({
  args: {
    period: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const periodMs = args.period === "7d" ? 7 * 86400000 : args.period === "30d" ? 30 * 86400000 : 90 * 86400000;
    const periodStart = now - periodMs;
    const prevPeriodStart = periodStart - periodMs;

    const allOrders = await ctx.db.query("orders").collect();
    const paidOrders = allOrders.filter((o) => o.payment_status === "paid");

    // Période courante
    const curOrders = paidOrders.filter((o) => o._creationTime >= periodStart);
    const prevOrders = paidOrders.filter((o) => o._creationTime >= prevPeriodStart && o._creationTime < periodStart);

    const gmv = curOrders.reduce((s, o) => s + o.total_amount, 0);
    const prevGmv = prevOrders.reduce((s, o) => s + o.total_amount, 0);
    const commissions = curOrders.reduce((s, o) => s + (o.commission_amount ?? 0), 0);
    const prevCommissions = prevOrders.reduce((s, o) => s + (o.commission_amount ?? 0), 0);
    const deliveryFees = curOrders.reduce((s, o) => s + (o.delivery_fee ?? 0), 0);
    const prevDeliveryFees = prevOrders.reduce((s, o) => s + (o.delivery_fee ?? 0), 0);

    // Utilisateurs
    const allUsers = await ctx.db.query("users").collect();
    const newUsers = allUsers.filter((u) => u._creationTime >= periodStart).length;
    const prevNewUsers = allUsers.filter((u) => u._creationTime >= prevPeriodStart && u._creationTime < periodStart).length;

    // Boutiques
    const allStores = await ctx.db.query("stores").collect();
    const newStores = allStores.filter((s) => s._creationTime >= periodStart).length;
    const prevNewStores = allStores.filter((s) => s._creationTime >= prevPeriodStart && s._creationTime < periodStart).length;

    // Revenus publicitaires
    const allBookings = await ctx.db.query("ad_bookings").collect();
    const paidBookings = allBookings.filter(
      (b) =>
        b.payment_status === "paid" &&
        (b.status === "active" || b.status === "completed") &&
        b._creationTime >= periodStart,
    );
    const adRevenue = paidBookings.reduce((s, b) => s + b.total_price, 0);

    // Revenus stockage
    const storageInvoices = await ctx.db.query("storage_invoices").collect();
    const paidStorageInvoices = storageInvoices.filter((i) => i.status === "paid" && i._creationTime >= periodStart);
    const storageRevenue = paidStorageInvoices.reduce((s, i) => s + i.amount, 0);

    // Série temporelle journalière
    const bucketMs = args.period === "7d" ? 86400000 : args.period === "30d" ? 86400000 : 7 * 86400000; // daily ou weekly pour 90d
    const seriesMap: Record<string, { gmv: number; commissions: number; orders: number }> = {};

    for (const o of curOrders) {
      const bucket = Math.floor((o._creationTime - periodStart) / bucketMs);
      const label = new Date(periodStart + bucket * bucketMs).toISOString().slice(0, 10);
      if (!seriesMap[label]) seriesMap[label] = { gmv: 0, commissions: 0, orders: 0 };
      seriesMap[label].gmv += o.total_amount;
      seriesMap[label].commissions += o.commission_amount ?? 0;
      seriesMap[label].orders += 1;
    }

    const series = Object.entries(seriesMap)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top 10 boutiques par GMV (période courante)
    const storeGmv: Record<string, number> = {};
    const storeOrders: Record<string, number> = {};
    for (const o of curOrders) {
      const sid = o.store_id as string;
      storeGmv[sid] = (storeGmv[sid] ?? 0) + o.total_amount;
      storeOrders[sid] = (storeOrders[sid] ?? 0) + 1;
    }
    const topStoreIds = Object.entries(storeGmv).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);
    const topStores = topStoreIds.map((sid) => {
      const store = allStores.find((s) => (s._id as string) === sid);
      return {
        storeId: sid,
        name: store?.name ?? "Inconnu",
        tier: store?.subscription_tier ?? "free",
        gmv: storeGmv[sid] ?? 0,
        orders: storeOrders[sid] ?? 0,
      };
    });

    // Répartition statuts commandes (période)
    const statusDist: Record<string, number> = {};
    for (const o of allOrders.filter((o) => o._creationTime >= periodStart)) {
      statusDist[o.status] = (statusDist[o.status] ?? 0) + 1;
    }
    const ordersByStatus = Object.entries(statusDist).map(([status, count]) => ({ status, count }));

    // Répartition abonnements boutiques
    const tierDist: Record<string, number> = {};
    for (const s of allStores) {
      const t = s.subscription_tier ?? "free";
      tierDist[t] = (tierDist[t] ?? 0) + 1;
    }
    const storesByTier = Object.entries(tierDist).map(([tier, count]) => ({ tier, count }));

    // Taux de conversion (orders paid / orders total in period)
    const ordersInPeriod = allOrders.filter((o) => o._creationTime >= periodStart);
    const conversionRate = ordersInPeriod.length > 0
      ? Math.round((curOrders.length / ordersInPeriod.length) * 100)
      : 0;

    // Panier moyen
    const aov = curOrders.length > 0 ? Math.round(gmv / curOrders.length) : 0;
    const prevAov = prevOrders.length > 0 ? Math.round(prevGmv / prevOrders.length) : 0;

    return {
      kpis: {
        gmv, prevGmv,
        commissions, prevCommissions,
        orders: curOrders.length, prevOrders: prevOrders.length,
        newUsers, prevNewUsers,
        newStores, prevNewStores,
        adRevenue,
        storageRevenue,
        deliveryFees, prevDeliveryFees,
        netRevenue: commissions + adRevenue + storageRevenue + deliveryFees,
        aov, prevAov,
        conversionRate,
      },
      series,
      topStores,
      ordersByStatus,
      storesByTier,
      totals: {
        users: allUsers.length,
        stores: allStores.length,
        orders: allOrders.length,
      },
    };
  },
});

// ─── getPlatformHealth ────────────────────────────────────────
// Indicateurs de santé pour le monitoring temps réel

export const getPlatformHealth = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 86400000;
    const twoDaysAgo = now - 2 * 86400000;

    // Retraits en attente
    const pendingPayouts = await ctx.db
      .query("payouts")
      .withIndex("by_status_only", (q) => q.eq("status", "pending"))
      .collect();
    const oldestPayout = pendingPayouts.reduce((min, p) => Math.min(min, p.requested_at), Infinity);
    const oldestPayoutAgeMs = pendingPayouts.length > 0 ? now - oldestPayout : 0;

    // Boutiques non vérifiées
    const unverifiedStores = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("is_verified"), false))
      .collect();

    // Factures stockage impayées
    const unpaidInvoices = await ctx.db
      .query("storage_invoices")
      .filter((q) => q.eq(q.field("status"), "unpaid"))
      .collect();
    const unpaidInvoicesTotal = unpaidInvoices.reduce((s, i) => s + i.amount, 0);

    // Factures impayées depuis > 30 jours (blocage F-06)
    const thirtyDaysAgo = now - 30 * 86400000;
    const overdueInvoices = unpaidInvoices.filter((i) => i._creationTime < thirtyDaysAgo);

    // Boutiques bloquées (dette > 30j)
    const blockedStoreIds = new Set(overdueInvoices.map((i) => i.store_id as string));

    // Demandes stockage en attente de validation
    const receivedStorage = await ctx.db
      .query("storage_requests")
      .withIndex("by_status", (q) => q.eq("status", "received"))
      .collect();
    const pendingDrop = await ctx.db
      .query("storage_requests")
      .withIndex("by_status", (q) => q.eq("status", "pending_drop_off"))
      .collect();

    // Commandes bloquées en "paid" depuis > 48h (vendor non-réactif)
    const allPaidOrders = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("status"), "paid"))
      .collect();
    const staleOrders = allPaidOrders.filter((o) => o._creationTime < twoDaysAgo);

    // Bookings pub actifs / total
    const activeBookings = await ctx.db
      .query("ad_bookings")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    const queuedBookings = await ctx.db
      .query("ad_bookings")
      .filter((q) => q.eq(q.field("status"), "queued"))
      .collect();
    const pendingPaymentBookings = await ctx.db
      .query("ad_bookings")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Erreurs paiement récentes (7j) — commandes restées "pending" > 24h
    const oneDayAgo = now - 86400000;
    const stalePendingOrders = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    const paymentFailures = stalePendingOrders.filter((o) => o._creationTime < oneDayAgo && o._creationTime >= sevenDaysAgo);

    return {
      payouts: {
        pending: pendingPayouts.length,
        totalAmount: pendingPayouts.reduce((s, p) => s + p.amount, 0),
        oldestAgeMs: oldestPayoutAgeMs,
      },
      stores: {
        unverified: unverifiedStores.length,
        blocked: blockedStoreIds.size,
      },
      storage: {
        receivedPendingValidation: receivedStorage.length,
        pendingDropOff: pendingDrop.length,
        unpaidInvoices: unpaidInvoices.length,
        unpaidInvoicesTotal,
        overdueInvoices: overdueInvoices.length,
      },
      orders: {
        staleInPaid: staleOrders.length,
        paymentFailures: paymentFailures.length,
      },
      ads: {
        active: activeBookings.length,
        queued: queuedBookings.length,
        pendingPayment: pendingPaymentBookings.length,
      },
    };
  },
});

// ─── listAuditLog ─────────────────────────────────────────────

// ─── listOrders ──────────────────────────────────────────────

export const listOrders = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const orders = args.status
      ? await ctx.db
          .query("orders")
          .filter((q) => q.eq(q.field("status"), args.status))
          .order("desc")
          .collect()
      : await ctx.db.query("orders").order("desc").collect();

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const store = await ctx.db.get(order.store_id);
        const customer = await ctx.db.get(order.customer_id);
        return {
          _id: order._id,
          order_number: order.order_number,
          store_name: store?.name ?? "Boutique inconnue",
          customer_id: order.customer_id,
          customer_name: customer?.name ?? "Client inconnu",
          customer_email: customer?.email ?? "—",
          customer_phone: customer?.phone ?? undefined,
          total_amount: order.total_amount,
          commission_amount: order.commission_amount ?? 0,
          currency: order.currency,
          status: order.status,
          payment_status: order.payment_status,
          items_count: order.items.length,
          _creationTime: order._creationTime,
        };
      }),
    );

    return enriched;
  },
});

// ─── getAdminOrderDetail ─────────────────────────────────────

export const getAdminOrderDetail = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    const store = await ctx.db.get(order.store_id);
    const customer = await ctx.db.get(order.customer_id);

    // Resolve item images
    const itemsWithImages = await Promise.all(
      order.items.map(async (item) => {
        let resolvedUrl: string | null = null;
        if (item.image_url) {
          try {
            resolvedUrl = await ctx.storage.getUrl(item.image_url as string);
          } catch {
            resolvedUrl = null;
          }
        }
        return { ...item, resolved_image_url: resolvedUrl };
      }),
    );

    return {
      ...order,
      items: itemsWithImages,
      store_name: store?.name ?? "Boutique inconnue",
      store_slug: store?.slug ?? null,
      customer: customer
        ? {
            _id: customer._id,
            name: customer.name ?? "—",
            email: customer.email,
            phone: customer.phone ?? null,
            avatar_url: customer.avatar_url ?? null,
            role: customer.role,
            is_banned: customer.is_banned ?? false,
            _creationTime: customer._creationTime,
          }
        : null,
    };
  },
});

// ─── getAdminUserDetail ──────────────────────────────────────

export const getAdminUserDetail = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Their orders (as customer)
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_customer", (q) => q.eq("customer_id", args.userId))
      .order("desc")
      .take(50);

    const ordersEnriched = await Promise.all(
      orders.map(async (order) => {
        const store = await ctx.db.get(order.store_id);
        return {
          _id: order._id,
          order_number: order.order_number,
          store_name: store?.name ?? "—",
          total_amount: order.total_amount,
          currency: order.currency,
          status: order.status,
          payment_status: order.payment_status,
          _creationTime: order._creationTime,
        };
      }),
    );

    // Their store (if vendor)
    const store = user.active_store_id
      ? await ctx.db.get(user.active_store_id)
      : null;

    return {
      _id: user._id,
      name: user.name ?? "—",
      email: user.email,
      phone: user.phone ?? null,
      role: user.role,
      is_banned: user.is_banned ?? false,
      is_verified: user.is_verified ?? false,
      avatar_url: user.avatar_url ?? null,
      _creationTime: user._creationTime,
      last_login_at: user.last_login_at ?? null,
      orders: ordersEnriched,
      store: store
        ? {
            _id: store._id,
            name: store.name,
            slug: store.slug,
            status: store.status,
            subscription_tier: store.subscription_tier,
          }
        : null,
    };
  },
});

// ─── listBatchesAdmin ─────────────────────────────────────────

export const listBatchesAdmin = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("transmitted"),
        v.literal("assigned"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(args.limit ?? 100, 200);

    const batches = args.status
      ? await ctx.db
          .query("delivery_batches")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("delivery_batches")
          .order("desc")
          .take(limit);

    return Promise.all(
      batches.map(async (batch) => {
        const store = await ctx.db.get(batch.store_id);
        const vendor = batch.created_by ? await ctx.db.get(batch.created_by) : null;

        let zone_name: string | undefined;
        if (batch.order_ids.length > 0) {
          const firstOrder = await ctx.db.get(batch.order_ids[0]);
          zone_name = firstOrder?.shipping_address?.city;
        }

        const orders = await Promise.all(batch.order_ids.map((id) => ctx.db.get(id)));
        const total_to_collect = orders
          .filter((o) => o?.payment_mode === "cod")
          .reduce((sum, o) => sum + (o?.total_amount ?? 0), 0);

        return {
          ...batch,
          store_name: store?.name ?? "Boutique supprimée",
          vendor_name: vendor?.name ?? "—",
          zone_name,
          total_to_collect,
        };
      }),
    );
  },
});

// ─── getDeliveryAdminStats ─────────────────────────────────────

export const getDeliveryAdminStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const allBatches = await ctx.db.query("delivery_batches").collect();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTs = startOfToday.getTime();

    return {
      transmitted: allBatches.filter((b) => b.status === "transmitted").length,
      assigned: allBatches.filter((b) => b.status === "assigned").length,
      in_progress: allBatches.filter((b) => b.status === "in_progress").length,
      completed_today: allBatches.filter(
        (b) => b.status === "completed" && (b.completed_at ?? 0) >= todayTs,
      ).length,
      total_fees_all: allBatches
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + b.total_delivery_fee, 0),
    };
  },
});

// ─── listAuditLog ─────────────────────────────────────────────

export const listAuditLog = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const n = Math.min(args.limit ?? 100, 200);

    let events;
    if (args.type) {
      events = await ctx.db
        .query("platform_events")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("desc")
        .take(n);
    } else {
      events = await ctx.db
        .query("platform_events")
        .withIndex("by_created_at")
        .order("desc")
        .take(n);
    }

    return events.map((e) => ({
      _id: e._id,
      type: e.type,
      actor_id: e.actor_id,
      actor_name: e.actor_name ?? "Admin",
      target_type: e.target_type,
      target_id: e.target_id,
      target_label: e.target_label,
      metadata: e.metadata ? JSON.parse(e.metadata) as Record<string, unknown> : undefined,
      created_at: e.created_at,
    }));
  },
});


// ─── listStorageInvoices ──────────────────────────────────────

/**
 * Liste toutes les factures de stockage pour le dashboard admin.
 * Enrichies avec le nom du store et les infos du produit depuis storage_requests.
 */
export const listStorageInvoices = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const invoices = await ctx.db
      .query("storage_invoices")
      .order("desc")
      .take(500);

    const enriched = await Promise.all(
      invoices.map(async (inv) => {
        const store = await ctx.db.get(inv.store_id);
        const request = await ctx.db.get(inv.request_id);

        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const isOverdue =
          inv.status === "unpaid" && inv.created_at < thirtyDaysAgo;

        return {
          _id: inv._id,
          amount: inv.amount,
          currency: inv.currency,
          status: inv.status,
          payment_method: inv.payment_method,
          paid_at: inv.paid_at,
          created_at: inv.created_at,
          isOverdue,
          storeName: store?.name ?? "Boutique inconnue",
          storeId: inv.store_id,
          productName: request?.product_name ?? "Produit inconnu",
          storageCode: request?.storage_code ?? "",
          actualQty: request?.actual_qty,
          actualWeightKg: request?.actual_weight_kg,
          measurementType: request?.measurement_type,
        };
      }),
    );

    const totalRevenue = enriched
      .filter((i) => i.status !== "unpaid")
      .reduce((s, i) => s + i.amount, 0);
    const totalUnpaid = enriched
      .filter((i) => i.status === "unpaid")
      .reduce((s, i) => s + i.amount, 0);
    const overdueCount = enriched.filter((i) => i.isOverdue).length;

    return { invoices: enriched, totalRevenue, totalUnpaid, overdueCount };
  },
});

// ─── getBatchDetailAdmin ───────────────────────────────────────

/**
 * Détail complet d'un lot pour le dashboard admin.
 * Inclut toutes les commandes avec infos client (nom, téléphone, adresse, articles).
 */
export const getBatchDetailAdmin = query({
  args: { batchId: v.id("delivery_batches") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const batch = await ctx.db.get(args.batchId);
    if (!batch) return null;

    const store = await ctx.db.get(batch.store_id);

    const orders = await Promise.all(
      batch.order_ids.map(async (orderId) => {
        const order = await ctx.db.get(orderId);
        if (!order) return null;

        const customer = await ctx.db.get(order.customer_id);

        return {
          _id: order._id,
          order_number: order.order_number,
          status: order.status,
          payment_mode: order.payment_mode ?? "online",
          payment_status: order.payment_status,
          total_amount: order.total_amount,
          delivery_fee: order.delivery_fee ?? 0,
          currency: order.currency,
          notes: order.notes,
          items: order.items,
          shipping_address: order.shipping_address,
          customer_name: customer?.name ?? order.shipping_address.full_name,
          customer_phone:
            customer?.phone ??
            order.shipping_address.phone ??
            undefined,
          delivery_lat: order.delivery_lat,
          delivery_lon: order.delivery_lon,
          delivery_distance_km: order.delivery_distance_km,
        };
      }),
    );

    const validOrders = orders.filter(
      (o): o is NonNullable<typeof o> => o !== null,
    );

    const total_to_collect = validOrders
      .filter((o) => o.payment_mode === "cod")
      .reduce((sum, o) => sum + o.total_amount, 0);

    const zone_name = validOrders[0]?.shipping_address.city;

    return {
      ...batch,
      store_name: store?.name ?? "Boutique inconnue",
      store_phone: store?.contact_phone,
      zone_name,
      orders: validOrders,
      total_to_collect,
    };
  },
});
