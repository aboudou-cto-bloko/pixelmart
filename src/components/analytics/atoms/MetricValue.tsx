// filepath: src/components/analytics/atoms/MetricValue.tsx

"use client";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

interface MetricValueProps {
  value: number;
  type?: "currency" | "number" | "percent";
  currency?: string;
  className?: string;
}

export function MetricValue({
  value,
  type = "number",
  currency = "XOF",
  className,
}: MetricValueProps) {
  let formatted: string;

  switch (type) {
    case "currency":
      formatted = formatPrice(value, currency);
      break;
    case "percent":
      formatted = `${value}%`;
      break;
    case "number":
    default:
      formatted = new Intl.NumberFormat("fr-FR").format(value);
      break;
  }

  return (
    <span className={cn("text-2xl font-bold tracking-tight", className)}>
      {formatted}
    </span>
  );
}
