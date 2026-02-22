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

const BREADCRUMB_MAP: Record<string, { parent?: string; label: string }> = {
  "/vendor/dashboard": { label: "Tableau de bord" },
  "/vendor/products": { parent: "Produits", label: "Tous les produits" },
  "/vendor/products/new": { parent: "Produits", label: "Nouveau produit" },
  "/vendor/orders": { label: "Commandes" },
  "/vendor/finance": { label: "Finance" },
  "/vendor/store/settings": { label: "Paramètres boutique" },
  "/vendor/messages": { label: "Messages" },
  "/vendor/reviews": { label: "Avis" },
  "/vendor/settings": { label: "Paramètres compte" },
  "/vendor/settings/security": {
    parent: "Paramètres",
    label: "Sécurité",
  },
};

function VendorBreadcrumb() {
  const pathname = usePathname();

  // Gérer les routes dynamiques /vendor/products/[id]/edit
  let breadcrumb = BREADCRUMB_MAP[pathname];
  if (
    !breadcrumb &&
    pathname.includes("/products/") &&
    pathname.endsWith("/edit")
  ) {
    breadcrumb = { parent: "Produits", label: "Modifier le produit" };
  }

  if (!breadcrumb) {
    breadcrumb = { label: "Dashboard" };
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumb.parent && (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/vendor/products">
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
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <VendorBreadcrumb />
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
