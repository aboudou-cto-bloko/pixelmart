// filepath: src/app/(storefront)/cart/page.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  Store,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import type { CartItem, CartStore } from "@/types/cart";

// ─── Cart Item Row ───────────────────────────────────────────
function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (qty: number) => void;
  onRemove: () => void;
}) {
  const lineTotal = item.price * item.quantity;

  return (
    <div className="flex gap-3 py-4">
      {/* Image */}
      <Link
        href={ROUTES.PRODUCT(item.slug)}
        className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted"
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            N/A
          </div>
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={ROUTES.PRODUCT(item.slug)}
          className="text-sm font-medium hover:text-primary transition-colors line-clamp-2"
        >
          {item.title}
        </Link>
        {item.variantTitle && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.variantTitle}
          </p>
        )}
        {item.isDigital && (
          <Badge variant="secondary" className="text-[10px] mt-1">
            Digital
          </Badge>
        )}
        <p className="text-sm font-semibold text-primary mt-1">
          {formatPrice(item.price, "XOF")}
        </p>
      </div>

      {/* Quantity + Remove */}
      <div className="flex flex-col items-end justify-between shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">Supprimer</span>
        </Button>

        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onUpdateQuantity(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="size-3" />
          </Button>
          <span className="w-8 text-center text-xs font-medium">
            {item.quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onUpdateQuantity(item.quantity + 1)}
            disabled={item.quantity >= item.maxQuantity}
          >
            <Plus className="size-3" />
          </Button>
        </div>

        <p className="text-sm font-semibold">{formatPrice(lineTotal, "XOF")}</p>
      </div>
    </div>
  );
}

// ─── Store Group ─────────────────────────────────────────────
function StoreGroup({
  store,
  onUpdateQuantity,
  onRemove,
}: {
  store: CartStore;
  onUpdateQuantity: (cartItemId: string, qty: number) => void;
  onRemove: (cartItemId: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Store className="size-4 text-muted-foreground" />
          <Link
            href={ROUTES.STORE(store.storeSlug)}
            className="hover:text-primary transition-colors"
          >
            {store.storeName}
          </Link>
          <Badge variant="outline" className="text-xs ml-auto">
            {store.items.length} article{store.items.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {store.items.map((item) => (
            <CartItemRow
              key={item.cartItemId}
              item={item}
              onUpdateQuantity={(qty) => onUpdateQuantity(item.cartItemId, qty)}
              onRemove={() => onRemove(item.cartItemId)}
            />
          ))}
        </div>
        <Separator className="my-3" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sous-total boutique</span>
          <span className="font-semibold">
            {formatPrice(store.subtotal, "XOF")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty Cart ──────────────────────────────────────────────
function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ShoppingCart className="size-16 text-muted-foreground/30 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Votre panier est vide</h2>
      <p className="text-muted-foreground mb-6">
        Explorez notre catalogue et ajoutez des produits qui vous plaisent.
      </p>
      <Button asChild>
        <Link href={ROUTES.PRODUCTS}>
          Parcourir le catalogue
          <ArrowRight className="size-4 ml-2" />
        </Link>
      </Button>
    </div>
  );
}

// ─── Order Summary ───────────────────────────────────────────
function OrderSummary({
  totalItems,
  totalAmount,
  storeCount,
}: {
  totalItems: number;
  totalAmount: number;
  storeCount: number;
}) {
  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle className="text-base">Récapitulatif</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Articles ({totalItems})</span>
          <span>{formatPrice(totalAmount, "XOF")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Livraison</span>
          <span className="text-muted-foreground">Calculée au checkout</span>
        </div>
        {storeCount > 1 && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
            Votre panier contient des articles de {storeCount} boutiques
            différentes. Une commande sera créée par boutique.
          </p>
        )}
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>Total estimé</span>
          <span className="text-primary">
            {formatPrice(totalAmount, "XOF")}
          </span>
        </div>
        <Button className="w-full" size="lg" asChild>
          <Link href={ROUTES.CHECKOUT}>
            Commander
            <ArrowRight className="size-4 ml-2" />
          </Link>
        </Button>
        <Button variant="ghost" className="w-full text-sm" asChild>
          <Link href={ROUTES.PRODUCTS}>Continuer mes achats</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────
export default function CartPage() {
  const {
    stores,
    totalItems,
    totalAmount,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  if (totalItems === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-8">Panier</h1>
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1>
          Panier{" "}
          <span className="text-muted-foreground font-normal text-2xl">
            ({totalItems})
          </span>
        </h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={clearCart}
        >
          <Trash2 className="size-4 mr-2" />
          Vider le panier
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Items grouped by store */}
        <div className="lg:col-span-2 space-y-6">
          {stores.map((store) => (
            <StoreGroup
              key={store.storeId}
              store={store}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>

        {/* Order summary */}
        <div>
          <OrderSummary
            totalItems={totalItems}
            totalAmount={totalAmount}
            storeCount={stores.length}
          />
        </div>
      </div>
    </div>
  );
}
