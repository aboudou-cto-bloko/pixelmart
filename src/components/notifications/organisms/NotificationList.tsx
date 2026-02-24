// filepath: src/components/notifications/organisms/NotificationList.tsx

"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "../molecules/NotificationItem";
import { NotificationEmptyState } from "../molecules/NotificationEmptyState";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import type { Id } from "../../../../convex/_generated/dataModel";

export function NotificationList() {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, markRead, markAllRead } =
    useNotifications(50);

  const handleClick = async (
    notificationId: Id<"notifications">,
    link?: string,
    isRead?: boolean,
  ) => {
    if (!isRead) {
      await markRead(notificationId);
    }
    if (link) {
      router.push(link);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
              : "Toutes lues"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Tout marquer lu
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <NotificationEmptyState />
      ) : (
        <div className="divide-y rounded-lg border">
          {notifications.map((n) => (
            <NotificationItem
              key={n._id}
              type={n.type}
              title={n.title}
              body={n.body}
              link={n.link}
              isRead={n.is_read}
              createdAt={n._creationTime}
              onClick={() => handleClick(n._id, n.link, n.is_read)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
