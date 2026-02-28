// filepath: src/components/returns/CustomerReturnCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ReturnStatusBadge } from "./ReturnStatusBadge";
import { ReturnReasonBadge } from "./ReturnReasonBadge";
import { formatPrice, formatDate } from "@/lib/format";
import type { ReasonCategory } from "./ReturnReasonBadge";
import { Package, Store } from "lucide-react";

interface CustomerReturnCardProps {
  returnRequest: {
    _id: string;
    order_number: string;
    store_name: string;
    status: "requested" | "approved" | "rejected" | "received" | "refunded";
    reason_category: ReasonCategory;
    reason: string;
    refund_amount: number;
    items: Array<{ title: string; quantity: number; unit_price: number }>;
    requested_at: number;
    rejection_reason?: string;
    vendor_notes?: string;
  };
  currency?: string;
}

export function CustomerReturnCard({
  returnRequest: ret,
  currency = "XOF",
}: CustomerReturnCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium">Commande {ret.order_number}</p>
              <ReturnStatusBadge status={ret.status} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Store className="h-3 w-3" />
              <span>{ret.store_name}</span>
              <span>·</span>
              <span>
                {formatDate(ret.requested_at, {
                  hour: undefined,
                  minute: undefined,
                })}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold">
              {formatPrice(ret.refund_amount, currency)}
            </p>
            <p className="text-xs text-muted-foreground">Remboursement</p>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1 mb-3">
          {ret.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Package className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.title}</span>
              <span className="shrink-0">× {item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Raison */}
        <div className="flex items-center gap-2">
          <ReturnReasonBadge category={ret.reason_category} />
          <p className="text-xs text-muted-foreground truncate">{ret.reason}</p>
        </div>

        {/* Notes vendeur / Motif rejet */}
        {ret.status === "rejected" && ret.rejection_reason && (
          <div className="mt-3 rounded-md bg-red-500/5 border border-red-500/20 p-2.5">
            <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-0.5">
              Motif du refus
            </p>
            <p className="text-xs text-red-600 dark:text-red-300">
              {ret.rejection_reason}
            </p>
          </div>
        )}

        {ret.vendor_notes && ret.status !== "rejected" && (
          <div className="mt-3 rounded-md bg-muted/50 p-2.5">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">
              Note du vendeur
            </p>
            <p className="text-xs">{ret.vendor_notes}</p>
          </div>
        )}

        {/* Status-specific help text */}
        {ret.status === "approved" && (
          <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">
            Retour approuvé — veuillez renvoyer les articles au vendeur.
          </p>
        )}
        {ret.status === "received" && (
          <p className="mt-3 text-xs text-violet-600 dark:text-violet-400">
            Articles reçus — le remboursement est en cours de traitement.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
