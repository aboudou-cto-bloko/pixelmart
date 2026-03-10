// filepath: src/components/storefront/atoms/AdSlotWrapper.tsx

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface AdSlotWrapperProps {
  bookingId?: Id<"ad_bookings">;
  href?: string;
  className?: string;
  children: React.ReactNode;
}

export function AdSlotWrapper({
  bookingId,
  href,
  className,
  children,
}: AdSlotWrapperProps) {
  const trackInteraction = useMutation(api.ads.mutations.trackInteraction);
  const hasTrackedImpression = useRef(false);

  // Track impression on mount (once)
  useEffect(() => {
    if (bookingId && !hasTrackedImpression.current) {
      hasTrackedImpression.current = true;
      trackInteraction({ booking_id: bookingId, type: "impression" });
    }
  }, [bookingId, trackInteraction]);

  const handleClick = useCallback(() => {
    if (bookingId) {
      trackInteraction({ booking_id: bookingId, type: "click" });
    }
  }, [bookingId, trackInteraction]);

  if (href) {
    return (
      <a href={href} onClick={handleClick} className={className}>
        {children}
      </a>
    );
  }

  return (
    <div onClick={handleClick} className={className}>
      {children}
    </div>
  );
}
