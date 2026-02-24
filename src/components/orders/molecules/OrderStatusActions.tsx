// filepath: src/components/orders/molecules/OrderStatusActions.tsx

"use client";

import { Package, Truck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

interface OrderStatusActionsProps {
  status: OrderStatus;
  onProcess: () => void;
  onShip: () => void;
  onDeliver: () => void;
  isLoading?: boolean;
}

/**
 * Boutons d'action contextuels selon le statut actuel.
 * Seules les transitions autorisées sont affichées.
 */
export function OrderStatusActions({
  status,
  onProcess,
  onShip,
  onDeliver,
  isLoading,
}: OrderStatusActionsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {status === "paid" && (
        <Button onClick={onProcess} disabled={isLoading} size="sm">
          <Package className="mr-1.5 h-3.5 w-3.5" />
          Prendre en charge
        </Button>
      )}
      {status === "processing" && (
        <Button onClick={onShip} disabled={isLoading} size="sm">
          <Truck className="mr-1.5 h-3.5 w-3.5" />
          Marquer comme expédié
        </Button>
      )}
      {status === "shipped" && (
        <Button
          onClick={onDeliver}
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
          Confirmer la livraison
        </Button>
      )}
    </div>
  );
}
