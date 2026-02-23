// filepath: src/components/analytics/templates/AnalyticsTemplate.tsx

"use client";

import { SalesOverviewCards } from "../organisms/SalesOverviewCards";
import { SalesChart } from "../organisms/SalesChart";
import { TopProductsTable } from "../organisms/TopProductsTable";
import { RevenueByCategoryChart } from "../organisms/RevenueByCategoryChart";
import { CustomerInsightsPanel } from "../organisms/CustomerInsightsPanel";
import { PeriodSelector } from "../molecules/PeriodSelector";

type Period = "7d" | "30d" | "90d" | "12m";

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

interface AnalyticsTemplateProps {
  period: Period;
  onPeriodChange: (period: Period) => void;
  currency: string;
  salesOverview: SalesOverviewData | null | undefined;
  salesChart: ChartDataPoint[] | null | undefined;
  topProducts: TopProduct[] | null | undefined;
  revenueByCategory: CategoryRevenue[] | null | undefined;
  customerInsights: CustomerInsightsData | null | undefined;
  isLoading: boolean;
}

export function AnalyticsTemplate({
  period,
  onPeriodChange,
  currency,
  salesOverview,
  salesChart,
  topProducts,
  revenueByCategory,
  customerInsights,
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
    </div>
  );
}
