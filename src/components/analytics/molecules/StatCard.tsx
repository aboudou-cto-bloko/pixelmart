// filepath: src/components/analytics/molecules/StatCard.tsx

"use client";

import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricValue } from "../atoms/MetricValue";
import { TrendBadge } from "../atoms/TrendBadge";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  change: number;
  type?: "currency" | "number" | "percent";
  currency?: string;
  icon: LucideIcon;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  type = "number",
  currency,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <MetricValue value={value} type={type} currency={currency} />
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="mt-3">
          <TrendBadge value={change} />
          <span className="ml-2 text-xs text-muted-foreground">
            vs période précédente
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="mt-3 h-5 w-40" />
      </CardContent>
    </Card>
  );
}
