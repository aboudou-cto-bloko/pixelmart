// filepath: src/app/(vendor)/vendor/storage/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { VendorStorageTemplate } from "@/components/storage/templates/VendorStorageTemplate";
import type { Doc } from "../../../../../convex/_generated/dataModel";

type StorageStatus = Doc<"storage_requests">["status"];
type StatusFilter = StorageStatus | "all";

export default function VendorStoragePage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const store = useQuery(api.stores.queries.getMyStore);
  const requests = useQuery(
    api.storage.queries.getByStore,
    statusFilter === "all" ? {} : { status: statusFilter },
  );

  const stats = useQuery(api.storage.queries.getStats, {});

  // Pending orders count per in_stock item (pour afficher les opportunités d'expédition entrepôt)
  const inStockWithOrders = useQuery(api.storage.queries.getInStockWithPendingOrders, {});

  const isLoading = requests === undefined;

  // Fusionner les pending_orders_count dans les requests
  const enrichedRequests = (requests ?? []).map((req) => {
    const match = inStockWithOrders?.find((r) => r._id === req._id);
    return match
      ? { ...req, pending_orders_count: match.pending_orders_count }
      : req;
  });

  return (
    <VendorStorageTemplate
      requests={enrichedRequests}
      stats={stats ?? undefined}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      isLoading={isLoading}
      usePmService={store?.use_pixelmart_service ?? true}
    />
  );
}
