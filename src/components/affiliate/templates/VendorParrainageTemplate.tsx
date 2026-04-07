// filepath: src/components/affiliate/templates/VendorParrainageTemplate.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { VendorAffiliateStatsBar } from "../organisms/VendorAffiliateStatsBar";
import { VendorAffiliateLinksTable } from "../organisms/VendorAffiliateLinksTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, Lock } from "lucide-react";

export function VendorParrainageTemplate() {
  const isAffiliate = useQuery(
    api.affiliate.queries.isEnrolledInAffiliateProgram,
  );
  const stats = useQuery(api.affiliate.queries.getMyAffiliateStats);
  const links = useQuery(api.affiliate.queries.listMyAffiliateLinks);

  // Guard — vendeur non inscrit au programme
  if (isAffiliate === false) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="rounded-full bg-muted p-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Accès restreint</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Vous n&apos;êtes pas encore inscrit au programme de parrainage.
            Contactez l&apos;administration Pixel-Mart pour en faire la demande.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isAffiliate === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    );
  }

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
          le support pour modifier les paramètres de commission.
        </p>
      </div>

      {stats ? (
        <VendorAffiliateStatsBar stats={stats} />
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
