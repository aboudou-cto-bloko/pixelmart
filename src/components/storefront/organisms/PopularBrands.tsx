// filepath: src/components/storefront/organisms/PopularBrands.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AdSlotWrapper } from "../atoms/AdSlotWrapper";
import Image from "next/image";

export function PopularBrands() {
  const ads = useQuery(api.ads.queries.getActiveAdsForSlot, {
    slot_id: "brands_row",
  });

  // Fallback: featured stores si pas d'ads
  const featuredStores = useQuery(api.stores.queries.getFeaturedStores, {
    limit: 8,
  });

  const brandItems =
    ads && ads.length > 0
      ? ads.map((ad) => ({
          id: ad._id,
          bookingId: ad._id,
          name: ad.store?.name ?? ad.title ?? "Marque",
          logo: ad.store?.logo_url ?? ad.image_url,
          link:
            ad.cta_link ?? (ad.store?.slug ? `/stores/${ad.store.slug}` : "#"),
        }))
      : (featuredStores ?? []).map((store) => ({
          id: store._id,
          bookingId: undefined,
          name: store.name,
          logo: store.logo_url,
          link: `/stores/${store.slug}`,
        }));

  if (brandItems.length === 0) return null;

  return (
    <section className="container py-8">
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold mb-4">Boutiques Populaires</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
          {brandItems.map((brand) => (
            <AdSlotWrapper
              key={brand.id}
              bookingId={brand.bookingId}
              href={brand.link}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:shadow-sm transition-shadow"
            >
              <div className="size-12 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                {brand.logo ? (
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">
                    {brand.name.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-center truncate w-full">
                {brand.name}
              </span>
            </AdSlotWrapper>
          ))}
        </div>
      </div>
    </section>
  );
}
