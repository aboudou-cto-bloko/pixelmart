// filepath: src/components/layout/VendorSidebar.tsx

"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Store,
  ChevronRight,
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  ExternalLink,
  Plus,
  Check,
  Sparkles,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { authClient } from "@/lib/auth-client";
import type { Id } from "../../../convex/_generated/dataModel";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { VENDOR_NAV_MAIN, VENDOR_NAV_SETTINGS } from "@/constants/vendor-nav";
import type { NavItem } from "@/constants/vendor-nav";

// Hook personnalisé pour détecter les écrans mobiles
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

// ---- Auto-close sidebar on mobile navigation ----
function useAutoCloseMobileSidebar() {
  const { setOpenMobile } = useSidebar();
  return setOpenMobile;
}

// ---- Store Switcher ----
function StoreSwitcher() {
  const stores = useQuery(api.stores.queries.listMyStores, {});
  const switchStore = useMutation(api.stores.mutations.switchActiveStore);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const activeStore = stores?.find((s) => s.isActive) ?? stores?.[0];

  const handleSwitch = async (storeId: Id<"stores">) => {
    if (activeStore?._id === storeId) return;
    await switchStore({ store_id: storeId });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <Store className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="truncate font-semibold">
                  {activeStore?.name ?? "Ma boutique"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Vendeur
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Mes boutiques
            </DropdownMenuLabel>
            {stores?.map((store) => (
              <DropdownMenuItem
                key={store._id}
                onClick={() => handleSwitch(store._id)}
                className="gap-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm bg-muted shrink-0">
                  <Store className="size-3.5" />
                </div>
                <span className="flex-1 truncate">{store.name}</span>
                {store.isActive && (
                  <Check className="size-4 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/vendor/store/new" prefetch={false} className="gap-2">
                <div className="flex size-6 items-center justify-center rounded-sm border border-dashed shrink-0">
                  <Plus className="size-3.5" />
                </div>
                <span>Créer une boutique</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// ---- Nav Section ----
function NavSection({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname();
  const closeMobileSidebar = useAutoCloseMobileSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            pathname === item.url ||
            item.items?.some((sub) => pathname === sub.url);

          if (item.items && item.items.length > 0) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.url}
                          >
                            <Link
                              href={subItem.url}
                              prefetch={false}
                              onClick={() => closeMobileSidebar(false)}
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={pathname === item.url}
              >
                <Link href={item.url} prefetch={false} onClick={() => closeMobileSidebar(false)}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

// ---- Setup Progress ----
function SetupProgress() {
  const { progress, isVisible } = useOnboardingProgress();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  if (!isVisible || !progress || isCollapsed) return null;

  return (
    <Link
      href="/vendor/dashboard"
      className="mx-2 mb-1 flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 hover:bg-primary/10 transition-colors"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Sparkles className="size-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-none mb-1.5">
          Configuration
        </p>
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 leading-none">
          {progress.completedCount}/{progress.totalCount} étapes
        </p>
      </div>
    </Link>
  );
}

// ---- User Footer ----
function UserFooter() {
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
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
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
              <DropdownMenuItem asChild>
                <Link href="/vendor/settings" prefetch={false}>
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Compte
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// ---- Sidebar Export ----
export function VendorSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <StoreSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavSection label="Gestion" items={VENDOR_NAV_MAIN} />
        <NavSection label="Configuration" items={VENDOR_NAV_SETTINGS} />
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Voir ma boutique">
                <Link href="/" target="_blank">
                  <ExternalLink className="size-4" />
                  <span>Accueil</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SetupProgress />
        <UserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
