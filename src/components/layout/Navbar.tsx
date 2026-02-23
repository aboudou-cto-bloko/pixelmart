"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import {
  ShoppingCart,
  User,
  LogOut,
  LayoutDashboard,
  Store,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar } from "./SearchBar";
import { MobileNav } from "./MobileNav";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { authClient } from "@/lib/auth-client";
import { useCart } from "@/hooks/useCart";

export function Navbar() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const categoryTree = useQuery(api.categories.queries.getTree);
  const { totalItems } = useCart();

  const categories = categoryTree ?? [];

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
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        {/* Mobile nav */}
        <MobileNav categories={categories} />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 shrink-0">
          <span className="text-xl font-bold text-primary">Pixel</span>
          <span className="text-xl font-bold text-secondary">-Mart</span>
        </Link>

        {/* Desktop search */}
        <div className="hidden lg:flex flex-1 max-w-md mx-4">
          <SearchBar className="w-full" />
        </div>

        {/* Desktop categories */}
        <nav className="hidden lg:flex items-center gap-1">
          {categories.slice(0, 5).map((cat) => (
            <Link
              key={cat._id}
              href={ROUTES.CATEGORY(cat.slug)}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href={ROUTES.STORES}
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Boutiques
          </Link>
        </nav>

        {/* Right section */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href={ROUTES.CART}>
              <ShoppingCart className="size-5" />
              <span className="sr-only">Panier</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
          </Button>

          {/* Auth */}
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
              <DropdownMenuContent align="end" className="w-48">
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
                  <Link href={ROUTES.VENDOR_SETTINGS}>
                    <User className="size-4 mr-2" />
                    Mon profil
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
