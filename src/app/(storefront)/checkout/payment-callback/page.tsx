// filepath: src/app/(storefront)/checkout/payment-callback/page.tsx

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import {
  getPaymentQueue,
  markOrderPaid,
  getNextPendingOrderId,
  clearPaymentQueue,
  getAllPaidOrderNumbers,
} from "@/lib/payment-queue";
import type { Id } from "../../../../../convex/_generated/dataModel";

type CallbackStatus =
  | "verifying"
  | "success"
  | "failed"
  | "processing_next"
  | "all_done";

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId") as Id<"orders"> | null;
  const monerooStatus = searchParams.get("paymentStatus");

  const verifyPayment = useAction(api.payments.moneroo.verifyPayment);
  const initializePayment = useAction(api.payments.moneroo.initializePayment);

  const [status, setStatus] = useState<CallbackStatus>("verifying");
  const [error, setError] = useState<string | null>(null);

  // Récupérer les infos de la commande pour le numéro
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

    async function processCallback() {
      try {
        // 1. Vérifier le paiement auprès de Moneroo (source de vérité)
        const result = await verifyPayment({ orderId: orderId! });

        if (result.status === "success") {
          // 2. Marquer comme payé dans la queue locale
          const orderNumber = order?.order_number ?? "";
          markOrderPaid(orderId!, orderNumber);

          // 3. Vérifier s'il reste des commandes à payer
          const nextOrderId = getNextPendingOrderId();

          if (nextOrderId) {
            // Encore des commandes → initier le paiement suivant
            setStatus("processing_next");

            const { checkoutUrl } = await initializePayment({
              orderId: nextOrderId,
            });

            // Redirect vers Moneroo pour le prochain paiement
            window.location.href = checkoutUrl;
          } else {
            // Toutes les commandes sont payées
            setStatus("all_done");
          }
        } else if (
          result.status === "failed" ||
          result.status === "cancelled"
        ) {
          setStatus("failed");
          setError("Le paiement a échoué ou a été annulé.");
        } else {
          // pending / initiated — le paiement est encore en cours
          setStatus("verifying");
          // Retry après 3 secondes
          setTimeout(() => processCallback(), 3000);
        }
      } catch (err) {
        setStatus("failed");
        setError(err instanceof Error ? err.message : "Erreur de vérification");
      }
    }

    // Attendre que order soit chargé pour avoir le numéro
    if (order !== undefined) {
      processCallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, order !== undefined]);

  // ── Verifying ──
  if (status === "verifying") {
    return (
      <StatusCard
        icon={<Loader2 className="size-8 animate-spin text-primary" />}
        title="Vérification du paiement…"
        description="Nous confirmons votre paiement auprès de notre partenaire. Veuillez patienter."
      />
    );
  }

  // ── Processing next store ──
  if (status === "processing_next") {
    const queue = getPaymentQueue();
    const paidCount = queue.paid.length;
    const totalCount = paidCount + queue.pending.length;

    return (
      <StatusCard
        icon={<Loader2 className="size-8 animate-spin text-primary" />}
        title={`Paiement ${paidCount}/${totalCount} confirmé`}
        description="Redirection vers le paiement de la prochaine commande…"
      />
    );
  }

  // ── All done ──
  if (status === "all_done") {
    const paidNumbers = getAllPaidOrderNumbers();
    clearPaymentQueue();

    const ordersParam = paidNumbers.join(",");
    router.push(
      `${ROUTES.ORDER_CONFIRMATION}?orders=${encodeURIComponent(ordersParam)}&paid=true`,
    );
    return null;
  }

  // ── Failed ──
  return (
    <StatusCard
      icon={<XCircle className="size-8 text-destructive" />}
      title="Paiement échoué"
      description={error ?? "Le paiement n'a pas pu être complété."}
      actions={
        <>
          <Button
            onClick={() => {
              // Re-tenter le paiement pour cette commande
              if (orderId) {
                setStatus("verifying");
                initializePayment({ orderId })
                  .then(({ checkoutUrl }) => {
                    window.location.href = checkoutUrl;
                  })
                  .catch((err) => {
                    setError(err instanceof Error ? err.message : "Erreur");
                    setStatus("failed");
                  });
              }
            }}
          >
            Réessayer le paiement
          </Button>
          <Button variant="outline" asChild>
            <Link href={ROUTES.CUSTOMER_ORDERS}>Voir mes commandes</Link>
          </Button>
        </>
      }
    />
  );
}

// ─── Status Card ─────────────────────────────────────────────

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
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center">
              {icon}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {actions && <div className="flex flex-col gap-3 pt-2">{actions}</div>}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
