// filepath: src/components/payouts/molecules/PayoutHistoryItem.tsx

"use client";

import { PayoutStatusBadge } from "../atoms/PayoutStatusBadge";
import { PayoutMethodIcon, getMethodLabel } from "../atoms/PayoutMethodIcon";
import { formatPrice } from "@/lib/format";

interface PayoutHistoryItemProps {
  amount: number;
  fee: number;
  currency: string;
  status: string;
  payoutMethod: string;
  requestedAt: number;
  processedAt?: number;
  reference?: string;
  notes?: string;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PayoutHistoryItem({
  amount,
  fee,
  currency,
  status,
  payoutMethod,
  requestedAt,
  processedAt,
  reference,
  notes,
}: PayoutHistoryItemProps) {
  const netAmount = amount - fee;

  return (
    <div className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/30">
      <PayoutMethodIcon method={payoutMethod} />

      <div className="min-w-0 flex-1">
        {/* Ligne 1 : méthode + montant */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{getMethodLabel(payoutMethod)}</p>
          <p className="text-sm font-semibold tabular-nums">
            {formatPrice(netAmount, currency)}
          </p>
        </div>

        {/* Ligne 2 : date + statut */}
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {formatDate(requestedAt)}
          </p>
          <PayoutStatusBadge status={status} />
        </div>

        {/* Ligne 3 : détails optionnels */}
        {fee > 0 && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Montant brut : {formatPrice(amount, currency)} · Frais :{" "}
            {formatPrice(fee, currency)}
          </p>
        )}

        {notes && status === "failed" && (
          <p className="mt-1 text-[11px] text-destructive">{notes}</p>
        )}

        {reference && (
          <p className="mt-0.5 text-[11px] font-mono text-muted-foreground/60">
            Réf : {reference}
          </p>
        )}
      </div>
    </div>
  );
}
