// filepath: src/app/(vendor)/vendor/analytics/page.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AnalyticsTemplate } from "@/components/analytics/templates/AnalyticsTemplate";

type Period = "7d" | "30d" | "90d" | "12m";
type Source = "all" | "marketplace" | "vendor_shop";

export default function VendorAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [source, setSource] = useState<Source>("all");

  const sourceArg =
    source === "all" ? undefined : (source as "marketplace" | "vendor_shop");

  const salesOverview = useQuery(api.analytics.queries.getSalesOverview, {
    period,
    source: sourceArg,
  });
  const salesChart = useQuery(api.analytics.queries.getSalesChart, {
    period,
    source: sourceArg,
  });
  const topProducts = useQuery(api.analytics.queries.getTopProducts, {
    period,
    limit: 10,
    source: sourceArg,
  });
  const revenueByCategory = useQuery(
    api.analytics.queries.getRevenueByCategory,
    { period, source: sourceArg },
  );
  const customerInsights = useQuery(api.analytics.queries.getCustomerInsights, {
    period,
    source: sourceArg,
  });

  const isLoading =
    salesOverview === undefined ||
    salesChart === undefined ||
    topProducts === undefined ||
    revenueByCategory === undefined ||
    customerInsights === undefined;

  const currency = "XOF";

  return (
    <AnalyticsTemplate
      period={period}
      onPeriodChange={setPeriod}
      source={source}
      onSourceChange={setSource}
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
