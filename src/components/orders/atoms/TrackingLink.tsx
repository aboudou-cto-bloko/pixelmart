// filepath: src/components/orders/atoms/TrackingLink.tsx

"use client";

import { ExternalLink, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackingLinkProps {
  trackingNumber: string;
  carrier?: string;
  className?: string;
}

const TRACKING_URLS: Record<string, (num: string) => string> = {
  dhl: (num) => `https://www.dhl.com/fr-fr/home/suivi.html?tracking-id=${num}`,
  fedex: (num) => `https://www.fedex.com/fedextrack/?trknbr=${num}`,
  ups: (num) => `https://www.ups.com/track?tracknum=${num}`,
  chronopost: (num) =>
    `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${num}`,
  laposte: (num) =>
    `https://www.laposte.fr/outils/suivre-vos-envois?code=${num}`,
};

function getTrackingUrl(
  carrier: string | undefined,
  trackingNumber: string,
): string | null {
  if (!carrier) return null;
  const builder = TRACKING_URLS[carrier.toLowerCase()];
  return builder ? builder(trackingNumber) : null;
}

export function TrackingLink({
  trackingNumber,
  carrier,
  className,
}: TrackingLinkProps) {
  const url = getTrackingUrl(carrier, trackingNumber);

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <Package className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="font-mono text-xs">{trackingNumber}</span>
      {carrier && (
        <span className="text-xs text-muted-foreground capitalize">
          ({carrier})
        </span>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          <span className="sr-only">Suivre le colis</span>
        </a>
      )}
    </div>
  );
}
