// filepath: src/components/affiliate/templates/VendorCommissionsTemplate.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { VendorCommissionsTable } from "../organisms/VendorCommissionsTable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StatusFilter = "all" | "pending" | "paid" | "cancelled";

export function VendorCommissionsTemplate() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const data = useQuery(api.affiliate.queries.listMyCommissions, {
    paginationOpts: { numItems: 50, cursor: null },
    status:
      statusFilter === "all"
        ? undefined
        : (statusFilter as "pending" | "paid" | "cancelled"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mes commissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historique des commissions générées par vos filleuls.
          </p>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="paid">Reçues</SelectItem>
            <SelectItem value="cancelled">Annulées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data ? (
        <VendorCommissionsTable commissions={data.page} />
      ) : (
        <Skeleton className="h-[300px] rounded-xl" />
      )}
    </div>
  );
}
