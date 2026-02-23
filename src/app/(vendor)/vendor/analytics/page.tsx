// filepath: src/app/(vendor)/vendor/analytics/page.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AnalyticsTemplate } from "@/components/analytics/templates/AnalyticsTemplate";

type Period = "7d" | "30d" | "90d" | "12m";

export default function VendorAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");

  const salesOverview = useQuery(api.analytics.queries.getSalesOverview, {
    period,
  });
  const salesChart = useQuery(api.analytics.queries.getSalesChart, {
    period,
  });
  const topProducts = useQuery(api.analytics.queries.getTopProducts, {
    period,
    limit: 10,
  });
  const revenueByCategory = useQuery(
    api.analytics.queries.getRevenueByCategory,
    { period },
  );
  const customerInsights = useQuery(api.analytics.queries.getCustomerInsights, {
    period,
  });

  // All queries return undefined while loading
  const isLoading =
    salesOverview === undefined ||
    salesChart === undefined ||
    topProducts === undefined ||
    revenueByCategory === undefined ||
    customerInsights === undefined;

  // Get currency from store (via salesOverview context) — default XOF
  const currency = "XOF";

  return (
    <AnalyticsTemplate
      period={period}
      onPeriodChange={setPeriod}
      currency={currency}
      salesOverview={salesOverview}
      salesChart={salesChart}
      topProducts={topProducts}
      revenueByCategory={revenueByCategory}
      customerInsights={customerInsights}
      isLoading={isLoading}
    />
  );
}
