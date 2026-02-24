// filepath: src/hooks/useNotifications.ts

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function useNotifications(limit?: number) {
  const notifications = useQuery(api.notifications.queries.list, {
    limit: limit ?? 20,
  });
  const unreadCount = useQuery(api.notifications.queries.unreadCount);
  const markReadMutation = useMutation(api.notifications.mutations.markRead);
  const markAllReadMutation = useMutation(
    api.notifications.mutations.markAllRead,
  );

  const markRead = async (notificationId: Id<"notifications">) => {
    await markReadMutation({ notificationId });
  };

  const markAllRead = async () => {
    await markAllReadMutation();
  };

  return {
    notifications: notifications ?? [],
    unreadCount: unreadCount ?? 0,
    isLoading: notifications === undefined,
    markRead,
    markAllRead,
  };
}
