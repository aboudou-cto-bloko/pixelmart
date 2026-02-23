// filepath: src/components/products/FilterSidebar.tsx

"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { SlidersHorizontal, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ROUTES } from "@/constants/routes";

type SortOption = "relevance" | "newest" | "price_asc" | "price_desc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Pertinence" },
  { value: "newest", label: "Plus récents" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
];

interface FilterSidebarProps {
  /** Forcer une catégorie (page /categories/[slug]) */
  fixedCategoryId?: string;
}

export function FilterSidebar({ fixedCategoryId }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categories = useQuery(api.categories.queries.listActive);

  // Lire les filtres depuis l'URL
  const currentSort = (searchParams.get("sort") as SortOption) ?? "relevance";
  const currentCategory = fixedCategoryId ?? searchParams.get("category") ?? "";
  const currentMinPrice = searchParams.get("min_price") ?? "";
  const currentMaxPrice = searchParams.get("max_price") ?? "";
  const currentInStock = searchParams.get("in_stock") === "true";

  /**
   * Met à jour les search params sans perdre les existants.
   */
  const updateFilters = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const queryString = params.toString();
      router.push(
        queryString ? `${ROUTES.PRODUCTS}?${queryString}` : ROUTES.PRODUCTS,
      );
    },
    [router, searchParams],
  );

  function handleCategoryChange(categoryId: string) {
    if (fixedCategoryId) return; // catégorie figée sur /categories/[slug]
    updateFilters({
      category: categoryId === currentCategory ? null : categoryId,
    });
  }

  function handleSortChange(sort: SortOption) {
    updateFilters({ sort: sort === "relevance" ? null : sort });
  }

  function handlePriceApply(min: string, max: string) {
    updateFilters({
      min_price: min || null,
      max_price: max || null,
    });
  }

  function handleStockToggle() {
    updateFilters({ in_stock: currentInStock ? null : "true" });
  }

  function handleClearAll() {
    if (fixedCategoryId) {
      router.push(ROUTES.PRODUCTS);
    } else {
      const params = new URLSearchParams();
      const q = searchParams.get("q");
      if (q) params.set("q", q);
      const queryString = params.toString();
      router.push(
        queryString ? `${ROUTES.PRODUCTS}?${queryString}` : ROUTES.PRODUCTS,
      );
    }
  }

  const hasActiveFilters =
    (!fixedCategoryId && currentCategory !== "") ||
    currentMinPrice !== "" ||
    currentMaxPrice !== "" ||
    currentInStock ||
    currentSort !== "relevance";

  const rootCategories = categories?.filter((c) => !c.parent_id) ?? [];

  // ---- Contenu partagé desktop/mobile ----
  const filterContent = (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Trier par
        </Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {SORT_OPTIONS.map((opt) => (
            <Badge
              key={opt.value}
              variant={currentSort === opt.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleSortChange(opt.value)}
            >
              {opt.label}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Categories (sauf si fixedCategoryId) */}
      {!fixedCategoryId && rootCategories.length > 0 && (
        <>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Catégorie
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {rootCategories.map((cat) => (
                <Badge
                  key={cat._id}
                  variant={currentCategory === cat._id ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleCategoryChange(cat._id)}
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Price range */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Prix
        </Label>
        <PriceRangeFilter
          minPrice={currentMinPrice}
          maxPrice={currentMaxPrice}
          onApply={handlePriceApply}
        />
      </div>

      <Separator />

      {/* In stock */}
      <div className="flex items-center justify-between">
        <Label className="text-sm">En stock uniquement</Label>
        <button
          type="button"
          role="switch"
          aria-checked={currentInStock}
          onClick={handleStockToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            currentInStock ? "bg-primary" : "bg-input"
          }`}
        >
          <span
            className={`pointer-events-none inline-block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
              currentInStock ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive"
            onClick={handleClearAll}
          >
            <X className="size-4 mr-2" />
            Réinitialiser les filtres
          </Button>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop — sidebar fixe */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Filtres</p>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                Actifs
              </Badge>
            )}
          </div>
          {filterContent}
        </div>
      </aside>

      {/* Mobile — drawer */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden flex items-center gap-2"
          >
            <SlidersHorizontal className="size-4" />
            Filtres
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs ml-1">
                !
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>Filtres</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{filterContent}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---- Price Range Sub-Component ----
function PriceRangeFilter({
  minPrice,
  maxPrice,
  onApply,
}: {
  minPrice: string;
  maxPrice: string;
  onApply: (min: string, max: string) => void;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const min = (formData.get("min") as string) ?? "";
    const max = (formData.get("max") as string) ?? "";
    onApply(min, max);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-end gap-2">
      <div className="flex-1">
        <Input
          name="min"
          type="number"
          placeholder="Min"
          defaultValue={minPrice}
          min={0}
          className="h-9 text-sm"
        />
      </div>
      <span className="text-muted-foreground text-sm pb-2">—</span>
      <div className="flex-1">
        <Input
          name="max"
          type="number"
          placeholder="Max"
          defaultValue={maxPrice}
          min={0}
          className="h-9 text-sm"
        />
      </div>
      <Button type="submit" size="sm" variant="secondary" className="h-9">
        OK
      </Button>
    </form>
  );
}
