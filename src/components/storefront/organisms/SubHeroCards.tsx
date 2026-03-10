// filepath: src/components/storefront/organisms/SubHeroCards.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AdBannerCard } from "../molecules/AdBannerCard";

export function SubHeroCards() {
  const ads = useQuery(api.ads.queries.getActiveAdsForSlot, {
    slot_id: "hero_sub",
  });

  if (!ads || ads.length === 0) return null;

  return (
    <section className="container pb-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ads.slice(0, 4).map((ad) => (
          <AdBannerCard key={ad._id} booking={ad} aspectRatio="16/10" />
        ))}
      </div>
    </section>
  );
}
