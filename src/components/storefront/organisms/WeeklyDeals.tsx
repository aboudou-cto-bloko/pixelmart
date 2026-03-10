// filepath: src/components/storefront/organisms/WeeklyDeals.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ProductCard } from "../molecules/ProductCard";
import { CountdownTimer } from "../atoms/CountdownTimer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function WeeklyDeals() {
  // Produits sponsorisés dans ce slot
  const sponsoredAds = useQuery(api.ads.queries.getActiveAdsForSlot, {
    slot_id: "deals_featured",
  });

  // Produits organiques (les plus remisés)
  const products = useQuery(api.products.queries.listLatest, {});

  // Filtrer les produits avec une remise
  const dealsProducts = (products ?? [])
    .filter((p) => p.compare_price && p.compare_price > p.price)
    .slice(0, 6);

  // Fin de semaine comme deadline deals
  const endOfWeek = getEndOfWeek();

  if (
    dealsProducts.length === 0 &&
    (!sponsoredAds || sponsoredAds.length === 0)
  ) {
    return null;
  }

  return (
    <section className="container py-8">
      <div className="rounded-xl border bg-card p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold">Meilleures Offres</h2>
          <CountdownTimer targetDate={endOfWeek} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Sponsored products first */}
          {sponsoredAds?.map((ad) =>
            ad.product ? (
              <ProductCard
                key={ad._id}
                product={{
                  _id: ad._id,
                  slug: ad.product.slug,
                  title: ad.product.title,
                  images: ad.product.images,
                  price: ad.product.price,
                  compare_price: ad.product.compare_price,
                }}
                sponsored
              />
            ) : null,
          )}

          {/* Organic deals */}
          {dealsProducts.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button variant="outline" asChild>
            <Link href="/products?sort=discount">Voir toutes les offres</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function getEndOfWeek(): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = 7 - dayOfWeek;
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + daysUntilSunday);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek.getTime();
}
