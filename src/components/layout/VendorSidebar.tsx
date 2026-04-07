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
                <Link
                  href={item.url}
                  prefetch={false}
                  onClick={() => closeMobileSidebar(false)}
                >
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
        <p className="text-xs font-medium leading-none mb-1.5">Configuration</p>
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

// ---- WhatsApp Community ----
function WhatsAppCommunity() {
  const { state } = useSidebar();
  if (state === "collapsed") return null;

  return (
    <a
      href="https://chat.whatsapp.com/ITOjPZs5LoL57rpRofhHJ8?mode=gi_t"
      target="_blank"
      rel="noopener noreferrer"
      className="mx-2 mb-1 flex items-center gap-2.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 px-3 py-2.5 hover:bg-[#25D366]/20 transition-colors group"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#25D366]/20">
        <svg
          viewBox="0 0 24 24"
          className="size-3.5 fill-[#25D366]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#128C7E] dark:text-[#25D366] leading-none mb-0.5">
          Groupe vendeurs
        </p>
        <p className="text-[10px] text-muted-foreground leading-none truncate">
          Rejoindre la communauté
        </p>
      </div>
    </a>
  );
}

// ---- Sidebar Export ----
export function VendorSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const isAffiliate = useQuery(
    api.affiliate.queries.isEnrolledInAffiliateProgram,
  );

  // Masquer "Parrainage" si la boutique n'est pas inscrite au programme
  const navItems = VENDOR_NAV_MAIN.filter(
    (item) => item.url !== "/vendor/parrainage" || isAffiliate === true,
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <StoreSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavSection label="Gestion" items={navItems} />
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
        <WhatsAppCommunity />
        <UserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
