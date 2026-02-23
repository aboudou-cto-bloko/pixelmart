// filepath: src/app/(storefront)/products/page.tsx

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { SearchBar } from "@/components/layout/SearchBar";
import { FilterSidebar } from "@/components/products/FilterSidebar";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Id } from "../../../../convex/_generated/dataModel";

function CatalogContent() {
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? undefined;
  const categoryId = searchParams.get("category") ?? undefined;
  const sort = searchParams.get("sort") ?? undefined;
  const minPriceRaw = searchParams.get("min_price");
  const maxPriceRaw = searchParams.get("max_price");
  const inStock = searchParams.get("in_stock") === "true" || undefined;

  // Convertir prix en centimes (l'utilisateur saisit en FCFA)
  const minPrice = minPriceRaw ? parseInt(minPriceRaw, 10) * 100 : undefined;
  const maxPrice = maxPriceRaw ? parseInt(maxPriceRaw, 10) * 100 : undefined;

  const products = useQuery(api.products.queries.search, {
    query: q,
    categoryId: categoryId ? (categoryId as Id<"categories">) : undefined,
    minPrice,
    maxPrice,
    inStock,
    sort:
      (sort as "relevance" | "newest" | "price_asc" | "price_desc") ??
      undefined,
    limit: 40,
  });

  const pageTitle = q ? `Résultats pour « ${q} »` : "Catalogue";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <h1>{pageTitle}</h1>
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <SearchBar defaultValue={q} />
          </div>
        </div>
        {products !== undefined && (
          <p className="text-sm text-muted-foreground">
            {products.length} produit{products.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex gap-8">
        {/* Desktop sidebar (hidden on mobile, FilterSidebar handles both) */}
        <FilterSidebar />
        <div className="flex-1 min-w-0">
          <ProductGrid
            products={products}
            emptyMessage={
              q
                ? `Aucun résultat pour « ${q} ». Essayez d'autres termes.`
                : "Aucun produit disponible pour le moment."
            }
          />
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <CatalogContent />
    </Suspense>
  );
}
