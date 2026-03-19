// filepath: src/components/delivery/atoms/BatchStatusBadge.tsx

import {
  DELIVERY_BATCH_STATUSES,
  type DeliveryBatchStatus,
} from "@/constants/deliveryTypes";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BatchStatusBadgeProps {
  status: DeliveryBatchStatus;
  className?: string;
}

export function BatchStatusBadge({ status, className }: BatchStatusBadgeProps) {
  const config = DELIVERY_BATCH_STATUSES[status];

  return (
    <Badge
      variant="secondary"
      className={cn("font-medium", config.color, "text-white", className)}
    >
      {config.label}
    </Badge>
  );
}
