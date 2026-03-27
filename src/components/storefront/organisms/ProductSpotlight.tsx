// filepath: src/components/storefront/organisms/ProductSpotlight.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AdSlotWrapper } from "../atoms/AdSlotWrapper";
import { PriceTag } from "../atoms/PriceTag";

import { Button } from "@/components/ui/button";
import Image from "next/image";

export function ProductSpotlight() {
  const ads = useQuery(api.ads.queries.getActiveAdsForSlot, {
    slot_id: "product_spotlight",
  });

  if (!ads || ads.length === 0) return null;

  const ad = ads[0];

  return (
    <section className="bg-muted/50 py-8">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-8 items-center">
          {/* Left: Featured product info */}
          <AdSlotWrapper
            bookingId={ad._id}
            href={ad.cta_link ?? undefined}
            className="space-y-4"
          >
            {ad.product ? (
              <>
                <h2 className="text-2xl font-bold leading-tight">
                  {ad.product.title}
                </h2>
                <PriceTag
                  price={ad.product.price}
                  comparePrice={ad.product.compare_price}
                  size="lg"
                />
                <Button>{ad.cta_text ?? "Découvrir"}</Button>
              </>
            ) : (
              <>
                {ad.title && <h2 className="text-2xl font-bold">{ad.title}</h2>}
                {ad.subtitle && (
                  <p className="text-muted-foreground">{ad.subtitle}</p>
                )}
                <Button>{ad.cta_text ?? "En savoir plus"}</Button>
              </>
            )}
          </AdSlotWrapper>

          {/* Right: companion products or images */}
          <div className="flex gap-4 overflow-x-auto">
            {ad.image_url && (
              <div className="relative w-full min-h-[200px] rounded-xl overflow-hidden">
                <Image
                  src={ad.image_url}
                  alt={ad.title ?? "Spotlight"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
