// filepath: src/app/(admin)/admin/delivery/page.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminDeliveryTemplate } from "@/components/admin/templates/AdminDeliveryTemplate";

export default function AdminDeliveryPage() {
  const rates = useQuery(api.admin.queries.listDeliveryRates);
  return <AdminDeliveryTemplate rates={rates ?? []} />;
}
