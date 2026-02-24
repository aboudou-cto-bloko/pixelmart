// filepath: src/components/finance/organisms/TransactionTable.tsx

"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { TransactionRow } from "../molecules/TransactionRow";
import {
  downloadCsv,
  formatCentimesForCsv,
  formatDateForCsv,
} from "@/lib/csv-export";

type TransactionType =
  | "sale"
  | "refund"
  | "payout"
  | "fee"
  | "credit"
  | "transfer"
  | "ad_payment"
  | "subscription";

interface Transaction {
  _id: string;
  type: TransactionType;
  direction: "credit" | "debit";
  amount: number;
  currency: string;
  description: string;
  order_number?: string;
  reference?: string;
  status: "pending" | "completed" | "failed" | "reversed";
  _creationTime: number;
}

interface TransactionTableProps {
  transactions: Transaction[] | undefined;
  isLoading: boolean;
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

export function TransactionTable({
  transactions,
  isLoading,
}: TransactionTableProps) {
  const handleExportCsv = () => {
    if (!transactions) return;

    const headers = [
      "Date",
      "Type",
      "Direction",
      "Montant",
      "Devise",
      "Description",
      "Commande",
      "Statut",
    ];

    const rows = transactions.map((t) => [
      formatDateForCsv(t._creationTime),
      TYPE_LABELS[t.type],
      t.direction === "credit" ? "Crédit" : "Débit",
      formatCentimesForCsv(t.amount),
      t.currency,
      t.description,
      t.order_number ?? "",
      t.status,
    ]);

    downloadCsv("transactions-pixelmart", headers, rows);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm font-medium">Aucune transaction</p>
        <p className="text-xs text-muted-foreground">
          Vos transactions apparaîtront ici après votre première vente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Exporter CSV
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
            <TableHead className="hidden md:table-cell">Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TransactionRow
              key={t._id}
              type={t.type}
              direction={t.direction}
              amount={t.amount}
              currency={t.currency}
              description={t.description}
              orderNumber={t.order_number}
              reference={t.reference}
              status={t.status}
              createdAt={t._creationTime}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
