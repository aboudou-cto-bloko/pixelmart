// filepath: src/app/shop/[storeSlug]/products/[slug]/ShopProductPageClient.tsx

"use client";

import { useState, useEffect } from "react";
import { useQuery, usePreloadedQuery } from "convex/react";
import type { Preloaded } from "convex/react";
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
  RotateCcw,
  Truck,
  Share2,
  BadgeCheck,
} from "lucide-react";
import { api } from "../../../../../../convex/_generated/api";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductReviewList } from "@/components/reviews";
import { ProductQASection } from "@/components/questions";
import { QuickOrderSheet } from "@/components/vendor-shop/organisms/QuickOrderSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { SHOP_ROUTES } from "@/constants/routes";
import { useMetaPixel } from "@/components/vendor-shop/providers";
import type { Id } from "../../../../../../convex/_generated/dataModel";

// ─── Sub-components ───────────────────────────────────────────

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
      <span className="text-sm font-medium text-muted-foreground">Quantité</span>
      <div className="flex items-center border rounded-lg overflow-hidden">
        <button
          type="button"
          className="h-10 w-10 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-12 text-center text-sm font-semibold border-x">{value}</span>
        <button
          type="button"
          className="h-10 w-10 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const halfFilled = !filled && i < rating;
          return (
            <Star
              key={i}
              className={`size-4 ${
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : halfFilled
                    ? "fill-yellow-200 text-yellow-400"
                    : "text-muted-foreground/30"
              }`}
            />
          );
        })}
      </div>
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">({count} avis)</span>
    </div>
  );
}

function TrustBadge({
  icon: Icon,
  label,
  color,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center min-w-0">
      <div className={`size-9 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="size-4" />
      </div>
      <span className="text-xs text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────

interface Props {
  preloadedProduct: Preloaded<typeof api.products.queries.getBySlug>;
  preloadedStore: Preloaded<typeof api.stores.queries.getBySlug>;
  storeSlug: string;
  slug: string;
}

export function ShopProductPageClient({
  preloadedProduct,
  preloadedStore,
  storeSlug,
}: Props) {
  const { trackEvent, generateEventId } = useMetaPixel();

  const [quantity, setQuantity] = useState(1);
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);

  // Hydrate from server-preloaded data (no loading flash)
  const product = usePreloadedQuery(preloadedProduct);
  const store = usePreloadedQuery(preloadedStore);

  // specs depends on product._id — client-side only
  const specs = useQuery(
    api.product_specs.queries.listByProduct,
    product ? { product_id: product._id } : "skip",
  );

  // Track ViewContent
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

  if (!product) {
    return (
      <div className="text-center py-24">
        <Package className="size-16 mx-auto text-muted-foreground/30 mb-4" />
        <h1 className="text-xl font-semibold mb-2">Produit introuvable</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Ce produit n&apos;est plus disponible ou a été retiré.
        </p>
        <Button asChild>
          <Link href={SHOP_ROUTES.PRODUCTS(storeSlug)}>Voir tous les produits</Link>
        </Button>
      </div>
    );
  }

  const hasDiscount =
    product.compare_price !== undefined && product.compare_price > product.price;
  const comparePrice = product.compare_price ?? 0;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - product.price) / comparePrice) * 100)
    : 0;
  const isOutOfStock =
    !product.is_digital && product.quantity !== undefined && product.quantity <= 0;
  const currency = store?.currency ?? "XOF";
  const maxQty = product.is_digital ? 99 : (product.quantity ?? 99);

  return (
    <>
      <div className="space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
          <Link
            href={SHOP_ROUTES.HOME(storeSlug)}
            className="hover:text-foreground transition-colors"
          >
            Accueil
          </Link>
          <ChevronRight className="size-3.5 shrink-0" />
          <Link
            href={SHOP_ROUTES.PRODUCTS(storeSlug)}
            className="hover:text-foreground transition-colors"
          >
            Produits
          </Link>
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="text-foreground font-medium line-clamp-1 max-w-[200px]">
            {product.title}
          </span>
        </nav>

        {/* Main grid */}
        <div className="grid gap-8 lg:gap-12 md:grid-cols-2">
          {/* Gallery — sticky on desktop */}
          <div className="md:sticky md:top-6 md:self-start">
            <ProductGallery
              images={product.images ?? []}
              title={product.title}
              imageRoles={product.image_roles}
            />
          </div>

          {/* Info panel */}
          <div className="space-y-6">
            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              {hasDiscount && (
                <Badge className="bg-red-500 hover:bg-red-500 text-white font-semibold">
                  -{discountPercent}%
                </Badge>
              )}
              {product.is_digital && (
                <Badge variant="secondary" className="gap-1">
                  <BadgeCheck className="size-3" />
                  Produit digital
                </Badge>
              )}
              {isOutOfStock && (
                <Badge variant="outline" className="text-muted-foreground">
                  Rupture de stock
                </Badge>
              )}
              {!isOutOfStock && !product.is_digital && (maxQty ?? 99) <= 5 && (
                <Badge className="bg-orange-500 hover:bg-orange-500 text-white animate-pulse">
                  Plus que {maxQty} !
                </Badge>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight">
                {product.title}
              </h1>
              {product.short_description && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {product.short_description}
                </p>
              )}
            </div>

            {/* Rating */}
            {product.avg_rating !== undefined && product.avg_rating > 0 && (
              <StarRating
                rating={product.avg_rating}
                count={product.review_count ?? 0}
              />
            )}

            {/* Price block */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span
                  className="text-3xl font-extrabold"
                  style={{ color: "var(--shop-primary, #6366f1)" }}
                >
                  {formatPrice(product.price, currency)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(comparePrice, currency)}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <p className="text-sm text-green-600 font-medium">
                  Vous économisez {formatPrice(comparePrice - product.price, currency)}
                </p>
              )}
            </div>

            <Separator />

            {/* Buy section */}
            {!isOutOfStock ? (
              <div className="space-y-4">
                {!product.is_digital && (
                  <QuantitySelector value={quantity} max={maxQty} onChange={setQuantity} />
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="flex-1 h-12 text-base font-semibold gap-2"
                    onClick={() => setQuickOrderOpen(true)}
                    style={{ backgroundColor: "var(--shop-primary, #6366f1)" }}
                  >
                    <ShoppingCart className="size-5" />
                    Commander
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="sm:w-12 h-12"
                    title="Partager"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: product.title, url: window.location.href });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                      }
                    }}
                  >
                    <Share2 className="size-5" />
                    <span className="sm:hidden ml-2">Partager</span>
                  </Button>
                </div>
                {!product.is_digital && maxQty <= 10 && maxQty > 0 && (
                  <p className="flex items-center gap-1.5 text-sm text-orange-600 font-medium">
                    <span className="inline-block size-2 rounded-full bg-orange-500 animate-pulse" />
                    Plus que {maxQty} unité{maxQty > 1 ? "s" : ""} disponible
                    {maxQty > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-muted p-6 text-center space-y-3">
                <Package className="size-8 mx-auto text-muted-foreground/40" />
                <div>
                  <p className="font-semibold">Rupture de stock</p>
                  <p className="text-sm text-muted-foreground">
                    Ce produit est temporairement indisponible.
                  </p>
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 py-1">
              <TrustBadge
                icon={ShieldCheck}
                label="Paiement sécurisé"
                color="bg-green-50 text-green-600"
              />
              <TrustBadge
                icon={Truck}
                label="Livraison rapide"
                color="bg-blue-50 text-blue-600"
              />
              <TrustBadge
                icon={RotateCcw}
                label="Retours 3 jours"
                color="bg-purple-50 text-purple-600"
              />
            </div>

            {/* Key points from tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="rounded-xl bg-muted/30 border p-4 space-y-3">
                <h3 className="text-sm font-semibold">Points clés</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {product.tags.slice(0, 8).map((tag) => (
                    <li key={tag} className="flex items-start gap-2 text-sm">
                      <Check className="size-4 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground capitalize">
                        {tag.toLowerCase()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3">Description</h3>
                  <div
                    className="prose prose-sm max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-li:text-muted-foreground prose-p:text-muted-foreground prose-p:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              </>
            )}

            {/* Tags as badges */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Specs table */}
            {(product.weight ||
              product.color ||
              product.material ||
              product.dimensions ||
              product.sku ||
              (specs && specs.length > 0)) && (
              <div className="rounded-xl border overflow-hidden">
                <div className="bg-muted/60 px-4 py-3 border-b flex items-center gap-2">
                  <Package className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Caractéristiques</h3>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      product.color && { label: "Couleur", value: product.color },
                      product.material && { label: "Matériau", value: product.material },
                      product.weight && {
                        label: "Poids",
                        value:
                          product.weight >= 1000
                            ? `${(product.weight / 1000).toFixed(2).replace(/\.?0+$/, "")} kg`
                            : `${product.weight} g`,
                      },
                      product.dimensions && { label: "Dimensions", value: product.dimensions },
                      product.sku && { label: "Référence (SKU)", value: product.sku },
                      ...(specs ?? []).map((spec) => ({
                        label: spec.spec_key,
                        value: spec.spec_value,
                      })),
                    ]
                      .filter(Boolean)
                      .map((row, i) => {
                        if (!row) return null;
                        return (
                          <tr
                            key={row.label}
                            className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}
                          >
                            <td className="px-4 py-2.5 w-2/5 text-muted-foreground font-medium">
                              {row.label}
                            </td>
                            <td className="px-4 py-2.5 text-foreground">{row.value}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <ProductReviewList productId={product._id as Id<"products">} />

        <Separator />

        {/* Q&A */}
        <ProductQASection
          productId={product._id as Id<"products">}
          storeOwnerId={product.store?.owner_id as Id<"users"> | undefined}
        />
      </div>

      {/* Quick Order Sheet */}
      {store && !isOutOfStock && (
        <QuickOrderSheet
          open={quickOrderOpen}
          onOpenChange={setQuickOrderOpen}
          product={product}
          store={store}
          storeSlug={storeSlug}
          quantity={quantity}
        />
      )}
    </>
  );
}
