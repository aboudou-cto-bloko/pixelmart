// filepath: src/app/(customer)/returns/page.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { CustomerReturnCard } from "@/components/returns/CustomerReturnCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";

export default function CustomerReturnsPage() {
  const returns = useQuery(api.returns.queries.listByCustomer, { limit: 30 });
  const isLoading = returns === undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Mes retours</h1>
        <p className="text-sm text-muted-foreground">
          Suivez l&apos;état de vos demandes de retour et remboursements.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      )}

      {returns && returns.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucune demande de retour</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vous pouvez demander un retour depuis le détail d&apos;une commande
            livrée.
          </p>
        </div>
      )}

      {returns && returns.length > 0 && (
        <div className="space-y-3">
          {returns.map((ret) => (
            <CustomerReturnCard key={ret._id} returnRequest={ret as any} />
          ))}
        </div>
      )}
    </div>
  );
}
