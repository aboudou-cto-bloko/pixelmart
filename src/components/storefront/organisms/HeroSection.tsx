// filepath: src/components/storefront/organisms/HeroSection.tsx

"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AdBannerCard } from "../molecules/AdBannerCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const heroMain = useQuery(api.ads.queries.getActiveAdsForSlot, {
    slot_id: "hero_main",
  });
  const heroSide = useQuery(api.ads.queries.getActiveAdsForSlot, {
    slot_id: "hero_side",
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const mainAds = heroMain ?? [];
  const sideAds = heroSide ?? [];

  // Auto-rotate
  useEffect(() => {
    if (mainAds.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mainAds.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [mainAds.length]);

  // Fallback si pas d'ads
  if (mainAds.length === 0 && sideAds.length === 0) {
    return null;
  }

  return (
    <section className="container py-4">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Main carousel */}
        <div className="relative overflow-hidden rounded-xl min-h-[280px] lg:min-h-[400px]">
          {mainAds.map((ad, i) => (
            <div
              key={ad._id}
              className={cn(
                "absolute inset-0 transition-opacity duration-500",
                i === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0",
              )}
            >
              <AdBannerCard
                booking={ad}
                aspectRatio="auto"
                className="h-full"
              />
            </div>
          ))}

          {/* Nav buttons */}
          {mainAds.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full opacity-80 hover:opacity-100"
                onClick={() =>
                  setCurrentSlide(
                    (prev) => (prev - 1 + mainAds.length) % mainAds.length,
                  )
                }
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 size-8 rounded-full opacity-80 hover:opacity-100"
                onClick={() =>
                  setCurrentSlide((prev) => (prev + 1) % mainAds.length)
                }
              >
                <ChevronRight className="size-4" />
              </Button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {mainAds.map((_, i) => (
                  <button
                    key={i}
                    className={cn(
                      "size-2 rounded-full transition-colors",
                      i === currentSlide ? "bg-white" : "bg-white/40",
                    )}
                    onClick={() => setCurrentSlide(i)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Side ads (stacked) */}
        <div className="hidden lg:flex flex-col gap-4">
          {sideAds.slice(0, 2).map((ad) => (
            <AdBannerCard
              key={ad._id}
              booking={ad}
              aspectRatio="1/1"
              className="flex-1"
            />
          ))}
          {sideAds.length === 0 && (
            <div className="flex-1 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-sm">
              Espace disponible
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
