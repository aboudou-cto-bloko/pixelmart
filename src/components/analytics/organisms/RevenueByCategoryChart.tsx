// filepath: src/components/analytics/organisms/RevenueByCategoryChart.tsx

"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../atoms/EmptyState";
import { formatPrice } from "@/lib/utils";

interface CategoryRevenue {
  category: string;
  revenue: number;
  percentage: number;
}

interface RevenueByCategoryChartProps {
  data: CategoryRevenue[] | null | undefined;
  currency?: string;
  isLoading?: boolean;
}

// Distinct, accessible colors for up to 8 categories
const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(210, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(45, 85%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(270, 55%, 55%)",
  "hsl(15, 75%, 55%)",
  "hsl(180, 55%, 45%)",
];

interface CategoryTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CategoryRevenue & { fill: string };
  }>;
  currency: string;
}

function CategoryTooltip({ active, payload, currency }: CategoryTooltipProps) {
  if (!active || !payload?.[0]) return null;

  const item = payload[0].payload;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="text-xs font-medium">{item.category}</p>
      <p className="text-sm font-semibold">
        {formatPrice(item.revenue, currency)}
      </p>
      <p className="text-xs text-muted-foreground">
        {item.percentage}% du total
      </p>
    </div>
  );
}

export function RevenueByCategoryChart({
  data,
  currency = "XOF",
  isLoading,
}: RevenueByCategoryChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mx-auto h-[200px] w-[200px] rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Revenus par catégorie
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <EmptyState title="Aucune donnée" />
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ResponsiveContainer
              width="100%"
              height={200}
              className="max-w-[220px]"
            >
              <PieChart>
                <Pie
                  data={data}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {data.map((_, index) => (
                    <Cell
                      key={index}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CategoryTooltip currency={currency} />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              {data.map((item, index) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="text-sm truncate">{item.category}</span>
                  </div>
                  <span className="text-sm font-medium tabular-nums shrink-0">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
