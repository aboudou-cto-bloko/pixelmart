// filepath: src/app/(storefront)/products/[slug]/page.tsx

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useCart } from "@/hooks/useCart";
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
  MapPin,
  Weight,
  Palette,
  Layers,
  Ruler,
  Tag,
  Package,
  Hash,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductReviewList } from "@/components/reviews";
import { ProductQASection } from "@/components/questions";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { PIXELMART_WAREHOUSE } from "@/constants/pickup";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

// ─── Variant selector ────────────────────────────────────────
interface Variant {
  _id: string;
  title: string;
  options: { name: string; value: string }[];
  price?: number;
  compare_price?: number;
  quantity: number;
  image_url: string | null;
}

// ─── Quantity selector ───────────────────────────────────────
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
    <div className="flex items-center gap-2">
      <p className="text-sm font-medium">Quantité</p>
      <div className="flex items-center border rounded-md">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
        >
          <Minus className="size-3" />
        </Button>
        <span className="w-10 text-center text-sm font-medium">{value}</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="size-3" />
        </Button>
      </div>
      {max <= 5 && (
        <span className="text-xs text-muted-foreground">
          {max} disponible{max !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

// ─── Store info card ─────────────────────────────────────────
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
              width={40}
              height={40}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {store.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                {store.name}
              </p>
              {store.is_verified && (
                <ShieldCheck className="size-3.5 text-primary shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {store.avg_rating > 0 && (
                <span className="flex items-center gap-0.5">
                  <Star className="size-3 fill-primary text-primary" />
                  {store.avg_rating.toFixed(1)}
                </span>
              )}
              <span>{store.country}</span>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Store className="size-3.5 mr-1.5" />
            Voir
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ─── Loading ─────────────────────────────────────────────────
function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="h-4 w-48 mb-6" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-square rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const product = useQuery(api.products.queries.getBySlug, {
    slug: params.slug,
  });

  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  // Loading
  if (product === undefined) {
    return <ProductDetailSkeleton />;
  }

  // 404
  if (product === null) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1>Produit introuvable</h1>
        <p className="mt-2 text-muted-foreground">
          Ce produit n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Link
          href={ROUTES.PRODUCTS}
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const activePrice = product.price;
  const activeComparePrice = product.compare_price;
  const hasDiscount =
    activeComparePrice !== undefined && activeComparePrice > activePrice;
  const maxQuantity = product.quantity;
  const isOutOfStock = maxQuantity <= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href={ROUTES.HOME} className="hover:text-foreground">
          Accueil
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={ROUTES.PRODUCTS} className="hover:text-foreground">
          Catalogue
        </Link>
        {product.category && (
          <>
            <ChevronRight className="size-3.5" />
            <Link
              href={ROUTES.CATEGORY(product.category.slug)}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium truncate max-w-48">
          {product.title}
        </span>
      </nav>

      {/* Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left — Gallery */}
        <ProductGallery
          images={product.images}
          title={product.title}
          imageRoles={product.image_roles}
        />

        {/* Right — Details */}
        <div className="space-y-6">
          {/* Title + badges */}
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {product.is_digital && (
                <Badge variant="secondary">Produit digital</Badge>
              )}
              {product.status === "out_of_stock" && (
                <Badge variant="outline">Rupture de stock</Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              {product.title}
            </h1>
            {product.category && (
              <Link
                href={ROUTES.CATEGORY(product.category.slug)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {product.category.name}
              </Link>
            )}
          </div>
          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(activePrice, "XOF")}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(activeComparePrice, "XOF")}
                </span>
                <Badge className="bg-destructive text-white">
                  -
                  {Math.round(
                    ((activeComparePrice - activePrice) / activeComparePrice) *
                      100,
                  )}
                  %
                </Badge>
              </>
            )}
          </div>
          <Separator />
          {/* Quantity + Add to cart */}
          {!isOutOfStock && (
            <div className="space-y-3">
              <QuantitySelector
                value={quantity}
                max={maxQuantity}
                onChange={setQuantity}
              />
              {/* Stock Urgency */}
              {maxQuantity <= 10 && maxQuantity > 0 && (
                <p className="text-sm text-orange-600 flex items-center gap-1.5">
                  <span className="font-medium">
                    ⚡ Plus que {maxQuantity} en stock
                  </span>
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    if (!product.store) return;
                    addItem({
                      productId: product._id,
                      title: product.title,
                      slug: product.slug,
                      image: product.images[0] ?? "",
                      price: activePrice,
                      comparePrice: activeComparePrice,
                      storeId: product.store._id,
                      storeName: product.store.name,
                      storeSlug: product.store.slug,
                      quantity,
                      maxQuantity,
                      isDigital: product.is_digital,
                    });
                  }}
                >
                  <ShoppingCart className="size-4 mr-2" />
                  Ajouter au panier
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    if (!product.store) return;
                    addItem({
                      productId: product._id,
                      title: product.title,
                      slug: product.slug,
                      image: product.images[0] ?? "",
                      price: activePrice,
                      comparePrice: activeComparePrice,
                      storeId: product.store._id,
                      storeName: product.store.name,
                      storeSlug: product.store.slug,
                      quantity,
                      maxQuantity,
                      isDigital: product.is_digital,
                    });
                    router.push(ROUTES.CART);
                  }}
                >
                  Commander
                </Button>
              </div>
            </div>
          )}
          {isOutOfStock && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">
                Ce produit est actuellement en rupture de stock.
              </p>
            </div>
          )}
          {/* Bullet Points - Key Benefits */}
          {product.tags.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Points clés</h3>
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
          {/* Trust Icons */}
          <div className="flex flex-wrap items-center justify-center gap-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span>Paiement sécurisé</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
              <span>Protection acheteurs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
              </svg>
              <span>Moov Money, Celtis, Mobile Money</span>
            </div>
          </div>
          <Separator />
          {/* Description */}
          {product.description && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <div
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
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
          {/* Technical Specs — Amazon-style table */}
          {(product.weight ||
            product.color ||
            product.material ||
            product.dimensions ||
            product.sku ||
            product.category) && (
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted/60 px-4 py-2.5 border-b flex items-center gap-2">
                <Package className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Caractéristiques</h3>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {[
                    product.category && {
                      icon: <Tag className="size-3.5 text-muted-foreground" />,
                      label: "Catégorie",
                      value: product.category.name,
                    },
                    product.color && {
                      icon: (
                        <Palette className="size-3.5 text-muted-foreground" />
                      ),
                      label: "Couleur",
                      value: product.color,
                    },
                    product.material && {
                      icon: (
                        <Layers className="size-3.5 text-muted-foreground" />
                      ),
                      label: "Matériau",
                      value: product.material,
                    },
                    product.weight && {
                      icon: (
                        <Weight className="size-3.5 text-muted-foreground" />
                      ),
                      label: "Poids",
                      value:
                        product.weight >= 1000
                          ? `${(product.weight / 1000).toFixed(2).replace(/\.?0+$/, "")} kg`
                          : `${product.weight} g`,
                    },
                    product.dimensions && {
                      icon: (
                        <Ruler className="size-3.5 text-muted-foreground" />
                      ),
                      label: "Dimensions",
                      value: product.dimensions,
                    },
                    product.sku && {
                      icon: <Hash className="size-3.5 text-muted-foreground" />,
                      label: "Référence (SKU)",
                      value: product.sku,
                    },
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
                          <td className="px-4 py-2.5 w-2/5">
                            <div className="flex items-center gap-2 text-muted-foreground font-medium">
                              {row.icon}
                              {row.label}
                            </div>
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
          )}
          {/* Returns Policy */}
          <div className="flex items-start gap-2 text-sm">
            <svg
              className="size-5 text-blue-600 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <div>
              <p className="font-medium">Retours gratuits</p>
              <p className="text-xs text-muted-foreground">Sous 3 jours</p>
            </div>
          </div>

          <Separator className="my-8" />
          <ProductReviewList productId={product._id} />
          <Separator className="my-8" />
          <ProductQASection
            productId={product._id}
            storeOwnerId={product.store?.owner_id}
          />
          {/* Store card */}
          {product.store && <StoreInfoCard store={product.store} />}
        </div>
      </div>
    </div>
  );
}
