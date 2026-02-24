// filepath: src/components/notifications/molecules/NotificationItem.tsx

"use client";

import { cn } from "@/lib/utils";
import { NotificationIcon } from "../atoms/NotificationIcon";

interface NotificationItemProps {
  type: string;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: number;
  onClick?: () => void;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function NotificationItem({
  type,
  title,
  body,
  isRead,
  createdAt,
  onClick,
}: NotificationItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors",
        "hover:bg-muted/50",
        !isRead && "bg-primary/5",
      )}
    >
      <NotificationIcon type={type} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm truncate",
              !isRead ? "font-semibold" : "font-medium",
            )}
          >
            {title}
          </p>
          {!isRead && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {body}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {timeAgo(createdAt)}
        </p>
      </div>
    </button>
  );
}
