// filepath: src/components/orders/molecules/OrderStatusActions.tsx

"use client";

import { Button } from "@/components/ui/button";
import {
  Loader2,
  PlayCircle,
  Truck,
  CheckCircle,
  FlaskConical,
} from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";

type OrderStatus = Doc<"orders">["status"];

interface OrderStatusActionsProps {
  status: OrderStatus;
  onProcess: () => void;
  onShip: () => void;
  onDeliver: () => void;
  isLoading: boolean;
  isDemo?: boolean;
  onSimulatePayment?: () => void;
}

export function OrderStatusActions({
  status,
  onProcess,
  onShip,
  onDeliver,
  isLoading,
  isDemo,
  onSimulatePayment,
}: OrderStatusActionsProps) {
  // Pas d'actions pour les statuts terminaux
  if (
    status === "cancelled" ||
    status === "refunded" ||
    status === "delivered"
  ) {
    return null;
  }

  // For demo accounts with pending orders, show simulate payment button
  if (status === "pending" && !isDemo) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Demo: Pending → simulate payment */}
      {status === "pending" && isDemo && onSimulatePayment && (
        <Button
          size="sm"
          variant="outline"
          onClick={onSimulatePayment}
          disabled={isLoading}
          className="border-primary/40 text-primary hover:bg-primary/10"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <FlaskConical className="h-4 w-4 mr-1.5" />
          )}
          Simuler le paiement
        </Button>
      )}

      {/* Paid → Processing */}
      {status === "paid" && (
        <Button size="sm" onClick={onProcess} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <PlayCircle className="h-4 w-4 mr-1.5" />
          )}
          Prendre en charge
        </Button>
      )}

      {/* Processing ou Ready → Shipped */}
      {(status === "processing" || status === "ready_for_delivery") && (
        <Button size="sm" onClick={onShip} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Truck className="h-4 w-4 mr-1.5" />
          )}
          Marquer comme expédié
        </Button>
      )}

      {/* Shipped → Delivered */}
      {status === "shipped" && (
        <Button size="sm" onClick={onDeliver} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-1.5" />
          )}
          Confirmer la livraison
        </Button>
      )}

      {/* Delivery failed → Retry */}
      {status === "delivery_failed" && (
        <Button
          size="sm"
          variant="outline"
          onClick={onShip}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Truck className="h-4 w-4 mr-1.5" />
          )}
          Réexpédier
        </Button>
      )}
    </div>
  );
}
