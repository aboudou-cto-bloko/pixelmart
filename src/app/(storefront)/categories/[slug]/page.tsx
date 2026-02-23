// filepath: src/app/(storefront)/categories/[slug]/page.tsx

"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { SearchBar } from "@/components/layout/SearchBar";
import { FilterSidebar } from "@/components/products/FilterSidebar";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";

function CategoryContent() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();

  const category = useQuery(api.categories.queries.getBySlug, {
    slug: params.slug,
  });

  const sort = searchParams.get("sort") ?? undefined;
  const minPriceRaw = searchParams.get("min_price");
  const maxPriceRaw = searchParams.get("max_price");
  const inStock = searchParams.get("in_stock") === "true" || undefined;

  const minPrice = minPriceRaw ? parseInt(minPriceRaw, 10) * 100 : undefined;
  const maxPrice = maxPriceRaw ? parseInt(maxPriceRaw, 10) * 100 : undefined;

  const products = useQuery(
    api.products.queries.search,
    category
      ? {
          categoryId: category._id,
          minPrice,
          maxPrice,
          inStock,
          sort:
            (sort as "relevance" | "newest" | "price_asc" | "price_desc") ??
            undefined,
          limit: 40,
        }
      : "skip",
  );

  // Loading category
  if (category === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-32 mb-8" />
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
  if (category === null) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1>Catégorie introuvable</h1>
        <p className="mt-2 text-muted-foreground">
          Cette catégorie n&apos;existe pas ou a été désactivée.
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href={ROUTES.HOME} className="hover:text-foreground">
          Accueil
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={ROUTES.PRODUCTS} className="hover:text-foreground">
          Catalogue
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 space-y-4">
        <h1>{category.name}</h1>
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <SearchBar />
          </div>
          <FilterSidebar fixedCategoryId={category._id} />
        </div>
        {products !== undefined && (
          <p className="text-sm text-muted-foreground">
            {products.length} produit{products.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex gap-8">
        <FilterSidebar fixedCategoryId={category._id} />
        <div className="flex-1 min-w-0">
          <ProductGrid
            products={products}
            emptyMessage={`Aucun produit dans « ${category.name} » pour le moment.`}
          />
        </div>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense>
      <CategoryContent />
    </Suspense>
  );
}
