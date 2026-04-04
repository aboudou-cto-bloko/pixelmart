"use client";

// filepath: src/app/shop/[storeSlug]/cart/page.tsx

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useShopCart } from "@/components/vendor-shop/providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { SHOP_ROUTES } from "@/constants/routes";

function ValidationWarnings({
  warnings,
  hasChanges,
  onRefresh,
  isValidating,
}: {
  warnings: string[];
  hasChanges: boolean;
  onRefresh: () => void;
  isValidating: boolean;
}) {
  if (warnings.length === 0 && !hasChanges) return null;

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-yellow-800 mb-2">
              {hasChanges ? "Votre panier a été mis à jour" : "Attention"}
            </h3>
            {warnings.length > 0 && (
              <ul className="text-sm text-yellow-700 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            )}
            {hasChanges && (
              <p className="text-sm text-yellow-700 mt-2">
                Les prix ou stocks de certains articles ont changé. Veuillez
                vérifier votre commande.
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isValidating}
              className="mt-3 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Validation...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Revalider le panier
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ShopCartPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const router = useRouter();
  const {
    items,
    totalItems,
    totalAmount,
    updateQuantity,
    removeItem,
    syncWithServer,
  } = useShopCart();

  const [isValidating, setIsValidating] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (totalItems > 0) {
      handleValidateCart();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleValidateCart() {
    setIsValidating(true);
    setValidationWarnings([]);
    try {
      const result = await syncWithServer();
      if (result.errors.length > 0) setValidationWarnings(result.errors);
      setHasChanges(result.hasChanges);
    } catch {
      setValidationWarnings(["Erreur lors de la validation du panier"]);
    } finally {
      setIsValidating(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <ShoppingCart className="size-16 mx-auto text-muted-foreground/30 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Votre panier est vide</h1>
        <p className="text-muted-foreground mb-8">
          Découvrez nos produits et ajoutez-les à votre panier.
        </p>
        <Button
          asChild
          style={{ backgroundColor: "var(--shop-primary, #6366f1)" }}
        >
          <Link href={SHOP_ROUTES.PRODUCTS(storeSlug)}>Voir les produits</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={SHOP_ROUTES.PRODUCTS(storeSlug)}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">
          Panier ({totalItems} article{totalItems !== 1 ? "s" : ""})
        </h1>
      </div>

      {/* Validation warnings */}
      <ValidationWarnings
        warnings={validationWarnings}
        hasChanges={hasChanges}
        onRefresh={handleValidateCart}
        isValidating={isValidating}
      />

      {/* Items */}
      <Card>
        <CardContent className="p-0 divide-y">
          {items.map((item) => (
            <div key={item.cartItemId} className="flex items-center gap-4 p-4">
              {/* Image */}
              <div className="relative size-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground">
                    N/A
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={SHOP_ROUTES.PRODUCT(storeSlug, item.slug)}
                  className="text-sm font-medium line-clamp-2 hover:underline"
                >
                  {item.title}
                </Link>
                {item.variantTitle && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.variantTitle}
                  </p>
                )}
                <p className="text-sm font-semibold mt-1">
                  {formatPrice(item.price, "XOF")}
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-r-none"
                    onClick={() =>
                      updateQuantity(item.cartItemId, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="size-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-l-none"
                    onClick={() =>
                      updateQuantity(item.cartItemId, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.maxQuantity}
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    removeItem(item.cartItemId);
                    toast.info(`"${item.title}" retiré du panier`);
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>

              {/* Line total */}
              <div className="text-sm font-semibold shrink-0 min-w-[70px] text-right">
                {formatPrice(item.price * item.quantity, "XOF")}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Sous-total ({totalItems} article{totalItems !== 1 ? "s" : ""})
            </span>
            <span>{formatPrice(totalAmount, "XOF")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Livraison</span>
            <span className="text-muted-foreground">Calculée au checkout</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total estimé</span>
            <span style={{ color: "var(--shop-primary, #6366f1)" }}>
              {formatPrice(totalAmount, "XOF")}
            </span>
          </div>
          <Button
            className="w-full mt-2"
            size="lg"
            onClick={() => router.push(SHOP_ROUTES.CHECKOUT(storeSlug))}
            style={{ backgroundColor: "var(--shop-primary, #6366f1)" }}
          >
            Passer la commande
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href={SHOP_ROUTES.PRODUCTS(storeSlug)}>
              Continuer mes achats
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
