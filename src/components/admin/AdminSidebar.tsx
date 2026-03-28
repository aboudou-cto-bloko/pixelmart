// filepath: src/components/admin/AdminSidebar.tsx

"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronsUpDown, LogOut, ShieldCheck } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { authClient } from "@/lib/auth-client";
import { ADMIN_NAV, type AdminRole } from "@/constants/admin-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);

  return matches;
}

function useAutoCloseMobileSidebar() {
  const { setOpenMobile } = useSidebar();
  return setOpenMobile;
}

// ── Role label / color map ──
const ROLE_META: Record<AdminRole, { label: string; color: string }> = {
  admin:     { label: "Super Admin", color: "bg-red-600" },
  finance:   { label: "Financier",   color: "bg-emerald-600" },
  logistics: { label: "Logistique",  color: "bg-blue-600" },
  developer: { label: "Dev",         color: "bg-violet-600" },
  marketing: { label: "Marketing",   color: "bg-orange-500" },
};

// ---- Admin Header ----
function AdminHeader() {
  const { user } = useCurrentUser();
  const role = (user?.role ?? "admin") as AdminRole;
  const meta = ROLE_META[role] ?? ROLE_META.admin;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link href="/admin/dashboard" prefetch={false}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-destructive text-destructive-foreground shrink-0">
              <ShieldCheck className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
              <span className="truncate font-semibold">Pixel-Mart</span>
              <span className="truncate text-xs text-muted-foreground flex items-center gap-1">
                <Badge
                  className={`h-4 px-1 text-[10px] font-semibold text-white ${meta.color}`}
                >
                  {meta.label}
                </Badge>
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// ---- Nav Section ----
function AdminNavSection() {
  const pathname = usePathname();
  const closeMobileSidebar = useAutoCloseMobileSidebar();
  const { user } = useCurrentUser();
  const role = (user?.role ?? "admin") as AdminRole;

  // Filtrer par rôle (undefined = accessible à tous)
  const visibleNav = ADMIN_NAV.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  // Group items by section
  const sections = visibleNav.reduce<Record<string, typeof ADMIN_NAV>>((acc, item) => {
    const key = item.section ?? "Administration";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(sections).map(([section, items]: [string, typeof ADMIN_NAV]) => (
        <SidebarGroup key={section}>
          <SidebarGroupLabel>{section}</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/agent" && pathname.startsWith(item.href + "/"));

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                    className={cn(isActive && "font-medium")}
                  >
                    <Link
                      href={item.href}
                      prefetch={false}
                      onClick={() => closeMobileSidebar(false)}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}

// ---- Admin Footer ----
function AdminFooter() {
  const { user } = useCurrentUser();
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={user.avatar_url ?? undefined}
                  alt={user.name}
                />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align={isMobile ? "center" : "end"}
            sideOffset={4}
          >
            <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// ---- Sidebar Export ----
export function AdminSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AdminHeader />
      </SidebarHeader>
      <SidebarContent>
        <AdminNavSection />
      </SidebarContent>
      <SidebarFooter>
        <AdminFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
