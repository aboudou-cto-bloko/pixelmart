// filepath: src/components/orders/CodPaymentButton.tsx

"use client";

import { useMemo, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Clock } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

interface CodPaymentButtonProps {
  orderId: Id<"orders">;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  orderStatus: string;
  deliveredAt?: number;
}

export function CodPaymentButton({
  orderId,
  totalAmount,
  currency,
  paymentStatus,
  orderStatus,
  deliveredAt,
}: CodPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [now] = useState<number>(() => Date.now());
  const initiateCodPayment = useAction(
    api.orders.cod_payment.initiateCodPayment,
  );

  const daysSinceDelivery = useMemo(
    () => (deliveredAt ? Math.floor((now - deliveredAt) / 86_400_000) : 0),
    [deliveredAt, now],
  );

  if (paymentStatus !== "pending_cod" || orderStatus !== "delivered") {
    return null;
  }

  const handlePay = async () => {
    setIsLoading(true);
    try {
      const { checkoutUrl } = await initiateCodPayment({ orderId });
      window.location.href = checkoutUrl;
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Erreur lors du paiement";
      toast.error(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Alert className="border-orange-200 bg-orange-50">
        <Clock className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          Votre commande a été livrée
          {daysSinceDelivery > 0
            ? ` il y a ${daysSinceDelivery} jour${daysSinceDelivery > 1 ? "s" : ""}`
            : " aujourd'hui"}
          . Finalisez votre paiement ci-dessous.
        </AlertDescription>
      </Alert>

      <Button
        onClick={handlePay}
        disabled={isLoading}
        size="lg"
        className="w-full"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        {isLoading
          ? "Redirection vers le paiement…"
          : `Payer ${formatPrice(totalAmount, currency)} maintenant`}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Paiement sécurisé via Mobile Money (MTN, Orange, Wave, Flooz)
      </p>
    </div>
  );
}
