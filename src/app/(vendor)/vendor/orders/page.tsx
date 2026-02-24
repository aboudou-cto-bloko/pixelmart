// filepath: src/app/(vendor)/vendor/orders/page.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { VendorOrdersTemplate } from "@/components/orders/templates/VendorOrdersTemplate";

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
type StatusFilter = OrderStatus | "all";

export default function VendorOrdersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filterArg =
    statusFilter === "all" ? {} : { status: statusFilter as OrderStatus };

  const orders = useQuery(api.orders.queries.listByStore, filterArg);
  const statusCounts = useQuery(api.orders.queries.getStatusCounts);

  return (
    <VendorOrdersTemplate
      orders={orders ?? []}
      isLoading={orders === undefined}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      onViewOrder={(id) => router.push(`/vendor/orders/${id}`)}
      statusCounts={statusCounts ?? undefined}
    />
  );
}
