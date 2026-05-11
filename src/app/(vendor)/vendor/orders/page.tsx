// filepath: src/app/(vendor)/vendor/orders/page.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { VendorOrdersTemplate } from "@/components/orders/templates/VendorOrdersTemplate";
import { VendorCodPendingAlert } from "@/components/orders/VendorCodPendingAlert";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

type OrderStatus = Doc<"orders">["status"];
type StatusFilter = OrderStatus | "all";

export default function VendorOrdersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filterArg =
    statusFilter === "all" ? {} : { status: statusFilter as OrderStatus };

  const orders = useQuery(api.orders.queries.listByStore, filterArg);
  const statusCounts = useQuery(api.orders.queries.getStatusCounts);
  const activeStore = useQuery(api.stores.queries.getMyStore);

  return (
    <div className="space-y-4">
      {/* Alerte COD en attente de paiement */}
      {activeStore && (
        <div className="px-4 pt-4 sm:px-6">
          <VendorCodPendingAlert
            storeId={activeStore._id as Id<"stores">}
            onViewOrder={(id) => router.push(`/vendor/orders/${id}`)}
          />
        </div>
      )}

      <VendorOrdersTemplate
        orders={orders ?? []}
        isLoading={orders === undefined}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onViewOrder={(id) => router.push(`/vendor/orders/${id}`)}
        statusCounts={statusCounts ?? undefined}
      />
    </div>
  );
}
