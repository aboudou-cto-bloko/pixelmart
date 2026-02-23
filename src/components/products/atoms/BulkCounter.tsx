// filepath: src/components/products/atoms/BulkCounter.tsx

"use client";

import { cn } from "@/lib/utils";

interface BulkCounterProps {
  count: number;
  total: number;
  className?: string;
}

export function BulkCounter({ count, total, className }: BulkCounterProps) {
  if (count === 0) return null;

  return (
    <span className={cn("text-sm font-medium text-primary", className)}>
      {count} sur {total} sélectionné{count > 1 ? "s" : ""}
    </span>
  );
}
