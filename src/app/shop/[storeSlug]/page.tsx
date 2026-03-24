"use client";

// filepath: src/app/shop/[storeSlug]/page.tsx

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import Link from "next/link";
import Image from "next/image";
import { Star, Package, ShieldCheck, ArrowRight } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { ShopProductCard } from "@/components/vendor-shop/atoms/ShopProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SHOP_ROUTES } from "@/constants/routes";

export default function ShopHomePage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();

  const store = useQuery(api.stores.queries.getBySlug, { slug: storeSlug });
  const products = useQuery(
    api.products.queries.listActiveByStore,
    store ? { storeId: store._id, limit: 8 } : "skip",
  );

  const isLoading = store === undefined;

  return (
    <div className="space-y-10">
      {/* Hero / Banner */}
      {isLoading ? (
        <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-muted animate-pulse" />
      ) : store ? (
        <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden">
          {store.banner_url ? (
            <Image
              src={store.banner_url}
              alt={store.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, var(--shop-primary, #6366f1) 0%, color-mix(in srgb, var(--shop-primary, #6366f1) 60%, white) 100%)`,
              }}
            />
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-end gap-4">
              {store.logo_url ? (
                <Image
                  src={store.logo_url}
                  alt={store.name}
                  width={64}
                  height={64}
                  className="size-16 rounded-xl object-cover border-2 border-white/30 shrink-0"
                />
              ) : (
                <div
                  className="size-16 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0 border-2 border-white/30"
                  style={{
                    backgroundColor: "var(--shop-primary, #6366f1)",
                  }}
                >
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold truncate">{store.name}</h1>
                  {store.is_verified && (
                    <ShieldCheck className="size-5 text-blue-300 shrink-0" />
                  )}
                </div>
                {store.description && (
                  <p className="text-sm text-white/80 line-clamp-1 mt-0.5">
                    {store.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-1 text-xs text-white/70">
                  {store.avg_rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="size-3 fill-yellow-400 text-yellow-400" />
                      {store.avg_rating.toFixed(1)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Package className="size-3" />
                    {store.product_count} produit
                    {store.product_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Featured products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Nos produits</h2>
          {products && products.length >= 8 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={SHOP_ROUTES.PRODUCTS(storeSlug)}>
                Voir tout
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>

        {products === undefined ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="size-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              Aucun produit disponible pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ShopProductCard
                key={product._id}
                product={product}
                storeSlug={storeSlug}
                currency={store?.currency ?? "XOF"}
                showAddToCart
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
