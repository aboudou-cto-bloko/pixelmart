// filepath: src/components/analytics/organisms/SalesChart.tsx

"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "../atoms/EmptyState";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";

interface ChartDataPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

interface SalesChartProps {
  data: ChartDataPoint[] | null | undefined;
  currency?: string;
  isLoading?: boolean;
}

type ChartView = "revenue" | "orders";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: ChartDataPoint;
  }>;
  chartView: ChartView;
  currency: string;
}

function CustomTooltip({
  active,
  payload,
  chartView,
  currency,
}: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null;

  const dataPoint = payload[0].payload;
  const value = payload[0].value;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{dataPoint.label}</p>
      <p className="text-sm font-semibold">
        {chartView === "revenue"
          ? formatPrice(value, currency)
          : `${value} commande${value > 1 ? "s" : ""}`}
      </p>
    </div>
  );
}

export function SalesChart({
  data,
  currency = "XOF",
  isLoading,
}: SalesChartProps) {
  const [chartView, setChartView] = useState<ChartView>("revenue");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = data && data.some((d) => d.revenue > 0 || d.orders > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          Évolution des ventes
        </CardTitle>
        <Tabs
          value={chartView}
          onValueChange={(v) => setChartView(v as ChartView)}
        >
          <TabsList className="h-8">
            <TabsTrigger value="revenue" className="text-xs">
              Revenus
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs">
              Commandes
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState
            title="Aucune vente sur cette période"
            description="Changez la période ou attendez vos premières commandes."
          />
        ) : chartView === "revenue" ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatPrice(v, currency)}
                width={80}
              />
              <Tooltip
                content={
                  <CustomTooltip chartView="revenue" currency={currency} />
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={
                  <CustomTooltip chartView="orders" currency={currency} />
                }
              />
              <Bar
                dataKey="orders"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
