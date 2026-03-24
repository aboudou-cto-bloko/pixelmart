"use client";

// filepath: src/app/shop/[storeSlug]/checkout/payment-callback/page.tsx

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SHOP_ROUTES, ROUTES } from "@/constants/routes";
import type { Id } from "../../../../../../convex/_generated/dataModel";

function StatusCard({
  icon,
  title,
  description,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="max-w-lg mx-auto py-16">
      <Card>
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center">
              {icon}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          {actions && <div className="flex flex-col gap-3">{actions}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

function ShopPaymentCallbackContent() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId") as Id<"orders"> | null;

  const verifyPayment = useAction(api.payments.moneroo.verifyPayment);
  const initializePayment = useAction(
    api.payments.moneroo.initializeShopPayment,
  );

  const [status, setStatus] = useState<
    "verifying" | "success" | "failed" | "retrying"
  >("verifying");
  const [error, setError] = useState<string | null>(null);

  const order = useQuery(
    api.orders.queries.getById,
    orderId ? { orderId } : "skip",
  );

  useEffect(() => {
    if (!orderId) {
      setStatus("failed");
      setError("Identifiant de commande manquant");
      return;
    }
    if (order === undefined) return; // Loading

    async function processCallback() {
      try {
        const result = await verifyPayment({ orderId: orderId! });

        if (result.status === "success") {
          setStatus("success");
          const orderNum = order?.order_number ?? "";
          router.push(
            `${SHOP_ROUTES.CONFIRMATION(storeSlug)}?order=${encodeURIComponent(orderNum)}&paid=true`,
          );
        } else if (
          result.status === "failed" ||
          result.status === "cancelled"
        ) {
          setStatus("failed");
          setError("Le paiement a échoué ou a été annulé.");
        } else {
          // pending — retry
          setTimeout(() => processCallback(), 3000);
        }
      } catch (err) {
        setStatus("failed");
        setError(err instanceof Error ? err.message : "Erreur de vérification");
      }
    }

    processCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, order !== undefined]);

  if (status === "verifying") {
    return (
      <StatusCard
        icon={<Loader2 className="size-8 animate-spin text-primary" />}
        title="Vérification du paiement…"
        description="Nous confirmons votre paiement. Veuillez patienter."
      />
    );
  }

  if (status === "success") {
    return (
      <StatusCard
        icon={<CheckCircle2 className="size-8 text-green-600" />}
        title="Paiement confirmé !"
        description="Redirection vers la confirmation de commande…"
      />
    );
  }

  if (status === "retrying") {
    return (
      <StatusCard
        icon={<Loader2 className="size-8 animate-spin text-primary" />}
        title="Redirection vers le paiement…"
        description="Veuillez patienter."
      />
    );
  }

  return (
    <StatusCard
      icon={<XCircle className="size-8 text-destructive" />}
      title="Paiement échoué"
      description={error ?? "Le paiement n'a pas pu être complété."}
      actions={
        <>
          {orderId && (
            <Button
              onClick={async () => {
                try {
                  setStatus("retrying");
                  const { checkoutUrl } = await initializePayment({
                    orderId,
                    storeSlug,
                  });
                  window.location.href = checkoutUrl;
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Erreur");
                  setStatus("failed");
                }
              }}
            >
              Réessayer le paiement
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={ROUTES.CUSTOMER_ORDERS}>Voir mes commandes</Link>
          </Button>
        </>
      }
    />
  );
}

export default function ShopPaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ShopPaymentCallbackContent />
    </Suspense>
  );
}
