// filepath: src/components/returns/ReturnStatusBadge.tsx
"use client";

import { Badge } from "@/components/ui/badge";

type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "received"
  | "refunded";

const STATUS_CONFIG: Record<
  ReturnStatus,
  { label: string; variant: string; className: string }
> = {
  requested: {
    label: "En attente",
    variant: "outline",
    className:
      "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  approved: {
    label: "Approuvé",
    variant: "outline",
    className:
      "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  rejected: {
    label: "Refusé",
    variant: "outline",
    className: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
  },
  received: {
    label: "Reçu",
    variant: "outline",
    className:
      "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  },
  refunded: {
    label: "Remboursé",
    variant: "outline",
    className:
      "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
};

interface ReturnStatusBadgeProps {
  status: ReturnStatus;
  className?: string;
}

export function ReturnStatusBadge({
  status,
  className,
}: ReturnStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={`${config.className} ${className ?? ""}`}
    >
      {config.label}
    </Badge>
  );
}
