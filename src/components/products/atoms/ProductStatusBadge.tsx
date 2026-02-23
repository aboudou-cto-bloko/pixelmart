// filepath: src/components/products/atoms/ProductStatusBadge.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProductStatus = "draft" | "active" | "archived" | "out_of_stock";

interface ProductStatusBadgeProps {
  status: ProductStatus;
  className?: string;
}

const STATUS_CONFIG: Record<ProductStatus, { label: string; variant: string }> =
  {
    draft: {
      label: "Brouillon",
      variant: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    },
    active: {
      label: "Actif",
      variant: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    archived: {
      label: "Archivé",
      variant: "bg-muted text-muted-foreground border-muted",
    },
    out_of_stock: {
      label: "Rupture",
      variant: "bg-red-500/10 text-red-500 border-red-500/20",
    },
  };

export function ProductStatusBadge({
  status,
  className,
}: ProductStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", config.variant, className)}
    >
      {config.label}
    </Badge>
  );
}
