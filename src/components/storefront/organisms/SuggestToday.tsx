// filepath: src/components/storefront/organisms/SuggestToday.tsx
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ProductCard } from "../molecules/ProductCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Id } from "../../../../convex/_generated/dataModel";

type Product = {
  _id: Id<"products">;
  title: string;
  slug: string;
  price: number;
  compare_price?: number;
  images: string[];
  avg_rating?: number; // optionnel
  review_count?: number;
  published_at?: number;
  // autres champs nécessaires pour ProductCard
};

const SUGGEST_TABS = [
  { key: "all", label: "Recommandés" },
  { key: "bestseller", label: "Top Ventes" },
  { key: "new", label: "Nouveautés" },
  { key: "discount", label: "Promotions" },
] as const;

export function SuggestToday() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const products = useQuery(api.products.queries.listLatest, {}) as
    | Product[]
    | undefined;

  const allProducts = products ?? [];

  // Filtrage et tri sécurisés
  const filteredProducts = (() => {
    switch (activeTab) {
      case "bestseller":
        // Tri par nombre d'avis (ou note moyenne si disponible)
        return [...allProducts].sort(
          (a, b) => (b.review_count ?? 0) - (a.review_count ?? 0),
        );
      case "new":
        // Tri par date de publication (plus récent d'abord)
        return [...allProducts].sort(
          (a, b) => (b.published_at ?? 0) - (a.published_at ?? 0),
        );
      case "discount":
        return allProducts.filter(
          (p) => p.compare_price && p.compare_price > p.price,
        );
      default:
        return allProducts;
    }
  })().slice(0, 12);

  if (allProducts.length === 0) return null;

  return (
    <section className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Suggestions du Jour</h2>
        <Link
          href="/products"
          className="text-sm text-primary font-medium hover:underline"
        >
          Voir tout
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {SUGGEST_TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className="whitespace-nowrap"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Grille de produits */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {filteredProducts.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}
