// filepath: src/components/products/ProductGrid.tsx

import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard, type ProductCardData } from "./ProductCard";

interface ProductGridProps {
  products: ProductCardData[] | undefined;
  /** Nombre de skeletons pendant le chargement */
  skeletonCount?: number;
  /** Message quand la liste est vide */
  emptyMessage?: string;
  currency?: string;
}

export function ProductGrid({
  products,
  skeletonCount = 8,
  emptyMessage = "Aucun produit trouvé.",
  currency = "XOF",
}: ProductGridProps) {
  // Loading
  if (products === undefined) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // Empty
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Grid
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} currency={currency} />
      ))}
    </div>
  );
}
