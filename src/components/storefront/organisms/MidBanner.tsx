"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AdBannerCard } from "../molecules/AdBannerCard";

export function MidBanner() {
  const rawAds = useQuery(api.ads.queries.getActiveAdsForSlot, {
    slot_id: "mid_banner",
  });

  if (!rawAds || rawAds.length === 0) return null;

  // Normalisation des données
  const ad = {
    ...rawAds[0],
    image_url: rawAds[0].image_url ?? undefined,
    title: rawAds[0].title ?? undefined,
    subtitle: rawAds[0].subtitle ?? undefined,
    cta_text: rawAds[0].cta_text ?? undefined,
    cta_link: rawAds[0].cta_link ?? undefined,
    background_color: rawAds[0].background_color ?? undefined,
  };

  return (
    <section className="container py-4">
      <AdBannerCard booking={ad} aspectRatio="6/1" className="w-full" />
    </section>
  );
}
