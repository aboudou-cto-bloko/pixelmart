// filepath: src/components/finance/templates/InvoiceListTemplate.tsx

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/atoms/OrderStatusBadge";

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

interface InvoiceRow {
  _id: string;
  orderNumber: string;
  invoiceNumber: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  customerName: string;
  createdAt: number;
  itemCount: number;
}

interface InvoiceListTemplateProps {
  invoices: InvoiceRow[] | undefined;
  isLoading: boolean;
  onGeneratePdf: (orderId: string) => void;
  isGenerating?: string;
}

function formatAmount(centimes: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "XOF" ? 0 : 2,
    maximumFractionDigits: currency === "XOF" ? 0 : 2,
  }).format(centimes / 100);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function InvoiceListTemplate({
  invoices,
  isLoading,
  onGeneratePdf,
  isGenerating,
}: InvoiceListTemplateProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Factures
        </h1>
        <p className="text-sm text-muted-foreground">
          Générez des factures PDF pour vos commandes
        </p>
      </div>

      {!invoices || invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Aucune facture disponible</p>
          <p className="text-xs text-muted-foreground">
            Les factures sont générées à partir de vos commandes payées.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Facture</TableHead>
              <TableHead className="hidden sm:table-cell">Client</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv._id}>
                <TableCell>
                  <p className="font-mono text-xs font-medium">
                    {inv.invoiceNumber}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {inv.orderNumber}
                  </p>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">
                  {inv.customerName}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={inv.status} />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums text-sm">
                  {formatAmount(inv.totalAmount, inv.currency)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                  {formatDate(inv.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isGenerating === inv._id}
                    onClick={() => onGeneratePdf(inv._id)}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Télécharger PDF</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
