// filepath: src/components/storage/templates/VendorBillingTemplate.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, formatDate } from "@/lib/format";
import { Receipt, AlertCircle } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

interface StorageInvoice {
  _id: string;
  amount: number;
  currency: string;
  status: "unpaid" | "paid" | "deducted_from_payout";
  payment_method?: "immediate" | "auto_debit" | "deferred";
  created_at: number;
  paid_at?: number;
  product_name: string;
  storage_code: string;
}

interface DebtRecord {
  _id: string;
  amount: number;
  currency: string;
  period: string;
  settled_at?: number;
}

interface VendorBillingTemplateProps {
  invoices: StorageInvoice[];
  debtRecords: DebtRecord[];
  totalOutstanding: number;
  isLoading: boolean;
}

const INVOICE_STATUS_BADGE: Record<
  StorageInvoice["status"],
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  unpaid: { label: "Impayée", variant: "destructive" },
  paid: { label: "Payée", variant: "default" },
  deducted_from_payout: { label: "Déduite du retrait", variant: "secondary" },
};

const PAYMENT_METHOD_LABELS: Record<
  "immediate" | "auto_debit" | "deferred",
  string
> = {
  immediate: "Paiement immédiat",
  auto_debit: "Prélèvement ventes",
  deferred: "Paiement différé",
};

function PayButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);
  const payInvoice = useMutation(api.storage.mutations.payInvoice);

  async function handlePay() {
    setLoading(true);
    try {
      await payInvoice({ invoice_id: invoiceId as Id<"storage_invoices"> });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={handlePay}
      disabled={loading}
    >
      {loading ? "…" : "Payer"}
    </Button>
  );
}

function InvoicesTable({
  invoices,
  isLoading,
}: {
  invoices: StorageInvoice[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
        <Receipt className="h-10 w-10 opacity-30" />
        <p className="text-sm">Aucune facture de stockage</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead className="hidden sm:table-cell">Produit</TableHead>
          <TableHead>Montant</TableHead>
          <TableHead className="hidden md:table-cell">Mode</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="hidden lg:table-cell">Date</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => {
          const badge = INVOICE_STATUS_BADGE[inv.status];
          return (
            <TableRow key={inv._id}>
              <TableCell>
                <span className="font-mono text-sm font-semibold">
                  {inv.storage_code}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm">
                {inv.product_name}
              </TableCell>
              <TableCell className="font-semibold text-sm">
                {formatPrice(inv.amount, inv.currency)}
              </TableCell>
              <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                {inv.payment_method
                  ? PAYMENT_METHOD_LABELS[inv.payment_method]
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                {formatDate(inv.created_at, {
                  hour: undefined,
                  minute: undefined,
                })}
              </TableCell>
              <TableCell className="text-right">
                {inv.status === "unpaid" &&
                  inv.payment_method === "immediate" && (
                    <PayButton invoiceId={inv._id} />
                  )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function VendorBillingTemplate({
  invoices,
  debtRecords,
  totalOutstanding,
  isLoading,
}: VendorBillingTemplateProps) {
  const unpaidImmediate = invoices.filter(
    (inv) => inv.status === "unpaid" && inv.payment_method === "immediate",
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Facturation stockage
        </h1>
        <p className="text-sm text-muted-foreground">
          Suivez vos factures et votre dette de stockage
        </p>
      </div>

      {/* Alert: factures immédiates en attente */}
      {unpaidImmediate.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              {unpaidImmediate.length} facture
              {unpaidImmediate.length > 1 ? "s" : ""} en attente de paiement
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Réglez-les ci-dessous pour activer vos services de stockage.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Dette totale en cours
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p
              className={`text-2xl font-bold ${totalOutstanding > 0 ? "text-amber-600" : ""}`}
            >
              {formatPrice(totalOutstanding, "XOF")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Factures impayées
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p
              className={`text-2xl font-bold ${unpaidImmediate.length > 0 ? "text-destructive" : ""}`}
            >
              {invoices.filter((i) => i.status === "unpaid").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total facturé
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">
              {formatPrice(
                invoices.reduce((sum, inv) => sum + inv.amount, 0),
                "XOF",
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Factures */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Historique des factures</h2>
        <InvoicesTable invoices={invoices} isLoading={isLoading} />
      </div>

      {/* Dette par période */}
      {debtRecords.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Dette par période</h2>
          <div className="rounded-lg border divide-y">
            {debtRecords.map((debt) => (
              <div
                key={debt._id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium capitalize">
                    {debt.period}
                  </p>
                  {debt.settled_at && (
                    <p className="text-xs text-muted-foreground">
                      Réglée le{" "}
                      {formatDate(debt.settled_at, {
                        hour: undefined,
                        minute: undefined,
                      })}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatPrice(debt.amount, debt.currency)}
                  </p>
                  <Badge
                    variant={debt.settled_at ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {debt.settled_at ? "Réglée" : "En cours"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
