// filepath: src/components/delivery/atoms/PaymentModeBadge.tsx

import { PAYMENT_MODES, type PaymentMode } from "@/constants/deliveryTypes";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  CreditCard,
  Banknote,
} as const;

const COLORS: Record<PaymentMode, string> = {
  online: "bg-green-500",
  cod: "bg-blue-500",
};

interface PaymentModeBadgeProps {
  mode: PaymentMode;
  className?: string;
}

export function PaymentModeBadge({ mode, className }: PaymentModeBadgeProps) {
  const config = PAYMENT_MODES[mode];
  const Icon = ICONS[config.icon as keyof typeof ICONS];

  return (
    <Badge
      variant="secondary"
      className={cn(COLORS[mode], "text-white gap-1", className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
