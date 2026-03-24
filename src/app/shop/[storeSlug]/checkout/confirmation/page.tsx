"use client";

// filepath: src/app/shop/[storeSlug]/checkout/confirmation/page.tsx

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  CreditCard,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SHOP_ROUTES, ROUTES } from "@/constants/routes";

function ConfirmationContent() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const searchParams = useSearchParams();

  const orderNumber = searchParams.get("order") ?? "";
  const isPaid = searchParams.get("paid") === "true";
  const isCOD = searchParams.get("cod") === "true";

  if (!orderNumber) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <h1 className="mb-4 text-xl font-bold">Aucune commande trouvée</h1>
        <Button asChild>
          <Link href={SHOP_ROUTES.PRODUCTS(storeSlug)}>
            Retour aux produits
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-10">
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
            <h1 className="text-2xl font-bold mb-2">Commande confirmée !</h1>
            <p className="text-muted-foreground text-sm">
              Merci pour votre achat. Vous allez recevoir un email de
              confirmation.
            </p>
          </div>

          {/* Payment status */}
          {isPaid && (
            <Badge className="gap-1.5 py-1.5 px-4 text-green-700 bg-green-100 dark:bg-green-900/20 dark:text-green-400">
              <CreditCard className="size-3.5" />
              Paiement confirmé
            </Badge>
          )}
          {isCOD && (
            <Badge className="gap-1.5 py-1.5 px-4 text-blue-700 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">
              <Banknote className="size-3.5" />
              Paiement à la livraison
            </Badge>
          )}

          <Separator />

          {/* Order number */}
          <div>
            <p className="text-sm font-medium mb-2">Numéro de commande</p>
            <Badge variant="secondary" className="text-sm py-1.5 px-4 gap-1.5">
              <Package className="size-3.5" />
              {orderNumber}
            </Badge>
          </div>

          <Separator />

          {/* Steps */}
          <div className="text-left bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Prochaines étapes :</p>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              {isCOD ? (
                <>
                  <li>Le vendeur prépare votre commande</li>
                  <li>Un livreur vous contactera</li>
                  <li>Préparez le montant exact pour la livraison</li>
                </>
              ) : (
                <>
                  <li>Le vendeur prépare votre commande</li>
                  <li>Vous recevrez un numéro de suivi par email</li>
                  <li>Suivez votre livraison depuis votre espace client</li>
                </>
              )}
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href={ROUTES.CUSTOMER_ORDERS}>
                Voir mes commandes
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={SHOP_ROUTES.PRODUCTS(storeSlug)}>
                Continuer mes achats
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ShopConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  );
}
