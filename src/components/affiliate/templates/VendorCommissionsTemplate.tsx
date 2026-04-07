// filepath: src/components/affiliate/templates/VendorCommissionsTemplate.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { VendorCommissionsTable } from "../organisms/VendorCommissionsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StatusFilter = "all" | "pending" | "paid" | "cancelled";

export function VendorCommissionsTemplate() {
  const isAffiliate = useQuery(
    api.affiliate.queries.isEnrolledInAffiliateProgram,
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Tous les hooks AVANT tout early return (règles des hooks React)
  const data = useQuery(api.affiliate.queries.listMyCommissions, {
    paginationOpts: { numItems: 50, cursor: null },
    status:
      statusFilter === "all"
        ? undefined
        : (statusFilter as "pending" | "paid" | "cancelled"),
  });

  if (isAffiliate === false) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="rounded-full bg-muted p-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Accès restreint</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Vous n&apos;êtes pas inscrit au programme de parrainage.
          </p>
        </div>
      </div>
    );
  }

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
