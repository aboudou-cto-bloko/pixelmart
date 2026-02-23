// filepath: convex/dashboard/queries.ts

import { query } from "../_generated/server";
import { getVendorStore } from "../users/helpers";

/**
 * Stats globales du dashboard vendor.
 * Agrège commandes, revenus, produits en une seule query.
 */
export const getVendorDashboard = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);
    const now = Date.now();

    // ── Commandes ──
    const allOrders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const countByStatus = (status: string) =>
      allOrders.filter((o) => o.status === status).length;

    // ── Revenus par période ──
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const paidOrders = allOrders.filter((o) => o.payment_status === "paid");

    const revenueToday = paidOrders
      .filter((o) => o._creationTime >= startOfToday.getTime())
      .reduce((sum, o) => sum + o.total_amount, 0);

    const revenueWeek = paidOrders
      .filter((o) => o._creationTime >= startOfWeek.getTime())
      .reduce((sum, o) => sum + o.total_amount, 0);

    const revenueMonth = paidOrders
      .filter((o) => o._creationTime >= startOfMonth.getTime())
      .reduce((sum, o) => sum + o.total_amount, 0);

    const revenueTotal = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);

    // Commission totale
    const totalCommission = paidOrders.reduce(
      (sum, o) => sum + (o.commission_amount ?? 0),
      0,
    );

    // ── Revenus par jour (7 derniers jours) ──
    const revenueByDay: { date: string; revenue: number; orders: number }[] =
      [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayOrders = paidOrders.filter(
        (o) =>
          o._creationTime >= day.getTime() &&
          o._creationTime < nextDay.getTime(),
      );

      revenueByDay.push({
        date: new Intl.DateTimeFormat("fr-FR", {
          weekday: "short",
          day: "numeric",
        }).format(day),
        revenue: dayOrders.reduce((sum, o) => sum + o.total_amount, 0),
        orders: dayOrders.length,
      });
    }

    // ── Commandes récentes (5 dernières) ──
    const recentOrders = allOrders
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5)
      .map((o) => ({
        _id: o._id,
        order_number: o.order_number,
        status: o.status,
        payment_status: o.payment_status,
        total_amount: o.total_amount,
        currency: o.currency,
        created_at: o._creationTime,
        item_count: o.items.reduce((s, i) => s + i.quantity, 0),
      }));

    // ── Produits ──
    const allProducts = await ctx.db
      .query("products")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const activeProducts = allProducts.filter((p) => p.status === "active");
    const outOfStock = allProducts.filter((p) => p.status === "out_of_stock");

    // Stock faible : produits qui track l'inventaire avec quantité <= 5
    const lowStock = allProducts
      .filter(
        (p) =>
          p.track_inventory &&
          p.status === "active" &&
          p.quantity <= 5 &&
          p.quantity > 0,
      )
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10)
      .map((p) => ({
        _id: p._id,
        title: p.title,
        slug: p.slug,
        quantity: p.quantity,
        image: p.images[0] ?? null,
      }));

    type ProductSales = {
      title: string;
      image: string | null;
      totalSold: number;
      revenue: number;
    };

    const productSalesMap = new Map<string, ProductSales>();

    for (const order of paidOrders) {
      for (const item of order.items) {
        const key = item.product_id;
        const existing = productSalesMap.get(key);
        if (existing) {
          existing.totalSold += item.quantity;
          existing.revenue += item.total_price;
        } else {
          productSalesMap.set(key, {
            title: item.title,
            image: item.image_url || null,
            totalSold: item.quantity,
            revenue: item.total_price,
          });
        }
      }
    }

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      store: {
        name: store.name,
        balance: store.balance,
        pending_balance: store.pending_balance,
        subscription_tier: store.subscription_tier,
      },
      orders: {
        total: allOrders.length,
        pending: countByStatus("pending"),
        paid: countByStatus("paid"),
        processing: countByStatus("processing"),
        shipped: countByStatus("shipped"),
        delivered: countByStatus("delivered"),
        cancelled: countByStatus("cancelled"),
      },
      revenue: {
        today: revenueToday,
        week: revenueWeek,
        month: revenueMonth,
        total: revenueTotal,
        totalCommission,
        netTotal: revenueTotal - totalCommission,
        byDay: revenueByDay,
      },
      products: {
        total: allProducts.length,
        active: activeProducts.length,
        outOfStock: outOfStock.length,
        lowStock,
      },
      recentOrders,
      topProducts,
    };
  },
});
