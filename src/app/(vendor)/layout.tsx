"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { VendorSidebar } from "@/components/layout/VendorSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { VENDOR_NAV_MAIN, VENDOR_NAV_SETTINGS } from "@/constants/vendor-nav";
import { NotificationDropdown } from "@/components/notifications/organisms/NotificationDropdown";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function StoreSuspendedScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Boutique suspendue</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Votre boutique a été suspendue par l&apos;administration. Contactez le
          support pour plus d&apos;informations.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={() => (window as typeof window & { Chatway?: (cmd: string) => void }).Chatway?.("open")}
        >
          Contacter le support
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}

function VendorStoreGuard({ children }: { children: React.ReactNode }) {
  const store = useQuery(api.stores.queries.getMyStore);

  // store === undefined → still loading, let it through
  if (store && store.status === "suspended") {
    return <StoreSuspendedScreen />;
  }

  return <>{children}</>;
}

// Fusionner tous les items de navigation (principaux + réglages)
const ALL_NAV_ITEMS = [...VENDOR_NAV_MAIN, ...VENDOR_NAV_SETTINGS];

// Fonction pour trouver un item de navigation à partir du pathname
function findNavItem(
  pathname: string,
): { parentLabel?: string; parentUrl?: string; label: string } | null {
  // 1. Recherche d'une correspondance exacte
  for (const item of ALL_NAV_ITEMS) {
    if (item.url === pathname) {
      return { label: item.title };
    }
    // Vérifier les sous-items
    if (item.items) {
      for (const subItem of item.items) {
        if (subItem.url === pathname) {
          return {
            parentLabel: item.title,
            parentUrl: item.url,
            label: subItem.title,
          };
        }
      }
    }
  }

  // 2. Gestion des routes dynamiques
  if (pathname.includes("/products/") && pathname.endsWith("/edit")) {
    return {
      parentLabel: "Produits",
      parentUrl: "/vendor/products",
      label: "Modifier le produit",
    };
  }
  if (pathname.match(/^\/vendor\/orders\/[^/]+$/)) {
    return {
      parentLabel: "Commandes",
      parentUrl: "/vendor/orders",
      label: "Détail commande",
    };
  }
  if (pathname.match(/^\/vendor\/delivery\/[^/]+$/)) {
    return {
      parentLabel: "Livraisons",
      parentUrl: "/vendor/delivery",
      label: "Détail livraison",
    };
  }
  if (pathname === "/vendor/store/new") {
    return {
      parentLabel: "Boutique",
      parentUrl: "/vendor/store/settings",
      label: "Nouvelle boutique",
    };
  }
  if (pathname === "/vendor/settings/security") {
    return {
      parentLabel: "Paramètres",
      parentUrl: "/vendor/settings",
      label: "Sécurité",
    };
  }

  // 3. Fallback (ne devrait pas arriver)
  return null;
}

function VendorBreadcrumb() {
  const pathname = usePathname();
  const breadcrumb = findNavItem(pathname) ?? { label: "Tableau de bord" };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumb.parentLabel && breadcrumb.parentUrl && (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href={breadcrumb.parentUrl}>
                {breadcrumb.parentLabel}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard roles={["vendor", "admin"]}>
      <VendorStoreGuard>
      <SidebarProvider>
        <VendorSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4 w-full">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <VendorBreadcrumb />
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <NotificationDropdown notificationsPath="/vendor/notifications" />
              </div>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
      </VendorStoreGuard>
    </AuthGuard>
  );
}
