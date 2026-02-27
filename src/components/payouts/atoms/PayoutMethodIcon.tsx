// filepath: src/components/payouts/atoms/PayoutMethodIcon.tsx

"use client";

import { Smartphone, Building2, Globe, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const METHOD_CONFIG: Record<
  string,
  { icon: LucideIcon; label: string; colorClass: string }
> = {
  mobile_money: {
    icon: Smartphone,
    label: "Mobile Money",
    colorClass: "bg-orange-500/10 text-orange-500",
  },
  bank_transfer: {
    icon: Building2,
    label: "Virement bancaire",
    colorClass: "bg-blue-500/10 text-blue-500",
  },
  paypal: {
    icon: Globe,
    label: "PayPal",
    colorClass: "bg-indigo-500/10 text-indigo-500",
  },
};

interface PayoutMethodIconProps {
  method: string;
  showLabel?: boolean;
  className?: string;
}

export function PayoutMethodIcon({
  method,
  showLabel = false,
  className,
}: PayoutMethodIconProps) {
  const config = METHOD_CONFIG[method] ?? METHOD_CONFIG.mobile_money;
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          config.colorClass,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      {showLabel && <span className="text-sm font-medium">{config.label}</span>}
    </div>
  );
}

export function getMethodLabel(method: string): string {
  return METHOD_CONFIG[method]?.label ?? method;
}
