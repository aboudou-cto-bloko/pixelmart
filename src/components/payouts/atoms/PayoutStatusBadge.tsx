// filepath: src/components/payouts/atoms/PayoutStatusBadge.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: "En attente",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  processing: {
    label: "En cours",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  completed: {
    label: "Effectué",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  failed: {
    label: "Échoué",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  cancelled: {
    label: "Annulé",
    className: "bg-muted text-muted-foreground border-muted",
  },
};

interface PayoutStatusBadgeProps {
  status: string;
  className?: string;
}

export function PayoutStatusBadge({
  status,
  className,
}: PayoutStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
