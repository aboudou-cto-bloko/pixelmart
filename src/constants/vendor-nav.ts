// filepath: src/constants/vendor-nav.ts

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  Store,
  Truck,
  Settings,
  BarChart3,
  Bell,
  Megaphone,
  Archive,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "./routes";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: { title: string; url: string }[];
}

export const VENDOR_NAV_MAIN: NavItem[] = [
  {
    title: "Tableau de bord",
    url: ROUTES.VENDOR_DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    title: "Produits",
    url: ROUTES.VENDOR_PRODUCTS,
    icon: Package,
    isActive: true,
    items: [
      { title: "Tous les produits", url: ROUTES.VENDOR_PRODUCTS },
      { title: "Ajouter un produit", url: ROUTES.VENDOR_PRODUCTS_NEW },
    ],
  },
  {
    title: "Commandes",
    url: ROUTES.VENDOR_ORDERS,
    icon: ShoppingCart,
  },
  {
    title: "Livraisons",
    url: "/vendor/delivery",
    icon: Truck,
  },
  {
    title: "Analytiques",
    url: ROUTES.VENDOR_ANALYTICS,
    icon: BarChart3,
  },
  {
    title: "Publicités",
    url: "/vendor/ads",
    icon: Megaphone,
  },
  {
    title: "Finance",
    url: ROUTES.VENDOR_FINANCE,
    icon: Wallet,
    items: [
      { title: "Solde & transactions", url: ROUTES.VENDOR_FINANCE },
      { title: "Factures", url: ROUTES.VENDOR_FINANCE_INVOICES },
      { title: "Demander un paiement", url: ROUTES.VENDOR_PAYOUTS },
    ],
  },
  {
    title: "Boutique",
    url: ROUTES.VENDOR_STORE_SETTINGS,
    icon: Store,
    items: [
      { title: "Paramètres", url: "/vendor/store/settings" },
      { title: "Avis", url: "/vendor/reviews" },
      { title: "Thème", url: "/vendor/store/theme" },
      { title: "Meta Pixel & Boutique", url: "/vendor/store/meta" },
    ],
  },
  {
    title: "Codes promo",
    url: ROUTES.VENDOR_COUPONS,
    icon: Tag,
  },
  {
    title: "Stockage",
    url: ROUTES.VENDOR_STORAGE,
    icon: Archive,
    items: [
      { title: "Mes stocks", url: ROUTES.VENDOR_STORAGE },
      { title: "Facturation stockage", url: ROUTES.VENDOR_BILLING },
    ],
  },
  {
    title: "Notifications",
    url: "/vendor/notifications",
    icon: Bell,
  },
  /*  {
    title: "Messages",
    url: "/vendor/messages",
    icon: MessageSquare,
  },
  {
    title: "Avis",
    url: "/vendor/reviews",
    icon: Star,
  },*/
];

export const VENDOR_NAV_SETTINGS: NavItem[] = [
  {
    title: "Paramètres",
    url: ROUTES.VENDOR_SETTINGS,
    icon: Settings,
    items: [{ title: "Compte", url: ROUTES.VENDOR_SETTINGS }],
  },
];
