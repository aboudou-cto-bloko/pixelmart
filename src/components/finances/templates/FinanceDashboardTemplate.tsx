// filepath: src/components/finance/templates/FinanceDashboardTemplate.tsx

"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FinancialKpiGrid } from "../molecules/FinancialKpiGrid";
import { TransactionTable } from "../organisms/TransactionTable";
import { RevenueChart } from "../organisms/RevenueChart";

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

interface FinanceDashboardTemplateProps {
  overview:
    | {
        balance: number;
        pendingBalance: number;
        revenue30d: number;
        commissions30d: number;
        revenueTrend: number;
        currency: string;
        commissionRate: number;
      }
    | undefined;
  transactions:
    | Array<{
        _id: string;
        type: TransactionType;
        direction: "credit" | "debit";
        amount: number;
        currency: string;
        description: string;
        order_number?: string;
        reference?: string;
        status: "pending" | "completed" | "failed" | "reversed";
        _creationTime: number;
      }>
    | undefined;
  chartData:
    | Array<{
        date: string;
        revenue: number;
        commissions: number;
        net: number;
        orders: number;
      }>
    | undefined;
  margins:
    | Array<{
        productId: string;
        title: string;
        totalRevenue: number;
        totalCost: number;
        commissionAmount: number;
        netRevenue: number;
        marginPercent: number;
        totalQuantity: number;
        orderCount: number;
      }>
    | undefined;
  chartPeriod: Period;
  onChartPeriodChange: (p: Period) => void;
  txTypeFilter: TypeFilter;
  onTxTypeFilterChange: (t: TypeFilter) => void;
  isLoading: boolean;
}

import { MarginBar } from "../molecules/MarginBar";

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "12m", label: "12 mois" },
];

const TX_TYPE_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "sale", label: "Ventes" },
  { value: "fee", label: "Commissions" },
  { value: "payout", label: "Retraits" },
  { value: "refund", label: "Remboursements" },
];

export function FinanceDashboardTemplate({
  overview,
  transactions,
  chartData,
  margins,
  chartPeriod,
  onChartPeriodChange,
  txTypeFilter,
  onTxTypeFilterChange,
  isLoading,
}: FinanceDashboardTemplateProps) {
  const currency = overview?.currency ?? "XOF";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Finance
        </h1>
        <p className="text-sm text-muted-foreground">
          Solde, transactions et analyse des marges
        </p>
      </div>

      {/* KPIs */}
      {overview && (
        <FinancialKpiGrid
          balance={overview.balance}
          pendingBalance={overview.pendingBalance}
          revenue30d={overview.revenue30d}
          commissions30d={overview.commissions30d}
          revenueTrend={overview.revenueTrend}
          currency={currency}
          commissionRate={overview.commissionRate}
        />
      )}

      <Separator />

      {/* Revenue Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Évolution des revenus</h2>
          <Tabs
            value={chartPeriod}
            onValueChange={(v) => onChartPeriodChange(v as Period)}
          >
            <TabsList className="h-8">
              {PERIOD_OPTIONS.map((opt) => (
                <TabsTrigger
                  key={opt.value}
                  value={opt.value}
                  className="text-xs"
                >
                  {opt.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <RevenueChart
          data={chartData}
          isLoading={isLoading}
          currency={currency}
        />
      </div>

      <Separator />

      {/* Margin Analysis */}
      {margins && margins.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Marges par produit</h2>
          <div className="divide-y">
            {margins.slice(0, 10).map((m) => (
              <MarginBar
                key={m.productId}
                title={m.title}
                revenue={m.totalRevenue}
                cost={m.totalCost}
                commission={m.commissionAmount}
                net={m.netRevenue}
                marginPercent={m.marginPercent}
                currency={currency}
                quantity={m.totalQuantity}
              />
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Transaction History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Transactions</h2>
          <Tabs
            value={txTypeFilter}
            onValueChange={(v) => onTxTypeFilterChange(v as TypeFilter)}
          >
            <TabsList className="h-8">
              {TX_TYPE_OPTIONS.map((opt) => (
                <TabsTrigger
                  key={opt.value}
                  value={opt.value}
                  className="text-xs"
                >
                  {opt.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <TransactionTable transactions={transactions} isLoading={isLoading} />
      </div>
    </div>
  );
}
