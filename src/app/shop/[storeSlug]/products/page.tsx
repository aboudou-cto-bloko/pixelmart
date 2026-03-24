"use client";

// filepath: src/app/shop/[storeSlug]/products/page.tsx

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { Package, Search } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { ShopProductCard } from "@/components/vendor-shop/atoms/ShopProductCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShopProductsPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [search, setSearch] = useState("");

  const store = useQuery(api.stores.queries.getBySlug, { slug: storeSlug });
  const products = useQuery(
    api.products.queries.listActiveByStore,
    store ? { storeId: store._id } : "skip",
  );

  const filtered =
    products?.filter((p) =>
      search.trim()
        ? p.title.toLowerCase().includes(search.toLowerCase().trim())
        : true,
    ) ?? [];

  const isLoading = products === undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Tous les produits</h1>
        {products !== undefined && (
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} produit{products.length !== 1 ? "s" : ""}{" "}
            disponible
            {products.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un produit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package className="size-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            {search
              ? "Aucun produit correspondant à votre recherche."
              : "Aucun produit disponible."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
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
    </div>
  );
}
