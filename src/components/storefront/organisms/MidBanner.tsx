// filepath: src/components/storefront/organisms/MidBanner.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AdBannerCard } from "../molecules/AdBannerCard";

export function MidBanner() {
  const ads = useQuery(api.ads.queries.getActiveAdsForSlot, {
    slot_id: "mid_banner",
  });

  if (!ads || ads.length === 0) return null;

  return (
    <section className="container py-4">
      <AdBannerCard booking={ads[0]} aspectRatio="6/1" className="w-full" />
    </section>
  );
}
