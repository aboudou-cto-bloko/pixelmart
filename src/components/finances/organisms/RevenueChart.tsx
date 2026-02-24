// filepath: src/components/finance/organisms/RevenueChart.tsx

"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartDataPoint {
  date: string;
  revenue: number;
  commissions: number;
  net: number;
  orders: number;
}

interface RevenueChartProps {
  data: ChartDataPoint[] | undefined;
  isLoading: boolean;
  currency: string;
}

function formatTick(centimes: number): string {
  if (centimes >= 100_000_00) return `${(centimes / 100_000_00).toFixed(0)}M`;
  if (centimes >= 1_000_00) return `${(centimes / 1_000_00).toFixed(0)}k`;
  return `${(centimes / 100).toFixed(0)}`;
}

export function RevenueChart({ data, isLoading, currency }: RevenueChartProps) {
  if (isLoading || !data) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        Pas de données pour cette période
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          className="text-xs text-muted-foreground"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: string) => {
            // YYYY-MM-DD → DD/MM ou YYYY-MM → MMM
            if (v.length === 10) {
              const [, m, d] = v.split("-");
              return `${d}/${m}`;
            }
            const [, m] = v.split("-");
            const months = [
              "Jan",
              "Fév",
              "Mar",
              "Avr",
              "Mai",
              "Jun",
              "Jul",
              "Aoû",
              "Sep",
              "Oct",
              "Nov",
              "Déc",
            ];
            return months[parseInt(m, 10) - 1] ?? m;
          }}
        />
        <YAxis
          className="text-xs text-muted-foreground"
          tickLine={false}
          axisLine={false}
          tickFormatter={formatTick}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => {
            const formatted = new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency,
              minimumFractionDigits: currency === "XOF" ? 0 : 2,
              maximumFractionDigits: currency === "XOF" ? 0 : 2,
            }).format(value / 100);

            const labels: Record<string, string> = {
              revenue: "Revenus",
              net: "Net",
              commissions: "Commissions",
            };
            return [formatted, labels[name] ?? name];
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary) / 0.1)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="net"
          stroke="hsl(142.1 76.2% 36.3%)"
          fill="hsl(142.1 76.2% 36.3% / 0.1)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
