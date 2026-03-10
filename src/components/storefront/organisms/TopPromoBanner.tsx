// filepath: src/components/storefront/organisms/TopPromoBanner.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AdSlotWrapper } from "../atoms/AdSlotWrapper";
import { X } from "lucide-react";
import { useState } from "react";

export function TopPromoBanner() {
  const [dismissed, setDismissed] = useState(false);
  const ads = useQuery(api.ads.queries.getActiveAdsForSlot, {
    slot_id: "top_banner",
  });

  if (dismissed || !ads || ads.length === 0) return null;

  const ad = ads[0]; // Single slot

  return (
    <div className="relative bg-primary text-primary-foreground">
      <AdSlotWrapper
        bookingId={ad._id}
        href={ad.cta_link ?? undefined}
        className="flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium"
      >
        {ad.title && <span>{ad.title}</span>}
        {ad.subtitle && (
          <span className="hidden sm:inline text-primary-foreground/80">
            — {ad.subtitle}
          </span>
        )}
        {ad.cta_text && (
          <span className="underline underline-offset-2 font-semibold">
            {ad.cta_text}
          </span>
        )}
      </AdSlotWrapper>

      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-foreground/60 hover:text-primary-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
