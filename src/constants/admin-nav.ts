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
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  section?: string;
}

export const ADMIN_NAV: AdminNavItem[] = [
  // ── Plateforme
  { title: "Vue d'ensemble", href: "/admin/dashboard", icon: LayoutDashboard, section: "Plateforme" },
  { title: "Boutiques", href: "/admin/stores", icon: Store, section: "Plateforme" },
  { title: "Utilisateurs", href: "/admin/users", icon: Users, section: "Plateforme" },
  { title: "Commandes", href: "/admin/orders", icon: ShoppingBag, section: "Plateforme" },
  { title: "Catégories", href: "/admin/categories", icon: Tag, section: "Plateforme" },

  // ── Financier
  { title: "Retraits", href: "/admin/payouts", icon: CreditCard, section: "Financier" },

  // ── Contenus
  { title: "Publicités", href: "/admin/ads", icon: Megaphone, section: "Contenus" },

  // ── Entrepôt
  { title: "Stockage", href: "/admin/storage", icon: Warehouse, section: "Entrepôt" },
  { title: "Interface Agent", href: "/agent", icon: ScanLine, section: "Entrepôt" },

  // ── Paramètres
  { title: "Configuration", href: "/admin/config", icon: Settings2, section: "Paramètres" },
  { title: "Tarifs livraison", href: "/admin/delivery", icon: Bike, section: "Paramètres" },
  { title: "Pays & Devises", href: "/admin/countries", icon: Globe, section: "Paramètres" },
];
