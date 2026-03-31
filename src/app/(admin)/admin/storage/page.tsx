// filepath: src/app/(admin)/admin/storage/page.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminStorageTemplate } from "@/components/admin/templates/AdminStorageTemplate";

export default function AdminStoragePage() {
  const data = useQuery(api.admin.queries.listStorageInvoices);
  return (
    <AdminStorageTemplate
      invoices={data?.invoices ?? []}
      totalRevenue={data?.totalRevenue ?? 0}
      totalUnpaid={data?.totalUnpaid ?? 0}
      overdueCount={data?.overdueCount ?? 0}
    />
  );
}
