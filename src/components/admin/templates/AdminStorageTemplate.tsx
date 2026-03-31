// filepath: src/components/admin/templates/AdminStorageTemplate.tsx

"use client";

import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Banknote,
  Clock,
  AlertTriangle,
  TrendingUp,
  Package,
  Store,
} from "lucide-react";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ────────────────────────────────────────────────────

type StorageInvoice = {
  _id: Id<"storage_invoices">;
  amount: number;
  currency: string;
  status: "unpaid" | "paid" | "deducted_from_payout";
  payment_method: "immediate" | "auto_debit" | "deferred" | undefined;
  paid_at: number | undefined;
  created_at: number;
  isOverdue: boolean;
  storeName: string;
  storeId: Id<"stores">;
  productName: string;
  storageCode: string;
  actualQty: number | undefined;
  actualWeightKg: number | undefined;
  measurementType: "units" | "weight" | undefined;
};

interface Props {
  invoices: StorageInvoice[];
  totalRevenue: number;
  totalUnpaid: number;
  overdueCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────

function StatusBadge({ invoice }: { invoice: StorageInvoice }) {
  if (invoice.isOverdue) {
    return (
      <Badge variant="destructive" className="text-xs">
        En retard
      </Badge>
    );
  }
  if (invoice.status === "paid") {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs dark:bg-green-900 dark:text-green-300">
        Payée
      </Badge>
    );
  }
  if (invoice.status === "deducted_from_payout") {
    return (
      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs dark:bg-blue-900 dark:text-blue-300">
        Déduite
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs">
      Impayée
    </Badge>
  );
}

function PaymentMethodLabel({ method }: { method: StorageInvoice["payment_method"] }) {
  if (!method) return <span className="text-muted-foreground text-xs">—</span>;
  const labels: Record<"immediate" | "auto_debit" | "deferred", string> = {
    immediate: "Immédiat",
    auto_debit: "Débit auto",
    deferred: "Différé",
  };
  return <span className="text-xs text-muted-foreground">{labels[method]}</span>;
}

function QtyCell({ invoice }: { invoice: StorageInvoice }) {
  if (invoice.measurementType === "units" && invoice.actualQty !== undefined) {
    return (
      <span className="text-sm">
        <span className="font-medium">{invoice.actualQty}</span>{" "}
        <span className="text-muted-foreground text-xs">u.</span>
      </span>
    );
  }
  if (invoice.measurementType === "weight" && invoice.actualWeightKg !== undefined) {
    return (
      <span className="text-sm">
        <span className="font-medium">{invoice.actualWeightKg}</span>{" "}
        <span className="text-muted-foreground text-xs">kg</span>
      </span>
    );
  }
  return <span className="text-muted-foreground text-xs">—</span>;
}

function ProductCell({ name }: { name: string }) {
  const truncated = name.length > 40 ? name.slice(0, 40) + "…" : name;
  if (name.length <= 40) return <span className="text-sm">{name}</span>;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-sm cursor-help">{truncated}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          <p className="text-xs">{name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Main Template ────────────────────────────────────────────

export function AdminStorageTemplate({
  invoices,
  totalRevenue,
  totalUnpaid,
  overdueCount,
}: Props) {
  const unpaidInvoices = invoices.filter((i) => i.status === "unpaid");
  const paidInvoices = invoices.filter((i) => i.status !== "unpaid");

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Facturation stockage entrepôt
        </h1>
        <p className="text-sm text-muted-foreground">
          Suivi financier des frais de stockage vendeurs
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenus collectés
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(totalRevenue, "XOF")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Factures payées + déduites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impayés en cours
            </CardTitle>
            <Banknote className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(totalUnpaid, "XOF")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {unpaidInvoices.length} facture{unpaidInvoices.length !== 1 ? "s" : ""} en attente
            </p>
          </CardContent>
        </Card>

        <Card className={overdueCount > 0 ? "border-destructive/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En retard (&gt;30 j)
            </CardTitle>
            <AlertTriangle className={`size-4 ${overdueCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${overdueCount > 0 ? "text-destructive" : ""}`}>
              {overdueCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Factures impayées depuis plus de 30 jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending invoices */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-amber-500" />
          <h2 className="text-base font-semibold">
            Factures impayées
            {unpaidInvoices.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({unpaidInvoices.length})
              </span>
            )}
          </h2>
        </div>

        {unpaidInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border py-12 gap-3 text-muted-foreground">
            <Banknote className="size-10 opacity-25" />
            <p className="text-sm">Aucune facture impayée</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code PM</TableHead>
                  <TableHead>Boutique</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="whitespace-nowrap">Émise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidInvoices.map((inv) => (
                  <TableRow key={inv._id} className={inv.isOverdue ? "bg-destructive/5" : ""}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono tracking-wider text-xs">
                        {inv.storageCode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Store className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium">{inv.storeName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-40">
                      <ProductCell name={inv.productName} />
                    </TableCell>
                    <TableCell className="text-right">
                      <QtyCell invoice={inv} />
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      {formatPrice(inv.amount, inv.currency)}
                    </TableCell>
                    <TableCell>
                      <PaymentMethodLabel method={inv.payment_method} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge invoice={inv} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(inv.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Full history */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">
            Historique complet
            {invoices.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({invoices.length})
              </span>
            )}
          </h2>
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border py-12 gap-3 text-muted-foreground">
            <Package className="size-10 opacity-25" />
            <p className="text-sm">Aucune facture pour le moment</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code PM</TableHead>
                  <TableHead>Boutique</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="whitespace-nowrap">Émise</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">Payée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv._id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono tracking-wider text-xs">
                        {inv.storageCode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Store className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium">{inv.storeName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-40">
                      <ProductCell name={inv.productName} />
                    </TableCell>
                    <TableCell className="text-right">
                      <QtyCell invoice={inv} />
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      {formatPrice(inv.amount, inv.currency)}
                    </TableCell>
                    <TableCell>
                      <PaymentMethodLabel method={inv.payment_method} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge invoice={inv} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(inv.created_at)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                      {inv.paid_at ? formatRelativeTime(inv.paid_at) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
