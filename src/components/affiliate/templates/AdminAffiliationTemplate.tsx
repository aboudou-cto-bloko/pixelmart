// filepath: src/components/affiliate/templates/AdminAffiliationTemplate.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AdminAffiliateStatsBar } from "../organisms/AdminAffiliateStatsBar";
import { AdminAffiliateLinkTable } from "../organisms/AdminAffiliateLinkTable";
import { AdminCreateAffiliateLinkForm } from "../organisms/AdminCreateAffiliateLinkForm";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminAffiliationTemplate() {
  const statsRaw = useQuery(api.affiliate.queries.getCommissionsStats);
  const linksRaw = useQuery(api.affiliate.queries.listAffiliateLinkAdmin, {
    paginationOpts: { numItems: 50, cursor: null },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Affiliation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les liens de parrainage et suivez les commissions générées.
          </p>
        </div>
        <AdminCreateAffiliateLinkForm />
      </div>

      {statsRaw ? (
        <AdminAffiliateStatsBar stats={statsRaw} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Liens affiliés</h2>
        {linksRaw ? (
          <AdminAffiliateLinkTable links={linksRaw.page} />
        ) : (
          <Skeleton className="h-[200px] rounded-xl" />
        )}
      </div>
    </div>
  );
}
