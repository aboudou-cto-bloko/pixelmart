// filepath: src/components/notifications/organisms/NotificationDropdown.tsx

"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NotificationBadge } from "../atoms/NotificationBadge";
import { NotificationItem } from "../molecules/NotificationItem";
import { NotificationEmptyState } from "../molecules/NotificationEmptyState";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import type { Id } from "../../../../convex/_generated/dataModel";

interface NotificationDropdownProps {
  notificationsPath?: string;
}

export function NotificationDropdown({
  notificationsPath = "/notifications",
}: NotificationDropdownProps) {
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications(10);

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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <NotificationBadge count={unreadCount} />
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={markAllRead}
            >
              Tout marquer lu
            </Button>
          )}
        </div>
        <Separator />

        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <NotificationEmptyState />
          ) : (
            <div className="p-1">
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
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => router.push(notificationsPath)}
              >
                Voir toutes les notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
