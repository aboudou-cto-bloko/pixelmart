// filepath: src/components/notifications/atoms/NotificationBadge.tsx

"use client";

import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({
  count,
  className,
}: NotificationBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        "absolute -top-1 -right-1 flex items-center justify-center",
        "h-4 min-w-4 rounded-full bg-destructive px-1",
        "text-[10px] font-bold text-destructive-foreground",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
