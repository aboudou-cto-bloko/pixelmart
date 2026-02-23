// filepath: src/app/(storefront)/checkout/confirmation/page.tsx

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/constants/routes";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const ordersParam = searchParams.get("orders") ?? "";
  const orderNumbers = ordersParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (orderNumbers.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="mb-4">Aucune commande</h1>
        <Button asChild>
          <Link href={ROUTES.PRODUCTS}>Retour au catalogue</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardContent className="p-8 text-center space-y-6">
          {/* Success icon */}
          <div className="flex justify-center">
            <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Commande{orderNumbers.length > 1 ? "s" : ""} confirmée
              {orderNumbers.length > 1 ? "s" : ""}
            </h1>
            <p className="text-muted-foreground">
              Merci pour votre achat ! Vous recevrez un email de confirmation.
            </p>
          </div>

          <Separator />

          {/* Order numbers */}
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {orderNumbers.length > 1
                ? "Numéros de commande :"
                : "Numéro de commande :"}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {orderNumbers.map((num) => (
                <Badge
                  key={num}
                  variant="secondary"
                  className="text-sm py-1.5 px-4 gap-1.5"
                >
                  <Package className="size-3.5" />
                  {num}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Next steps */}
          <div className="text-left bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Prochaines étapes :</p>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Finalisez le paiement via la méthode choisie</li>
              <li>Le vendeur préparera votre commande</li>
              <li>Vous recevrez un numéro de suivi</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button asChild>
              <Link href={ROUTES.CUSTOMER_ORDERS}>
                Voir mes commandes
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.PRODUCTS}>Continuer mes achats</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  );
}
