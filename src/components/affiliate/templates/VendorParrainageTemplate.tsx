// filepath: src/components/affiliate/templates/VendorParrainageTemplate.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { VendorAffiliateStatsBar } from "../organisms/VendorAffiliateStatsBar";
import { VendorAffiliateLinksTable } from "../organisms/VendorAffiliateLinksTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";

export function VendorParrainageTemplate() {
  const stats = useQuery(api.affiliate.queries.getMyAffiliateStats);
  const links = useQuery(api.affiliate.queries.listMyAffiliateLinks);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Programme de parrainage</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Parrainez de nouveaux vendeurs et gagnez des commissions sur leurs
          ventes.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Vos liens sont générés par l&apos;administration Pixel-Mart. Contactez
          le support pour obtenir un lien affilié ou modifier les paramètres de
          commission.
        </p>
      </div>

      {stats !== undefined ? (
        stats ? (
          <VendorAffiliateStatsBar stats={stats} />
        ) : null
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Mes liens de parrainage</h2>
        {links !== undefined ? (
          <VendorAffiliateLinksTable links={links} />
        ) : (
          <Skeleton className="h-[200px] rounded-xl" />
        )}
      </div>
    </div>
  );
}
