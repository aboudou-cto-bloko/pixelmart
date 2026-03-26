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

  const requests = useQuery(
    api.storage.queries.getByStore,
    statusFilter === "all" ? {} : { status: statusFilter },
  );

  const stats = useQuery(api.storage.queries.getStats, {});

  const isLoading = requests === undefined;

  return (
    <VendorStorageTemplate
      requests={requests ?? []}
      stats={stats ?? undefined}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      isLoading={isLoading}
    />
  );
}
