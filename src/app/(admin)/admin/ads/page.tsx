// filepath: src/app/(admin)/admin/ads/page.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminAdsTemplate } from "@/components/admin/templates/AdminAdsTemplate";

export default function AdminAdsPage() {
  const bookings = useQuery(api.ads.queries.listAllBookings, {});
  const spaces = useQuery(api.admin.queries.listAdSpaces);

  return (
    <AdminAdsTemplate
      bookings={bookings ?? []}
      spaces={spaces ?? []}
    />
  );
}
