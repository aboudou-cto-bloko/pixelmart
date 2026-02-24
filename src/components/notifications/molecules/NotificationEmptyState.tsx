// filepath: src/components/notifications/molecules/NotificationEmptyState.tsx

"use client";

import { Bell } from "lucide-react";

export function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <Bell className="h-8 w-8 text-muted-foreground/50" />
      <p className="text-sm font-medium">Aucune notification</p>
      <p className="text-xs text-muted-foreground">
        Vos notifications apparaîtront ici.
      </p>
    </div>
  );
}
