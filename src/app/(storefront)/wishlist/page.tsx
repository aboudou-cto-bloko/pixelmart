"use client";

// filepath: src/app/(storefront)/wishlist/page.tsx

import { useQuery } from "convex/react";
import Link from "next/link";
import { Heart, ShoppingBag, LogIn } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function WishlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useCurrentUser();
  const products = useQuery(
    api.wishlists.queries.listProductsByUser,
    isAuthenticated ? {} : "skip",
  );

  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <WishlistSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <Heart className="size-14 mx-auto text-muted-foreground/30 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Liste de souhaits</h1>
        <p className="text-muted-foreground mb-8">
          Connectez-vous pour retrouver vos produits favoris et y accéder depuis
          n&apos;importe quel appareil.
        </p>
        <Button asChild>
          <Link href={`${ROUTES.LOGIN}?redirect=/wishlist`}>
            <LogIn className="size-4 mr-2" />
            Se connecter
          </Link>
        </Button>
      </div>
    );
  }

  const isLoading = products === undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="size-6 text-red-500 fill-red-500" />
            Ma liste de souhaits
          </h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              {products.length} produit{products.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={ROUTES.PRODUCTS}>
            <ShoppingBag className="size-4 mr-2" />
            Continuer mes achats
          </Link>
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <WishlistSkeleton />
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <Heart className="size-14 mx-auto text-muted-foreground/30 mb-6" />
          <h2 className="text-lg font-semibold mb-2">Votre liste est vide</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Ajoutez des produits à votre liste depuis le catalogue.
          </p>
          <Button asChild>
            <Link href={ROUTES.PRODUCTS}>Découvrir les produits</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              currency="XOF"
              showAddToCart
            />
          ))}
        </div>
      )}
    </div>
  );
}
