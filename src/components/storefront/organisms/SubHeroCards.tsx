"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AdBannerCard } from "../molecules/AdBannerCard";

export function SubHeroCards() {
  const rawAds = useQuery(api.ads.queries.getActiveAdsForSlot, {
    slot_id: "hero_sub",
  });

  if (!rawAds || rawAds.length === 0) return null;

  // Normalisation des données pour chaque annonce
  const ads = rawAds.slice(0, 4).map((ad) => ({
    ...ad,
    image_url: ad.image_url ?? undefined,
    title: ad.title ?? undefined,
    subtitle: ad.subtitle ?? undefined,
    cta_text: ad.cta_text ?? undefined,
    cta_link: ad.cta_link ?? undefined,
    background_color: ad.background_color ?? undefined,
  }));

  return (
    <section className="container pb-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ads.map((ad) => (
          <AdBannerCard key={ad._id} booking={ad} aspectRatio="16/10" />
        ))}
      </div>
    </section>
  );
}
