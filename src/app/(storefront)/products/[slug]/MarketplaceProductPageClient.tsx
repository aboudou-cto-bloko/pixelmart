// filepath: src/app/(storefront)/products/[slug]/MarketplaceProductPageClient.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, usePreloadedQuery } from "convex/react";
import type { Preloaded } from "convex/react";
import { useCart } from "@/hooks/useCart";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  ShieldCheck,
  Star,
  Truck,
  ShoppingCart,
  Minus,
  Plus,
  Store,
  Check,
  Package,
  Share2,
  BadgeCheck,
  RotateCcw,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductReviewList } from "@/components/reviews";
import { ProductQASection } from "@/components/questions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

// ─── Sub-components ──────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = rating >= star ? 1 : rating >= star - 0.5 ? 0.5 : 0;
          return (
            <span key={star} className="relative inline-block size-4">
              <Star className="size-4 text-muted-foreground/30 fill-muted-foreground/20" />
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star className="size-4 text-amber-400 fill-amber-400" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      {count !== undefined && count > 0 && (
        <span className="text-sm text-muted-foreground">({count} avis)</span>
      )}
    </div>
  );
}

interface TrustBadgeProps {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
}

function TrustBadge({ icon, label, sublabel }: TrustBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-1 text-center px-2">
      <div className="text-muted-foreground">{icon}</div>
      <p className="text-xs font-medium leading-tight">{label}</p>
      <p className="text-xs text-muted-foreground leading-tight">{sublabel}</p>
    </div>
  );
}

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
      <div className="flex items-center border rounded-lg overflow-hidden">
        <button
          type="button"
          className="size-9 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-10 text-center text-sm font-semibold">{value}</span>
        <button
          type="button"
          className="size-9 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {max <= 5 && max > 0 && (
        <span className="text-xs text-amber-600 font-medium">
          {max} disponible{max !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

function StoreInfoCard({
  store,
}: {
  store: {
    _id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    is_verified: boolean;
    avg_rating: number;
    country: string;
  };
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <Link
          href={ROUTES.STORE(store.slug)}
          className="flex items-center gap-3 group"
        >
          {store.logo_url ? (
            <Image
              src={store.logo_url}
              alt={store.name}
              width={44}
              height={44}
              className="size-11 rounded-full object-cover ring-2 ring-muted"
            />
          ) : (
            <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {store.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                {store.name}
              </p>
              {store.is_verified && (
                <BadgeCheck className="size-4 text-primary shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              {store.avg_rating > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  {store.avg_rating.toFixed(1)}
                </span>
              )}
              <span>{store.country}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0">
            <Store className="size-3.5 mr-1.5" />
            Voir la boutique
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────

interface Props {
  preloadedProduct: Preloaded<typeof api.products.queries.getBySlug>;
  slug: string;
}

export function MarketplaceProductPageClient({ preloadedProduct }: Props) {
  const router = useRouter();
  const product = usePreloadedQuery(preloadedProduct);
  const { addItem } = useCart();
  const { isAuthenticated } = useCurrentUser();

  const specs = useQuery(
    api.product_specs.queries.listByProduct,
    product ? { product_id: product._id } : "skip",
  );

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleShare = async () => {
    if (!product) return;
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleAddToCart = async () => {
    if (!product?.store || isAdding) return;
    if (!isAuthenticated) {
      router.push(
        `${ROUTES.LOGIN}?callbackUrl=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    setIsAdding(true);
    try {
      await addItem({
        productId: product._id,
        title: product.title,
        slug: product.slug,
        image: product.images[0] ?? "",
        price: activePrice,
        comparePrice: activeComparePrice,
        storeId: product.store._id,
        storeName: product.store.name,
        storeSlug: product.store.slug,
        weight: product.weight,
        quantity,
        maxQuantity,
        isDigital: product.is_digital,
      });
    } catch {
      // silent
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product?.store || isAdding) return;
    if (!isAuthenticated) {
      router.push(
        `${ROUTES.LOGIN}?callbackUrl=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    setIsAdding(true);
    try {
      await addItem({
        productId: product._id,
        title: product.title,
        slug: product.slug,
        image: product.images[0] ?? "",
        price: activePrice,
        comparePrice: activeComparePrice,
        storeId: product.store._id,
        storeName: product.store.name,
        storeSlug: product.store.slug,
        weight: product.weight,
        quantity,
        maxQuantity,
        isDigital: product.is_digital,
      });
      router.push(ROUTES.CART);
    } catch {
      setIsAdding(false);
    }
  };

  if (product === null) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Produit introuvable</h1>
        <p className="text-muted-foreground">
          Ce produit n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Button asChild>
          <Link href={ROUTES.PRODUCTS}>Retour au catalogue</Link>
        </Button>
      </div>
    );
  }

  if (!product) return null;

  const activePrice = product.price;
  const activeComparePrice = product.compare_price;
  const comparePrice = activeComparePrice ?? 0;
  const hasDiscount =
    activeComparePrice !== undefined && activeComparePrice > activePrice;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - activePrice) / comparePrice) * 100)
    : 0;
  const maxQuantity = product.quantity;
  const isOutOfStock = !product.is_digital && maxQuantity <= 0;
  const isLowStock =
    !product.is_digital && maxQuantity > 0 && maxQuantity <= 10;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link
          href={ROUTES.HOME}
          className="hover:text-foreground transition-colors"
        >
          Accueil
        </Link>
        <ChevronRight className="size-3.5 shrink-0" />
        <Link
          href={ROUTES.PRODUCTS}
          className="hover:text-foreground transition-colors"
        >
          Catalogue
        </Link>
        {product.category && (
          <>
            <ChevronRight className="size-3.5 shrink-0" />
            <Link
              href={ROUTES.CATEGORY(product.category.slug)}
              className="hover:text-foreground transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="text-foreground font-medium line-clamp-1 max-w-[200px]">
          {product.title}
        </span>
      </nav>

      {/* Main grid */}
      <div className="grid gap-8 lg:gap-12 md:grid-cols-2">
        {/* Gallery — sticky on desktop, description below on desktop */}
        <div>
          <div className="md:sticky md:top-6">
            <ProductGallery
              images={product.images ?? []}
              title={product.title}
              imageRoles={product.image_roles}
            />
          </div>
          {product.description && (
            <div className="hidden md:block mt-8">
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <div
                className="prose prose-sm max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-li:text-muted-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-img:rounded-lg prose-img:my-4 prose-img:max-w-full prose-img:mx-auto"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
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
            {isLowStock && (
              <Badge className="bg-amber-500 hover:bg-amber-500 text-white animate-pulse">
                Plus que {maxQuantity} !
              </Badge>
            )}
          </div>

          {/* Title + share */}
          <div className="flex items-start gap-3">
            <h1 className="flex-1 text-2xl sm:text-3xl font-bold leading-tight">
              {product.title}
            </h1>
            <button
              type="button"
              onClick={handleShare}
              className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Partager"
            >
              <Share2 className="size-4" />
            </button>
          </div>

          {/* Rating */}
          {(product.avg_rating ?? 0) > 0 && (
            <StarRating
              rating={product.avg_rating ?? 0}
              count={product.review_count}
            />
          )}

          {/* Category link */}
          {product.category && (
            <Link
              href={ROUTES.CATEGORY(product.category.slug)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronRight className="size-3.5 rotate-180" />
              {product.category.name}
            </Link>
          )}

          {/* Price block */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-primary">
                {formatPrice(activePrice, "XOF")}
              </span>
              {hasDiscount && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(comparePrice, "XOF")}
                </span>
              )}
            </div>
            {hasDiscount && (
              <p className="text-sm text-green-600 font-medium">
                Vous économisez {formatPrice(comparePrice - activePrice, "XOF")}
              </p>
            )}
          </div>

          <Separator />

          {/* Buy section */}
          {!isOutOfStock ? (
            <div className="space-y-4">
              <QuantitySelector
                value={quantity}
                max={product.is_digital ? 99 : maxQuantity}
                onChange={setQuantity}
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                >
                  {isAdding ? (
                    "Ajout..."
                  ) : (
                    <>
                      <ShoppingCart className="size-4 mr-2" />
                      Ajouter au panier
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full"
                  onClick={handleBuyNow}
                  disabled={isAdding}
                >
                  {isAdding ? "Ajout..." : "Commander maintenant"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/5 p-4 text-center">
              <p className="text-sm font-medium text-destructive">
                Ce produit est actuellement en rupture de stock.
              </p>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 py-3 border rounded-xl bg-muted/20">
            <TrustBadge
              icon={<ShieldCheck className="size-5" />}
              label="Paiement sécurisé"
              sublabel="Mobile Money & carte"
            />
            <TrustBadge
              icon={<Truck className="size-5" />}
              label="Livraison rapide"
              sublabel="Cotonou & alentours"
            />
            <TrustBadge
              icon={<RotateCcw className="size-5" />}
              label="Retours gratuits"
              sublabel="Sous 3 jours"
            />
          </div>

          {/* Key tags as checkpoints */}
          {product.tags.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">Points clés</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {product.tags.slice(0, 6).map((tag) => (
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

          {/* Description — mobile only (desktop shows it under the gallery) */}
          {product.description && (
            <div className="md:hidden">
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <div className="overflow-x-auto">
                <div
                  className="prose prose-sm max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-li:text-muted-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-img:rounded-lg prose-img:my-4 prose-img:max-w-full prose-img:mx-auto"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Technical Specs */}
          {(product.weight ||
            product.color ||
            product.material ||
            product.dimensions ||
            product.sku ||
            product.category ||
            (specs && specs.length > 0)) && (
            <div className="rounded-xl border overflow-hidden">
              <div className="bg-muted/60 px-4 py-2.5 border-b flex items-center gap-2">
                <Package className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Caractéristiques</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      product.category && {
                        label: "Catégorie",
                        value: product.category.name,
                      },
                      product.color && {
                        label: "Couleur",
                        value: product.color,
                      },
                      product.material && {
                        label: "Matériau",
                        value: product.material,
                      },
                      product.weight && {
                        label: "Poids",
                        value:
                          product.weight >= 1000
                            ? `${(product.weight / 1000).toFixed(2).replace(/\.?0+$/, "")} kg`
                            : `${product.weight} g`,
                      },
                      product.dimensions && {
                        label: "Dimensions",
                        value: product.dimensions,
                      },
                      product.sku && {
                        label: "Référence (SKU)",
                        value: product.sku,
                      },
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
                            className={
                              i % 2 === 0 ? "bg-background" : "bg-muted/30"
                            }
                          >
                            <td className="px-4 py-2.5 w-2/5 text-muted-foreground font-medium">
                              {row.label}
                            </td>
                            <td className="px-4 py-2.5 text-foreground">
                              {row.value}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Store card */}
          {product.store && <StoreInfoCard store={product.store} />}
        </div>
      </div>

      {/* Reviews + Q&A below the fold */}
      <Separator />
      <ProductReviewList productId={product._id} />
      <Separator />
      <ProductQASection
        productId={product._id}
        storeOwnerId={product.store?.owner_id}
      />
    </div>
  );
}
