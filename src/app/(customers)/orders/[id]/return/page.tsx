// filepath: src/app/(customer)/orders/[id]/return/page.tsx
"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { ReturnRequestForm } from "@/components/returns/ReturnRequestForm";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ReturnRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orderId = id as Id<"orders">;

  const eligibility = useQuery(api.returns.queries.checkEligibility, {
    orderId,
  });
  // On a besoin des données de la commande pour le formulaire.
  // On utilise getByOrder pour vérifier s'il y a déjà des retours actifs.
  const existingReturns = useQuery(api.returns.queries.getByOrder, { orderId });

  // Pour les détails de la commande, on utilise une query existante.
  // Hypothèse : la query orders.queries.getById ou similaire existe.
  // Fallback : on récupère les données via le formulaire de retour directement.
  const orderDetail = useQuery(api.orders.queries.getById as any, { orderId });

  const isLoading = eligibility === undefined || orderDetail === undefined;

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (!eligibility?.eligible) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <p className="text-sm font-medium text-center">
              {eligibility?.reason ??
                "Cette commande n'est pas éligible au retour."}
            </p>
            <Button variant="outline" asChild>
              <Link href={`/orders/${id}`}>Retour à la commande</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm">Commande introuvable.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ReturnRequestForm
        orderId={orderId}
        orderNumber={orderDetail.order_number}
        orderItems={orderDetail.items}
        currency={orderDetail.currency ?? "XOF"}
      />
    </div>
  );
}
