// filepath: src/components/vendor/VendorAnnouncementBanner.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { X } from "lucide-react";
import { api } from "../../../convex/_generated/api";

function getBannerStyle(
  bgType: "color" | "gradient" | "image",
  bgValue: string,
  bgImageUrl?: string | null,
): React.CSSProperties {
  if (bgType === "color") return { backgroundColor: bgValue };
  if (bgType === "gradient") return { background: bgValue };
  if (bgType === "image" && bgImageUrl)
    return {
      backgroundImage: `url(${bgImageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  return { backgroundColor: bgValue };
}

export function VendorAnnouncementBanner() {
  const banner = useQuery(api.admin.queries.getVendorBanner);

  // Keyed by updated_at so the banner re-appears when admin saves a new version
  const dismissKey = banner ? `pm_vendor_banner_${banner.updated_at}` : null;

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined" || !dismissKey) return false;
    return !!localStorage.getItem(dismissKey);
  });

  if (!banner || !banner.enabled || dismissed) return null;

  const bgStyle = getBannerStyle(
    banner.bg_type,
    banner.bg_value,
    banner.bg_image_url,
  );

  function dismiss() {
    if (dismissKey) localStorage.setItem(dismissKey, "1");
    setDismissed(true);
  }

  return (
    <div style={bgStyle} className="flex items-center gap-3 px-4 py-2 text-sm">
      <span
        style={{ color: banner.text_color }}
        className="flex-1 truncate font-medium"
      >
        {banner.text}
      </span>
      {banner.link_url && (
        <a
          href={banner.link_url}
          style={{ color: banner.text_color }}
          className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          {banner.link_text ?? "En savoir plus"}
        </a>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer le bandeau"
        style={{ color: banner.text_color }}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
