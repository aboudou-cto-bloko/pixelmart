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
import { formatPrice } from "@/lib/format";

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

const NO_DECIMAL_CHART = ["XOF", "XAF", "GNF", "CDF"];

function makeFormatTick(currency: string) {
  return (centimes: number): string => {
    // Pour XOF/XAF/GNF/CDF : centimes = valeur directe (pas de ÷100)
    const value = NO_DECIMAL_CHART.includes(currency) ? centimes : centimes / 100;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
    return `${value.toFixed(0)}`;
  };
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
          tickFormatter={makeFormatTick(currency)}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = {
              revenue: "Revenus",
              net: "Net",
              commissions: "Commissions",
            };
            return [formatPrice(value, currency), labels[name] ?? name];
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
