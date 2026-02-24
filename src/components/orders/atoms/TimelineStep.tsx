// filepath: src/components/orders/atoms/TimelineStep.tsx

"use client";

import {
  Clock,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EventType =
  | "created"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "tracking_updated"
  | "note";

interface TimelineStepProps {
  type: EventType;
  description: string;
  actorType: "system" | "customer" | "vendor" | "admin";
  createdAt: number;
  isLast?: boolean;
  className?: string;
}

const EVENT_ICONS: Record<EventType, typeof Clock> = {
  created: Clock,
  paid: CreditCard,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: RotateCcw,
  tracking_updated: MapPin,
  note: MessageSquare,
};

const EVENT_COLORS: Record<EventType, string> = {
  created: "text-yellow-500 bg-yellow-500/10",
  paid: "text-blue-500 bg-blue-500/10",
  processing: "text-indigo-500 bg-indigo-500/10",
  shipped: "text-purple-500 bg-purple-500/10",
  delivered: "text-emerald-500 bg-emerald-500/10",
  cancelled: "text-red-500 bg-red-500/10",
  refunded: "text-muted-foreground bg-muted",
  tracking_updated: "text-purple-500 bg-purple-500/10",
  note: "text-muted-foreground bg-muted",
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60_000) return "À l'instant";
  if (diff < 3_600_000) return `il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `il y a ${Math.floor(diff / 3_600_000)}h`;
  if (diff < 604_800_000) return `il y a ${Math.floor(diff / 86_400_000)}j`;

  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TimelineStep({
  type,
  description,
  actorType,
  createdAt,
  isLast,
  className,
}: TimelineStepProps) {
  const Icon = EVENT_ICONS[type];
  const colorClass = EVENT_COLORS[type];

  return (
    <div className={cn("flex gap-3", className)}>
      {/* Icon + vertical line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
            colorClass,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-border min-h-[24px]" />}
      </div>

      {/* Content */}
      <div className="pb-6 min-w-0">
        <p className="text-sm leading-snug">{description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(createdAt)}
          </span>
          {actorType !== "system" && (
            <span className="text-xs text-muted-foreground capitalize">
              — {actorType === "customer" ? "client" : actorType}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
