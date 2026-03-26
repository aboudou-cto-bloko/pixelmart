"use client";

// filepath: src/app/shop/[storeSlug]/products/[slug]/page.tsx

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import Link from "next/link";
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  ShieldCheck,
  Star,
  Check,
  Package,
} from "lucide-react";
import { api } from "../../../../../../convex/_generated/api";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductReviewList } from "@/components/reviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { SHOP_ROUTES } from "@/constants/routes";
import { useShopCart } from "@/components/vendor-shop/providers";
import { useMetaPixel } from "@/components/vendor-shop/providers";
import type { Id } from "../../../../../../convex/_generated/dataModel";

// ─── Quantity Selector ────────────────────────────────────────

function QuantitySelector({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (qty: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium">Quantité</span>
      <div className="flex items-center border rounded-md">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-r-none"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
        >
          <Minus className="size-3.5" />
        </Button>
        <span className="w-10 text-center text-sm font-medium">{value}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-l-none"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function ShopProductDetailPage() {
  const { storeSlug, slug } = useParams<{
    storeSlug: string;
    slug: string;
  }>();
  const router = useRouter();
  const { addItem } = useShopCart();
  const { trackEvent, generateEventId } = useMetaPixel();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const product = useQuery(api.products.queries.getBySlug, { slug });
  const store = useQuery(api.stores.queries.getBySlug, { slug: storeSlug });

  // Track ViewContent quand le produit est chargé
  useEffect(() => {
    if (!product) return;
    const eventId = generateEventId();
    trackEvent(
      "ViewContent",
      {
        content_ids: [product._id],
        content_type: "product",
        value: product.price / 100,
        currency: store?.currency ?? "XOF",
      },
      eventId,
    );
  }, [product?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddToCart = useCallback(async () => {
    if (!product || !store || isAdding) return;

    setIsAdding(true);
    const eventId = generateEventId();

    try {
      await addItem({
        productId: product._id as Id<"products">,
        title: product.title,
        variantTitle: undefined,
        slug: product.slug,
        image: product.images?.[0] ?? "",
        price: product.price,
        comparePrice: product.compare_price,
        storeId: store._id,
        storeName: store.name,
        storeSlug: store.slug,
        quantity,
        maxQuantity: product.quantity ?? 99,
        isDigital: product.is_digital,
      });

      // Track AddToCart
      trackEvent(
        "AddToCart",
        {
          content_ids: [product._id],
          content_type: "product",
          value: (product.price * quantity) / 100,
          currency: store.currency ?? "XOF",
          num_items: quantity,
        },
        eventId,
      );

      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      // TODO: Show user-friendly error message
    } finally {
      setIsAdding(false);
    }
  }, [
    product,
    store,
    quantity,
    addItem,
    trackEvent,
    generateEventId,
    isAdding,
  ]);

  const handleBuyNow = useCallback(async () => {
    try {
      await handleAddToCart();
      router.push(SHOP_ROUTES.CART(storeSlug));
    } catch (error) {
      // Error already handled in handleAddToCart
    }
  }, [handleAddToCart, router, storeSlug]);

  if (product === undefined) {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <Package className="size-12 mx-auto text-muted-foreground/40 mb-4" />
        <h1 className="text-xl font-semibold mb-2">Produit introuvable</h1>
        <Button asChild>
          <Link href={SHOP_ROUTES.PRODUCTS(storeSlug)}>
            Voir tous les produits
          </Link>
        </Button>
      </div>
    );
  }

  const hasDiscount =
    product.compare_price !== undefined &&
    product.compare_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compare_price! - product.price) / product.compare_price!) *
          100,
      )
    : 0;
  const isOutOfStock =
    !product.is_digital &&
    product.quantity !== undefined &&
    product.quantity <= 0;
  const currency = store?.currency ?? "XOF";

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href={SHOP_ROUTES.HOME(storeSlug)}
          className="hover:text-foreground transition-colors"
        >
          Accueil
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={SHOP_ROUTES.PRODUCTS(storeSlug)}
          className="hover:text-foreground transition-colors"
        >
          Produits
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium line-clamp-1">
          {product.title}
        </span>
      </nav>

      {/* Main product area */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Gallery */}
        <ProductGallery images={product.images ?? []} title={product.title} />

        {/* Info */}
        <div className="space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {hasDiscount && (
              <Badge className="bg-red-500 text-white">
                -{discountPercent}%
              </Badge>
            )}
            {product.is_digital && (
              <Badge variant="secondary">Produit digital</Badge>
            )}
            {isOutOfStock && <Badge variant="outline">Rupture de stock</Badge>}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold leading-tight">{product.title}</h1>

          {/* Rating */}
          {product.avg_rating !== undefined && product.avg_rating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${
                      i < Math.round(product.avg_rating ?? 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.review_count ?? 0} avis)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="space-y-1">
            <div
              className="text-3xl font-bold"
              style={{ color: "var(--shop-primary, #6366f1)" }}
            >
              {formatPrice(product.price, currency)}
            </div>
            {hasDiscount && (
              <div className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_price!, currency)}
              </div>
            )}
          </div>

          <Separator />

          {/* Description */}
          {product.description && (
            <p className="text-muted-foreground leading-relaxed text-sm">
              {product.description}
            </p>
          )}

          {/* Quantity + Actions */}
          {!isOutOfStock && (
            <div className="space-y-4">
              {!product.is_digital && (
                <QuantitySelector
                  value={quantity}
                  max={product.quantity ?? 99}
                  onChange={setQuantity}
                />
              )}
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={handleAddToCart}
                  variant="outline"
                  disabled={added || isAdding}
                >
                  {added ? (
                    <>
                      <Check className="size-4 mr-2" />
                      Ajouté
                    </>
                  ) : isAdding ? (
                    "Ajout..."
                  ) : (
                    <>
                      <ShoppingCart className="size-4 mr-2" />
                      Ajouter au panier
                    </>
                  )}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleBuyNow}
                  disabled={isAdding}
                  style={{ backgroundColor: "var(--shop-primary, #6366f1)" }}
                >
                  {isAdding ? "Ajout..." : "Commander"}
                </Button>
              </div>
            </div>
          )}

          {isOutOfStock && (
            <p className="text-muted-foreground text-sm">
              Ce produit n'est temporairement plus disponible.
            </p>
          )}

          {/* Trust signals */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-green-500" />
            Paiement sécurisé · Boutique vérifiée
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Avis clients</h2>
        <ProductReviewList productId={product._id as Id<"products">} />
      </div>
    </div>
  );
}
