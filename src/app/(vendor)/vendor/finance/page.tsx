// filepath: src/app/(vendor)/vendor/finance/page.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { FinanceDashboardTemplate } from "@/components/finances/templates/FinanceDashboardTemplate";

type Period = "7d" | "30d" | "90d" | "12m";
type TransactionType =
  | "sale"
  | "refund"
  | "payout"
  | "fee"
  | "credit"
  | "transfer"
  | "ad_payment"
  | "subscription";
type TypeFilter = TransactionType | "all";

export default function VendorFinancePage() {
  const [chartPeriod, setChartPeriod] = useState<Period>("30d");
  const [txTypeFilter, setTxTypeFilter] = useState<TypeFilter>("all");

  const overview = useQuery(api.finance.queries.getOverview);

  const txArgs =
    txTypeFilter === "all"
      ? { period: chartPeriod as "7d" | "30d" | "90d" | "12m" | "all" }
      : {
          type: txTypeFilter as TransactionType,
          period: chartPeriod as "7d" | "30d" | "90d" | "12m" | "all",
        };
  const transactions = useQuery(api.finance.queries.listTransactions, txArgs);

  const chartData = useQuery(api.finance.queries.getRevenueByPeriod, {
    period: chartPeriod,
  });

  const margins = useQuery(api.finance.queries.getMarginAnalysis, {
    period: chartPeriod,
  });

  const isLoading =
    overview === undefined ||
    transactions === undefined ||
    chartData === undefined;

  return (
    <FinanceDashboardTemplate
      overview={overview ?? undefined}
      transactions={transactions ?? undefined}
      chartData={chartData ?? undefined}
      margins={margins ?? undefined}
      chartPeriod={chartPeriod}
      onChartPeriodChange={setChartPeriod}
      txTypeFilter={txTypeFilter}
      onTxTypeFilterChange={setTxTypeFilter}
      isLoading={isLoading}
    />
  );
}
