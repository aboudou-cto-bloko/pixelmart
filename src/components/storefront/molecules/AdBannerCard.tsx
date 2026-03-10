// filepath: src/components/storefront/molecules/AdBannerCard.tsx

"use client";

import Image from "next/image";
import { AdSlotWrapper } from "../atoms/AdSlotWrapper";
import { Button } from "@/components/ui/button";
import type { Id } from "../../../../convex/_generated/dataModel";

interface AdBannerCardProps {
  booking: {
    _id: Id<"ad_bookings">;
    image_url?: string;
    title?: string;
    subtitle?: string;
    cta_text?: string;
    cta_link?: string;
    background_color?: string;
  };
  aspectRatio?: string; // e.g. "16/9", "4/3"
  className?: string;
}

export function AdBannerCard({
  booking,
  aspectRatio = "16/9",
  className,
}: AdBannerCardProps) {
  return (
    <AdSlotWrapper
      bookingId={booking._id}
      href={booking.cta_link}
      className={className}
    >
      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          aspectRatio,
          backgroundColor: booking.background_color || "#1a1a2e",
        }}
      >
        {booking.image_url && (
          <Image
            src={booking.image_url}
            alt={booking.title || "Promotion"}
            fill
            className="object-cover"
          />
        )}

        {/* Overlay content */}
        {(booking.title || booking.cta_text) && (
          <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 to-transparent">
            {booking.title && (
              <h3 className="text-white font-bold text-lg leading-tight">
                {booking.title}
              </h3>
            )}
            {booking.subtitle && (
              <p className="text-white/80 text-sm mt-1">{booking.subtitle}</p>
            )}
            {booking.cta_text && (
              <Button size="sm" className="mt-3 w-fit">
                {booking.cta_text}
              </Button>
            )}
          </div>
        )}
      </div>
    </AdSlotWrapper>
  );
}
