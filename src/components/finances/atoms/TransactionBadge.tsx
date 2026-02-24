// filepath: src/components/finance/atoms/TransactionBadge.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TransactionType =
  | "sale"
  | "refund"
  | "payout"
  | "fee"
  | "credit"
  | "transfer"
  | "ad_payment"
  | "subscription";

interface TransactionBadgeProps {
  type: TransactionType;
  direction: "credit" | "debit";
  className?: string;
}

const TYPE_LABELS: Record<TransactionType, string> = {
  sale: "Vente",
  refund: "Remboursement",
  payout: "Retrait",
  fee: "Commission",
  credit: "Crédit",
  transfer: "Transfert",
  ad_payment: "Publicité",
  subscription: "Abonnement",
};

export function TransactionBadge({
  type,
  direction,
  className,
}: TransactionBadgeProps) {
  const isCredit = direction === "credit";

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        isCredit
          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          : "bg-red-500/10 text-red-500 border-red-500/20",
        className,
      )}
    >
      {TYPE_LABELS[type]}
    </Badge>
  );
}
