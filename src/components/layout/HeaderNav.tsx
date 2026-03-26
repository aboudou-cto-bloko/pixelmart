// filepath: src/components/storefront/organisms/HeaderNav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  ChevronDown,
  Heart,
  Package,
  LogOut,
  Store,
  LayoutDashboard,
  LogIn,
} from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCart } from "@/hooks/useCart";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/constants/routes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MobileCategoryAccordion } from "@/components/ui/mobile-category-accordion";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Type attendu pour l'arbre des catégories
type CategoryNode = {
  _id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
};

export function HeaderNav() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const { totalItems } = useCart();
  const categoryTree = useQuery(api.categories.queries.getTree) as
    | CategoryNode[]
    | undefined;
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = categoryTree ?? [];

  // Catégories visibles directement dans la barre de navigation (max 5)
  const visibleCategories = categories.slice(0, 5);
  const extraCategories = categories.slice(5);

  function getUserInitials(): string {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  async function handleSignOut() {
    await authClient.signOut();
    // Optionnel : rediriger vers la page d'accueil
    router.push(ROUTES.HOME);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `${ROUTES.PRODUCTS}?q=${encodeURIComponent(searchQuery.trim())}`,
      );
      setMobileMenuOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-0 px-4">
        {/* Mobile menu trigger */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-80 p-0 pr-0 flex flex-col bg-sidebar text-sidebar-foreground"
            preventFocusOnOpen
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Recherche mobile */}
              <form onSubmit={handleSearch} className="flex">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="rounded-r-none bg-background"
                  autoComplete="off"
                />
                <Button type="submit" size="icon" className="rounded-l-none">
                  <Search className="size-4" />
                </Button>
              </form>
              <MobileCategoryAccordion
                categories={categories}
                onClose={() => setMobileMenuOpen(false)}
              />
              <div className="pt-2 px-3 border-t border-sidebar-border">
                <Link
                  href={ROUTES.STORES}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  Boutiques
                </Link>
              </div>
              {!isAuthenticated && (
                <div className="pt-3 border-t border-sidebar-border">
                  <Link
                    href={ROUTES.LOGIN}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <LogIn className="size-4" />
                    Se connecter
                  </Link>
                </div>
              )}
              {/* Fixed bottom */}
              <div className="mt-auto py-6 px-2 border-t border-sidebar-border">
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm text-sidebar-foreground/50 hover:text-sidebar-accent-foreground transition-colors"
                >
                  Contactez-nous
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href={ROUTES.HOME} className="shrink-0">
          <img src="/Pixel-Mart.png" alt="Pixel-Mart" className="h-34 w-auto" />
        </Link>

        {/* Search Desktop */}
        <form
          onSubmit={handleSearch}
          className="hidden lg:flex flex-1 max-w-md mx-4"
        >
          <div className="relative flex w-full">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit, une boutique..."
              className="rounded-r-none pr-10"
            />
            <Button type="submit" size="icon" className="rounded-l-none">
              <Search className="size-4" />
            </Button>
          </div>
        </form>

        {/* Desktop Navigation avec mega menu */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="gap-4">
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/about"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  À propos
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/contact"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Contact
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href={ROUTES.STORES}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Boutiques
                  <Badge variant="secondary" className="text-[10px]">
                    New
                  </Badge>
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right section */}
        <div className="ml-auto flex items-center gap-2">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Cart */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href={ROUTES.CART}>
              <ShoppingCart className="size-5" />
              <span className="sr-only">Panier</span>
              {totalItems > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-[10px]"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </Badge>
              )}
            </Link>
          </Button>

          {/* User menu */}
          {isLoading ? (
            <Skeleton className="size-9 rounded-full" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium truncate">
                    {user?.name ?? "Utilisateur"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.CUSTOMER_ORDERS}>
                    <Package className="size-4 mr-2" />
                    Mes commandes
                  </Link>
                </DropdownMenuItem>
                {user?.role === "vendor" && (
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.VENDOR_DASHBOARD}>
                      <LayoutDashboard className="size-4 mr-2" />
                      Dashboard vendeur
                    </Link>
                  </DropdownMenuItem>
                )}
                {user?.role === "customer" && (
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.ONBOARDING_VENDOR}>
                      <Store className="size-4 mr-2" />
                      Devenir vendeur
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.LOGIN}>Se connecter</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={ROUTES.REGISTER}>S&apos;inscrire</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
