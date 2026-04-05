// filepath: src/components/analytics/templates/AnalyticsTemplate.tsx

"use client";

import dynamic from "next/dynamic";
import { SalesOverviewCards } from "../organisms/SalesOverviewCards";
import { TopProductsTable } from "../organisms/TopProductsTable";
import { CustomerInsightsPanel } from "../organisms/CustomerInsightsPanel";
import { ViewsChart } from "../organisms/ViewsChart";
import { MetaFunnelChart } from "../organisms/MetaFunnelChart";
import { PeriodSelector } from "../molecules/PeriodSelector";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const SalesChart = dynamic(
  () => import("../organisms/SalesChart").then((mod) => mod.SalesChart),
  {
    loading: () => <Skeleton className="h-80 w-full rounded-md" />,
    ssr: false,
  },
);

const RevenueByCategoryChart = dynamic(
  () =>
    import("../organisms/RevenueByCategoryChart").then(
      (mod) => mod.RevenueByCategoryChart,
    ),
  {
    loading: () => <Skeleton className="h-64 w-full rounded-md" />,
    ssr: false,
  },
);

type Period = "1d" | "7d" | "30d" | "90d" | "12m";
type Source = "all" | "marketplace" | "vendor_shop";

interface SalesOverviewData {
  revenue: { value: number; previous: number; change: number };
  orders: { value: number; previous: number; change: number };
  averageOrderValue: { value: number; previous: number; change: number };
  refunds: { count: number; amount: number };
  cancellations: number;
}

interface ChartDataPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  productId: string;
  title: string;
  image: string | null;
  slug: string | null;
  revenue: number;
  quantity: number;
  orders: number;
}

interface CategoryRevenue {
  category: string;
  revenue: number;
  percentage: number;
}

interface CustomerInsightsData {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  repeatRate: number;
  averageOrderValue: number;
  topCustomers: Array<{
    name: string;
    email: string;
    totalSpent: number;
    orderCount: number;
  }>;
}

interface ViewsDataPoint {
  date: string;
  label: string;
  views: number;
}

interface ViewsOverviewData {
  views: { value: number; previous: number; change: number };
}

interface MetaFunnelStep {
  name: "PageView" | "ViewContent" | "InitiateCheckout" | "Purchase";
  count: number;
  conversionRate: number;
}

interface MetaFunnelData {
  hasPixel: boolean;
  funnel: MetaFunnelStep[];
}

interface AnalyticsTemplateProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
  source: Source;
  onSourceChange: (source: Source) => void;
  currency: string;
  salesOverview: SalesOverviewData | null | undefined;
  salesChart: ChartDataPoint[] | null | undefined;
  topProducts: TopProduct[] | null | undefined;
  revenueByCategory: CategoryRevenue[] | null | undefined;
  customerInsights: CustomerInsightsData | null | undefined;
  viewsChart: ViewsDataPoint[] | null | undefined;
  viewsOverview: ViewsOverviewData | null | undefined;
  metaFunnel: MetaFunnelData | null | undefined;
  isLoading: boolean;
}

export function AnalyticsTemplate({
  period,
  onPeriodChange,
  source,
  onSourceChange,
  currency,
  salesOverview,
  salesChart,
  topProducts,
  revenueByCategory,
  customerInsights,
  viewsChart,
  viewsOverview,
  metaFunnel,
  isLoading,
}: AnalyticsTemplateProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivez les performances de votre boutique
          </p>
        </div>
        <PeriodSelector value={period} onChange={onPeriodChange} />
      </div>

      {/* Source tabs */}
      <Tabs value={source} onValueChange={(v) => onSourceChange(v as Source)}>
        <TabsList>
          <TabsTrigger value="all">Toutes les ventes</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="vendor_shop">Boutique ads</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPI Cards */}
      <SalesOverviewCards
        data={salesOverview}
        currency={currency}
        isLoading={isLoading}
      />

      {/* Sales Chart — full width */}
      <SalesChart data={salesChart} currency={currency} isLoading={isLoading} />

      {/* Two columns: Top Products + Category Breakdown */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TopProductsTable
            data={topProducts}
            currency={currency}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-2">
          <RevenueByCategoryChart
            data={revenueByCategory}
            currency={currency}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Customer Insights — full width */}
      <CustomerInsightsPanel
        data={customerInsights}
        currency={currency}
        isLoading={isLoading}
      />

      {/* Marketplace Visitors — only relevant for marketplace/all sources */}
      {(source === "all" || source === "marketplace") && (
        <ViewsChart
          chartData={viewsChart}
          overview={viewsOverview}
          isLoading={isLoading}
        />
      )}

      {/* Meta Pixel Funnel — shop ads only */}
      {(source === "all" || source === "vendor_shop") && (
        <MetaFunnelChart data={metaFunnel} isLoading={isLoading} />
      )}
    </div>
  );
}
