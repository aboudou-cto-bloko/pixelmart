// filepath: src/components/orders/atoms/OrderStatusBadge.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: string }> = {
  pending: {
    label: "En attente",
    variant: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  paid: {
    label: "Payé",
    variant: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  processing: {
    label: "En préparation",
    variant: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  },
  shipped: {
    label: "Expédié",
    variant: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  delivered: {
    label: "Livré",
    variant: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  cancelled: {
    label: "Annulé",
    variant: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  refunded: {
    label: "Remboursé",
    variant: "bg-muted text-muted-foreground border-muted",
  },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
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
