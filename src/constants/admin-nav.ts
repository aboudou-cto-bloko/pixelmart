// filepath: src/constants/admin-nav.ts

import {
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  Tag,
  Warehouse,
  ShoppingBag,
  Megaphone,
  Settings2,
  ScanLine,
  Bike,
  Globe,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type AdminRole =
  | "admin"
  | "finance"
  | "logistics"
  | "developer"
  | "marketing";

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  section?: string;
  /** Rôles autorisés — undefined = accessible à tous les rôles admin */
  roles?: AdminRole[];
}

export const ADMIN_NAV: AdminNavItem[] = [
  // ── Plateforme
  {
    title: "Vue d'ensemble",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    section: "Plateforme",
    // Tous les rôles admin
  },
  {
    title: "Boutiques",
    href: "/admin/stores",
    icon: Store,
    section: "Plateforme",
    roles: ["admin"],
  },
  {
    title: "Utilisateurs",
    href: "/admin/users",
    icon: Users,
    section: "Plateforme",
    roles: ["admin"],
  },
  {
    title: "Commandes",
    href: "/admin/orders",
    icon: ShoppingBag,
    section: "Plateforme",
    roles: ["admin"],
  },
  {
    title: "Catégories",
    href: "/admin/categories",
    icon: Tag,
    section: "Plateforme",
    roles: ["admin", "marketing"],
  },

  // ── Financier
  {
    title: "Retraits",
    href: "/admin/payouts",
    icon: CreditCard,
    section: "Financier",
    roles: ["admin", "finance"],
  },
  {
    title: "Rapports",
    href: "/admin/reports",
    icon: FileText,
    section: "Financier",
    roles: ["admin", "finance"],
  },

  // ── Contenus
  {
    title: "Publicités",
    href: "/admin/ads",
    icon: Megaphone,
    section: "Contenus",
    roles: ["admin", "marketing", "finance"],
  },

  // ── Entrepôt
  {
    title: "Stockage",
    href: "/admin/storage",
    icon: Warehouse,
    section: "Entrepôt",
    roles: ["admin", "finance", "logistics"],
  },
  {
    title: "Interface Agent",
    href: "/agent",
    icon: ScanLine,
    section: "Entrepôt",
    roles: ["admin"],
  },

  // ── Paramètres
  {
    title: "Configuration",
    href: "/admin/config",
    icon: Settings2,
    section: "Paramètres",
    roles: ["admin", "developer"],
  },
  {
    title: "Livraison",
    href: "/admin/delivery",
    icon: Bike,
    section: "Paramètres",
    roles: ["admin", "logistics"],
  },
  {
    title: "Pays & Devises",
    href: "/admin/countries",
    icon: Globe,
    section: "Paramètres",
    roles: ["admin", "logistics"],
  },
];
