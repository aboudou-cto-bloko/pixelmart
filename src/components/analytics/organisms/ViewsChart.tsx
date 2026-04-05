// filepath: src/components/analytics/organisms/ViewsChart.tsx

"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../atoms/EmptyState";

interface ViewsDataPoint {
  date: string;
  label: string;
  views: number;
}

interface ViewsOverviewData {
  views: { value: number; previous: number; change: number };
}

interface ViewsChartProps {
  chartData: ViewsDataPoint[] | null | undefined;
  overview: ViewsOverviewData | null | undefined;
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ViewsDataPoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const { label, views } = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">
        {views} visiteur{views > 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function ViewsChart({
  chartData,
  overview,
  isLoading,
}: ViewsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[260px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = chartData && chartData.some((d) => d.views > 0);
  const change = overview?.views.change ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            Visiteurs marketplace
          </CardTitle>
          {overview && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold">
                {overview.views.value.toLocaleString("fr-FR")}
              </span>
              {overview.views.previous > 0 && (
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    change >= 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {change >= 0 ? "+" : ""}
                  {change}%
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                vs période précédente
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState
            title="Aucune visite sur cette période"
            description="Les visites de votre boutique sur la marketplace apparaîtront ici."
          />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.25}
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
                allowDecimals={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="views"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#viewsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
