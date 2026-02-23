"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight, LogIn, UserPlus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { SearchBar } from "./SearchBar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { authClient } from "@/lib/auth-client";

interface CategoryNode {
  _id: string;
  name: string;
  slug: string;
  children?: { _id: string; name: string; slug: string }[];
}

interface MobileNavProps {
  categories: CategoryNode[];
}

export function MobileNav({ categories }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated } = useCurrentUser();

  function close() {
    setOpen(false);
  }

  async function handleSignOut() {
    await authClient.signOut();
    close();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="text-left">
            <span className="text-primary font-bold">Pixel</span>
            <span className="font-bold">-Mart</span>
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-4">
          <SearchBar compact onSubmit={close} />
        </div>

        <Separator />

        {/* Categories */}
        <nav className="p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Catégories
          </p>
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/categories/${cat.slug}`}
              onClick={close}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              {cat.name}
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
          <Link
            href="/products"
            onClick={close}
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-accent transition-colors"
          >
            Voir tout le catalogue
          </Link>
        </nav>

        <Separator />

        {/* Stores */}
        <nav className="p-4">
          <Link
            href="/stores"
            onClick={close}
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
          >
            Découvrir les boutiques
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </nav>

        <Separator />

        {/* Auth */}
        <div className="p-4 space-y-2">
          {isAuthenticated ? (
            <>
              <p className="text-sm text-muted-foreground px-3">
                {user?.name ?? user?.email}
              </p>
              {user?.role === "vendor" && (
                <Link href="/vendor/dashboard" onClick={close}>
                  <Button variant="outline" className="w-full justify-start">
                    Dashboard vendeur
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="size-4 mr-2" />
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={close}>
                <Button variant="outline" className="w-full justify-start">
                  <LogIn className="size-4 mr-2" />
                  Connexion
                </Button>
              </Link>
              <Link href="/register" onClick={close}>
                <Button className="w-full justify-start">
                  <UserPlus className="size-4 mr-2" />
                  Créer un compte
                </Button>
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
