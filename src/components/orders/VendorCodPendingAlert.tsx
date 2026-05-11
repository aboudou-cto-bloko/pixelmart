// filepath: src/components/orders/VendorCodPendingAlert.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Id } from "../../../convex/_generated/dataModel";

interface VendorCodPendingAlertProps {
  storeId: Id<"stores">;
  onViewOrder: (id: string) => void;
}

export function VendorCodPendingAlert({
  storeId,
  onViewOrder,
}: VendorCodPendingAlertProps) {
  const pendingCodOrders = useQuery(
    api.orders.cod_payment.listStorePendingCodPayments,
    { storeId },
  );

  if (!pendingCodOrders || pendingCodOrders.length === 0) return null;

  const totalPending = pendingCodOrders.reduce(
    (sum, o) => sum + o.total_amount,
    0,
  );

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <Clock className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-900 dark:text-orange-200 flex items-center gap-2">
        Paiements COD en attente
        <Badge className="bg-orange-600 text-white text-xs">
          {pendingCodOrders.length}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-orange-800 dark:text-orange-300 text-sm">
          {pendingCodOrders.length} commande
          {pendingCodOrders.length > 1 ? "s livrées" : " livrée"} en attente de
          paiement client — <strong>{formatPrice(totalPending, "XOF")}</strong>{" "}
          à percevoir.
        </p>

        <div className="space-y-2">
          {pendingCodOrders.slice(0, 3).map((order) => (
            <div
              key={order._id}
              className="flex items-center justify-between rounded-md bg-white/60 dark:bg-orange-900/20 px-3 py-2 text-sm"
            >
              <div className="space-y-0.5">
                <div className="font-medium text-orange-900 dark:text-orange-200">
                  #{order.order_number}
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-400">
                  {order.customer_name}
                  {order.days_since_delivery !== null &&
                    order.days_since_delivery > 0 && (
                      <span className="ml-2 text-orange-500">
                        • livré il y a {order.days_since_delivery}j
                      </span>
                    )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-orange-900 dark:text-orange-200">
                  {formatPrice(order.total_amount, order.currency)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-orange-700 hover:text-orange-900"
                  onClick={() => onViewOrder(order._id)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {pendingCodOrders.length > 3 && (
            <p className="text-xs text-orange-700 dark:text-orange-400 text-center">
              +{pendingCodOrders.length - 3} autre
              {pendingCodOrders.length - 3 > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
