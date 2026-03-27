// filepath: src/components/storefront/organisms/BestSeller.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ProductCard } from "../molecules/ProductCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function BestSeller() {
  const categories = useQuery(api.categories.queries.listActive);
  const products = useQuery(api.products.queries.listLatest, {});

  const rootCategories = (categories ?? []).filter((c) => !c.parent_id);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredProducts = activeCategory
    ? (products ?? []).filter((p) => p.category_id === activeCategory)
    : (products ?? []);

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Meilleures Ventes</h2>
        <Link
          href="/products?sort=popular"
          className="text-sm text-primary font-medium hover:underline"
        >
          Voir tout
        </Link>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={activeCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory(null)}
        >
          Tous
        </Button>
        {rootCategories.slice(0, 7).map((cat) => (
          <Button
            key={cat._id}
            variant={activeCategory === cat._id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat._id)}
            className="whitespace-nowrap"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredProducts.slice(0, 12).map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}
