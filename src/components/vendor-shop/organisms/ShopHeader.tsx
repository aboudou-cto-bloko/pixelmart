"use client";

// filepath: src/components/vendor-shop/organisms/ShopHeader.tsx

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, ShoppingCart, X } from "lucide-react";
import { useShopCart } from "../providers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface ShopHeaderProps {
  storeName: string;
  storeSlug: string;
  logoUrl: string | null;
}

const NAV_ITEMS = [
  { label: "Accueil", href: "" },
  { label: "Produits", href: "/products" },
];

export function ShopHeader({ storeName, storeSlug, logoUrl }: ShopHeaderProps) {
  const { totalItems } = useShopCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const basePath = `/shop/${storeSlug}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo + Store name */}
          <Link href={basePath} className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={storeName}
                width={40}
                height={40}
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                className="size-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: "var(--shop-primary, #6366f1)" }}
              >
                {storeName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-base truncate hidden sm:block">
              {storeName}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={`${basePath}${item.href}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Panier */}
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href={`${basePath}/cart`}>
                <ShoppingCart className="size-5" />
                {totalItems > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-[10px] text-white border-0"
                    style={{
                      backgroundColor: "var(--shop-primary, #6366f1)",
                    }}
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </Badge>
                )}
                <span className="sr-only">Panier ({totalItems})</span>
              </Link>
            </Button>

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="size-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  {/* Store identity in mobile */}
                  <div className="flex items-center gap-3 p-6 border-b">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt={storeName}
                        width={32}
                        height={32}
                        className="size-8 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="size-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{
                          backgroundColor: "var(--shop-primary, #6366f1)",
                        }}
                      >
                        {storeName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold">{storeName}</span>
                  </div>

                  {/* Nav items */}
                  <nav className="flex flex-col p-4 gap-1">
                    {NAV_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={`${basePath}${item.href}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                    <Link
                      href={`${basePath}/cart`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors mt-2 border"
                    >
                      <ShoppingCart className="size-4" />
                      Panier
                      {totalItems > 0 && (
                        <Badge className="ml-auto text-xs" variant="secondary">
                          {totalItems}
                        </Badge>
                      )}
                    </Link>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
