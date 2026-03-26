// filepath: src/app/(agent)/layout.tsx
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { NotificationDropdown } from "@/components/notifications/organisms/NotificationDropdown";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard roles={["agent", "admin"]}>
      <SidebarProvider>
        <AgentSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4 w-full">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <span className="text-sm font-medium">Espace agent entrepôt</span>
              <div className="ml-auto">
                <NotificationDropdown notificationsPath="/agent/notifications" />
              </div>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
