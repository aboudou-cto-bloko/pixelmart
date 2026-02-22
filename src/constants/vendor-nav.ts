import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  Store,
  MessageSquare,
  Star,
  Settings,
  type LucideIcon,
} from "lucide-react";

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
    url: "/vendor/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Produits",
    url: "/vendor/products",
    icon: Package,
    isActive: true,
    items: [
      { title: "Tous les produits", url: "/vendor/products" },
      { title: "Ajouter un produit", url: "/vendor/products/new" },
    ],
  },
  {
    title: "Commandes",
    url: "/vendor/orders",
    icon: ShoppingCart,
  },
  {
    title: "Finance",
    url: "/vendor/finance",
    icon: Wallet,
    items: [
      { title: "Solde & transactions", url: "/vendor/finance" },
      { title: "Demander un paiement", url: "/vendor/payouts" },
    ],
  },
  {
    title: "Boutique",
    url: "/vendor/store/settings",
    icon: Store,
    items: [{ title: "Paramètres", url: "/vendor/store/settings" }],
  },
  {
    title: "Messages",
    url: "/vendor/messages",
    icon: MessageSquare,
  },
  {
    title: "Avis",
    url: "/vendor/reviews",
    icon: Star,
  },
];

export const VENDOR_NAV_SETTINGS: NavItem[] = [
  {
    title: "Paramètres",
    url: "/vendor/settings",
    icon: Settings,
    items: [
      { title: "Compte", url: "/vendor/settings" },
      { title: "Sécurité", url: "/vendor/settings/security" },
    ],
  },
];
