// filepath: src/app/(storefront)/products/[slug]/page.tsx

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
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
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { ProductGallery } from "@/components/products/ProductGallery";
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

function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: {
  variants: Variant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (variants.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Variante</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => (
          <button
            key={v._id}
            type="button"
            onClick={() => onSelect(v._id)}
            disabled={v.quantity <= 0}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              selectedId === v._id
                ? "border-primary bg-primary/5 text-primary"
                : v.quantity <= 0
                  ? "border-muted text-muted-foreground opacity-50 cursor-not-allowed"
                  : "border-input hover:border-primary/50"
            }`}
          >
            {v.title}
          </button>
        ))}
      </div>
    </div>
  );
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
  const product = useQuery(api.products.queries.getBySlug, {
    slug: params.slug,
  });

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);

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

  const selectedVariant = product.variants.find(
    (v) => v._id === selectedVariantId,
  );
  const activePrice = selectedVariant?.price ?? product.price;
  const activeComparePrice =
    selectedVariant?.compare_price ?? product.compare_price;
  const hasDiscount =
    activeComparePrice !== undefined && activeComparePrice > activePrice;
  const maxQuantity = selectedVariant
    ? selectedVariant.quantity
    : product.quantity;
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
        <ProductGallery images={product.images} title={product.title} />

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

          {/* Variants */}
          {product.variants.length > 0 && (
            <VariantSelector
              variants={product.variants}
              selectedId={selectedVariantId}
              onSelect={(id) => {
                setSelectedVariantId(id);
                setQuantity(1);
              }}
            />
          )}

          {/* Quantity + Add to cart */}
          {!isOutOfStock && (
            <div className="space-y-4">
              <QuantitySelector
                value={quantity}
                max={maxQuantity}
                onChange={setQuantity}
              />
              <Button size="lg" className="w-full sm:w-auto">
                <ShoppingCart className="size-4 mr-2" />
                Ajouter au panier
              </Button>
            </div>
          )}

          {isOutOfStock && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">
                Ce produit est actuellement en rupture de stock.
              </p>
            </div>
          )}

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

          <Separator />

          {/* Delivery info */}
          <div className="flex items-start gap-3 text-sm">
            <Truck className="size-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Livraison</p>
              <p className="text-muted-foreground">
                Délai et frais calculés au checkout selon votre localisation.
              </p>
            </div>
          </div>

          {/* Store card */}
          {product.store && <StoreInfoCard store={product.store} />}
        </div>
      </div>
    </div>
  );
}
