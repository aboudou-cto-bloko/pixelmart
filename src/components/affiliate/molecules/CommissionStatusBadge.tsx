// filepath: src/components/affiliate/molecules/CommissionStatusBadge.tsx

import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

type CommissionStatus = "pending" | "paid" | "cancelled";

interface CommissionStatusBadgeProps {
  status: CommissionStatus;
}

const CONFIG: Record<
  CommissionStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  pending: {
    label: "En attente",
    icon: Clock,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  paid: {
    label: "Payé",
    icon: CheckCircle2,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  cancelled: {
    label: "Annulé",
    icon: XCircle,
    className: "bg-muted text-muted-foreground",
  },
};

export function CommissionStatusBadge({ status }: CommissionStatusBadgeProps) {
  const { label, icon: Icon, className } = CONFIG[status];
  return (
    <Badge variant="outline" className={`gap-1 border-0 ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
