"use client";

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

// Fusionner tous les items de navigation (principaux + réglages)
const ALL_NAV_ITEMS = [...VENDOR_NAV_MAIN, ...VENDOR_NAV_SETTINGS];

// Fonction pour trouver un item de navigation à partir du pathname
function findNavItem(
  pathname: string,
): { parent?: string; label: string } | null {
  // 1. Recherche d'une correspondance exacte
  for (const item of ALL_NAV_ITEMS) {
    if (item.url === pathname) {
      return { label: item.title };
    }
    // Vérifier les sous-items
    if (item.items) {
      for (const subItem of item.items) {
        if (subItem.url === pathname) {
          return { parent: item.title, label: subItem.title };
        }
      }
    }
  }

  // 2. Gestion des routes dynamiques (ex: /vendor/products/[id]/edit)
  if (pathname.includes("/products/") && pathname.endsWith("/edit")) {
    return { parent: "Produits", label: "Modifier le produit" };
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
        {breadcrumb.parent && (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink
                href={`/vendor/${breadcrumb.parent.toLowerCase()}`}
              >
                {breadcrumb.parent}
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
              <div className="ml-auto">
                <NotificationDropdown notificationsPath="/vendor/notifications" />
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
