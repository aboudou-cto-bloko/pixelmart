// filepath: src/components/delivery/atoms/DeliveryTypeBadge.tsx

import { DELIVERY_TYPES, type DeliveryType } from "@/constants/deliveryTypes";
import { Badge } from "@/components/ui/badge";
import { Package, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  Package,
  Zap,
  AlertTriangle,
} as const;

const COLORS: Record<DeliveryType, string> = {
  standard: "bg-gray-500",
  urgent: "bg-orange-500",
  fragile: "bg-amber-500",
};

interface DeliveryTypeBadgeProps {
  type: DeliveryType;
  className?: string;
}

export function DeliveryTypeBadge({ type, className }: DeliveryTypeBadgeProps) {
  const config = DELIVERY_TYPES[type];
  const Icon = ICONS[config.icon as keyof typeof ICONS];

  return (
    <Badge
      variant="secondary"
      className={cn(COLORS[type], "text-white gap-1", className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
