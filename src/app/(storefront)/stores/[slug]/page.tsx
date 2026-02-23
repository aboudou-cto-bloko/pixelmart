// filepath: src/app/(storefront)/stores/[slug]/page.tsx

"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  ShieldCheck,
  Star,
  MapPin,
  Calendar,
  Package,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function StoreVitrinePage() {
  const params = useParams<{ slug: string }>();

  const store = useQuery(api.stores.queries.getBySlug, {
    slug: params.slug,
  });

  // Utiliser search avec storeId pour avoir les images résolues
  const products = useQuery(
    api.products.queries.search,
    store
      ? {
          storeId: store._id as Id<"stores">,
          sort: "newest" as const,
          limit: 40,
        }
      : "skip",
  );

  // Loading
  if (store === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="h-4 w-48 mb-6" />
        <Skeleton className="h-48 w-full rounded-lg mb-6" />
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="size-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 404
  if (store === null) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1>Boutique introuvable</h1>
        <p className="mt-2 text-muted-foreground">
          Cette boutique n&apos;existe pas ou n&apos;est plus active.
        </p>
        <Link
          href={ROUTES.STORES}
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Voir toutes les boutiques
        </Link>
      </div>
    );
  }

  const createdDate = new Date(store._creationTime).toLocaleDateString(
    "fr-FR",
    { month: "long", year: "numeric" },
  );

  return (
    <div>
      {/* Banner */}
      {store.banner_url && (
        <div className="relative h-48 sm:h-64 bg-muted overflow-hidden">
          <Image
            src={store.banner_url}
            alt={`Bannière ${store.name}`}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link href={ROUTES.HOME} className="hover:text-foreground">
            Accueil
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href={ROUTES.STORES} className="hover:text-foreground">
            Boutiques
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-medium">{store.name}</span>
        </nav>

        {/* Store header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start mb-8">
          {/* Logo */}
          {store.logo_url ? (
            <Image
              src={store.logo_url}
              alt={store.name}
              width={80}
              height={80}
              className="size-20 rounded-full object-cover border-4 border-background shadow-sm shrink-0"
            />
          ) : (
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border-4 border-background shadow-sm shrink-0">
              {store.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{store.name}</h1>
              {store.is_verified && (
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="size-3" />
                  Vérifié
                </Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {store.level}
              </Badge>
            </div>

            {store.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                {store.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              {store.avg_rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-primary text-primary" />
                  {store.avg_rating.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Package className="size-4" />
                {store.product_count} produit
                {store.product_count !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-4" />
                {store.country}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                Depuis {createdDate}
              </span>
            </div>
          </div>
        </div>

        {/* Products */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Produits{" "}
            {products !== undefined && (
              <span className="text-muted-foreground font-normal text-base">
                ({products.length})
              </span>
            )}
          </h2>
          <ProductGrid
            products={products}
            emptyMessage="Cette boutique n'a pas encore de produits."
          />
        </div>
      </div>
    </div>
  );
}
