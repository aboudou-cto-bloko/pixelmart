// filepath: src/components/finance/atoms/BalanceCard.tsx

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface BalanceCardProps {
  title: string;
  amount: number;
  currency: string;
  icon: LucideIcon;
  trend?: number;
  subtitle?: string;
  className?: string;
}

function formatAmount(centimes: number, currency: string): string {
  const amount = centimes / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "XOF" ? 0 : 2,
    maximumFractionDigits: currency === "XOF" ? 0 : 2,
  }).format(amount);
}

export function BalanceCard({
  title,
  amount,
  currency,
  icon: Icon,
  trend,
  subtitle,
  className,
}: BalanceCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="mt-2 text-xl font-bold tracking-tight sm:text-2xl tabular-nums">
          {formatAmount(amount, currency)}
        </p>
        {(trend !== undefined || subtitle) && (
          <div className="mt-1 flex items-center gap-1.5">
            {trend !== undefined && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend > 0
                    ? "text-emerald-500"
                    : trend < 0
                      ? "text-red-500"
                      : "text-muted-foreground",
                )}
              >
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
