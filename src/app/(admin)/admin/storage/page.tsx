// filepath: src/app/(admin)/admin/storage/page.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminStorageTemplate } from "@/components/admin/templates/AdminStorageTemplate";

export default function AdminStoragePage() {
  const requests = useQuery(api.admin.queries.listStorageRequests);
  const pendingWithdrawals = useQuery(api.storage.queries.getPendingWithdrawals);
  return (
    <AdminStorageTemplate
      requests={requests ?? []}
      pendingWithdrawals={pendingWithdrawals ?? []}
    />
  );
}
