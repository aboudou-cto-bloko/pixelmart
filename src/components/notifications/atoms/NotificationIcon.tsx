// filepath: src/components/notifications/atoms/NotificationIcon.tsx

"use client";

import {
  ShoppingCart,
  Package,
  AlertTriangle,
  Wallet,
  Star,
  Info,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, LucideIcon> = {
  order_new: ShoppingCart,
  order_status: Package,
  low_stock: AlertTriangle,
  payment: Wallet,
  review: Star,
  system: Info,
  promo: Tag,
};

const TYPE_COLORS: Record<string, string> = {
  order_new: "bg-blue-500/10 text-blue-500",
  order_status: "bg-primary/10 text-primary",
  low_stock: "bg-yellow-500/10 text-yellow-500",
  payment: "bg-emerald-500/10 text-emerald-500",
  review: "bg-amber-500/10 text-amber-500",
  system: "bg-muted text-muted-foreground",
  promo: "bg-purple-500/10 text-purple-500",
};

interface NotificationIconProps {
  type: string;
  className?: string;
}

export function NotificationIcon({ type, className }: NotificationIconProps) {
  const Icon = TYPE_ICONS[type] ?? Info;
  const colorClass = TYPE_COLORS[type] ?? TYPE_COLORS.system;

  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        colorClass,
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}
