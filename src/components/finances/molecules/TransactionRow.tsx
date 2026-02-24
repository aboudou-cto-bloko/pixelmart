// filepath: src/components/finance/molecules/TransactionRow.tsx

"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { TransactionBadge } from "../atoms/TransactionBadge";
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

interface TransactionRowProps {
  type: TransactionType;
  direction: "credit" | "debit";
  amount: number;
  currency: string;
  description: string;
  orderNumber?: string;
  reference?: string;
  status: "pending" | "completed" | "failed" | "reversed";
  createdAt: number;
}

function formatAmount(centimes: number, currency: string): string {
  const value = centimes / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "XOF" ? 0 : 2,
    maximumFractionDigits: currency === "XOF" ? 0 : 2,
  }).format(value);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TransactionRow({
  type,
  direction,
  amount,
  currency,
  description,
  orderNumber,
  status,
  createdAt,
}: TransactionRowProps) {
  const isCredit = direction === "credit";

  return (
    <TableRow>
      <TableCell>
        <TransactionBadge type={type} direction={direction} />
      </TableCell>
      <TableCell className="max-w-[200px]">
        <p className="text-sm truncate">{description}</p>
        {orderNumber && (
          <p className="text-xs text-muted-foreground font-mono">
            {orderNumber}
          </p>
        )}
      </TableCell>
      <TableCell
        className={cn(
          "text-right font-medium tabular-nums text-sm",
          isCredit ? "text-emerald-500" : "text-red-500",
        )}
      >
        {isCredit ? "+" : "-"}
        {formatAmount(amount, currency)}
      </TableCell>
      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
        {formatDate(createdAt)}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <span
          className={cn(
            "text-xs",
            status === "completed" && "text-emerald-500",
            status === "pending" && "text-yellow-500",
            status === "failed" && "text-red-500",
            status === "reversed" && "text-muted-foreground",
          )}
        >
          {status === "completed" && "Complété"}
          {status === "pending" && "En cours"}
          {status === "failed" && "Échoué"}
          {status === "reversed" && "Annulé"}
        </span>
      </TableCell>
    </TableRow>
  );
}
