// filepath: src/components/storefront/organisms/JustLanding.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ProductCard } from "../molecules/ProductCard";
import Link from "next/link";

export function JustLanding() {
  const products = useQuery(api.products.queries.listLatest, {});

  const latestProducts = (products ?? []).slice(0, 6);

  if (latestProducts.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Nouveautés</h2>
        <Link
          href="/products?sort=newest"
          className="text-sm text-primary font-medium hover:underline"
        >
          Voir tout
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {latestProducts.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}
