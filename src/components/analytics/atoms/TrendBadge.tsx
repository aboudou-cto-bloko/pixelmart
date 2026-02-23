// filepath: src/components/analytics/atoms/TrendBadge.tsx

"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  value: number; // percentage change
  className?: string;
}

export function TrendBadge({ value, className }: TrendBadgeProps) {
  if (value === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
          "bg-muted text-muted-foreground",
          className,
        )}
      >
        <Minus className="h-3 w-3" />
        0%
      </span>
    );
  }

  const isPositive = value > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        isPositive
          ? "bg-emerald-500/10 text-emerald-500"
          : "bg-red-500/10 text-red-500",
        className,
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? "+" : ""}
      {value}%
    </span>
  );
}
