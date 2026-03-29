// filepath: src/components/admin/templates/AdminOrdersTemplate.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Search, X } from "lucide-react";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate, formatPrice } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "ready_for_delivery"
  | "delivery_failed";

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

type OrderItem = {
  _id: string;
  order_number: string;
  store_name: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;
  commission_amount: number;
  currency: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  items_count: number;
  _creationTime: number;
};

interface Props {
  orders: OrderItem[];
}

// ─── Status Badges ────────────────────────────────────────────

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending:              "bg-amber-100 text-amber-700 border-amber-300",
  paid:                 "bg-blue-100 text-blue-700 border-blue-300",
  processing:           "bg-violet-100 text-violet-700 border-violet-300",
  shipped:              "bg-cyan-100 text-cyan-700 border-cyan-300",
  delivered:            "bg-green-100 text-green-700 border-green-300",
  cancelled:            "bg-red-100 text-red-700 border-red-300",
  refunded:             "bg-slate-100 text-slate-700 border-slate-300",
  ready_for_delivery:   "bg-pink-100 text-pink-700 border-pink-300",
  delivery_failed:      "bg-rose-100 text-rose-700 border-rose-300",
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending:              "En attente",
  paid:                 "Payée",
  processing:           "En préparation",
  shipped:              "Expédiée",
  delivered:            "Livrée",
  cancelled:            "Annulée",
  refunded:             "Remboursée",
  ready_for_delivery:   "Prête à livrer",
  delivery_failed:      "Échec livraison",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pending:  "bg-amber-100 text-amber-700 border-amber-300",
  paid:     "bg-green-100 text-green-700 border-green-300",
  failed:   "bg-red-100 text-red-700 border-red-300",
  refunded: "bg-slate-100 text-slate-700 border-slate-300",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending:  "En attente",
  paid:     "Payé",
  failed:   "Échoué",
  refunded: "Remboursé",
};

// ─── Main Template ────────────────────────────────────────────

export function AdminOrdersTemplate({ orders }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const bulk = useBulkSelection();
  const router = useRouter();

  const filtered = orders.filter((o) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      q === "" ||
      o.order_number.toLowerCase().includes(q) ||
      o.store_name.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_email.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredIds = filtered.map((o) => o._id);
  const totalGmv = filtered.reduce((s, o) => s + o.total_amount, 0);
  const totalCommissions = filtered.reduce((s, o) => s + o.commission_amount, 0);
  const selectedGmv = orders
    .filter((o) => bulk.selectedIds.has(o._id))
    .reduce((s, o) => s + o.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Commandes</h1>
        <p className="text-sm text-muted-foreground">
          {orders.length} commande{orders.length !== 1 ? "s" : ""} au total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="N° commande, boutique, client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as OrderStatus | "all")}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="paid">Payée</SelectItem>
            <SelectItem value="processing">En préparation</SelectItem>
            <SelectItem value="shipped">Expédiée</SelectItem>
            <SelectItem value="delivered">Livrée</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
            <SelectItem value="refunded">Remboursée</SelectItem>
            <SelectItem value="ready_for_delivery">Prête à livrer</SelectItem>
            <SelectItem value="delivery_failed">Échec livraison</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary strip */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> commande{filtered.length > 1 ? "s" : ""}
          </span>
          <span className="text-muted-foreground">
            GMV{" "}<span className="font-semibold text-foreground">{formatPrice(totalGmv, "XOF")}</span>
          </span>
          <span className="text-muted-foreground">
            Commissions{" "}<span className="font-semibold text-foreground">{formatPrice(totalCommissions, "XOF")}</span>
          </span>
        </div>
      )}

      {/* Bulk selection bar */}
      {bulk.count > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/60 px-4 py-2.5">
          <span className="text-sm font-medium">
            {bulk.count} commande{bulk.count > 1 ? "s" : ""} sélectionnée{bulk.count > 1 ? "s" : ""}
          </span>
          <span className="text-sm text-muted-foreground">
            GMV sélection{" "}
            <span className="font-semibold text-foreground">{formatPrice(selectedGmv, "XOF")}</span>
          </span>
          <button
            onClick={bulk.clear}
            className="ml-auto p-1 rounded hover:bg-muted transition-colors"
            aria-label="Désélectionner"
          >
            <X className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <ShoppingBag className="size-12 opacity-25" />
          <p className="text-sm">Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={bulk.isAllSelected(filteredIds)}
                    onCheckedChange={() => bulk.toggleAll(filteredIds)}
                    aria-label="Tout sélectionner"
                  />
                </TableHead>
                <TableHead>N° commande</TableHead>
                <TableHead>Boutique</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow
                  key={order._id}
                  data-selected={bulk.selectedIds.has(order._id)}
                  className="data-[selected=true]:bg-muted/40 cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    // Don't navigate if clicking checkbox
                    if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
                    router.push(`/admin/orders/${order._id}`);
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={bulk.selectedIds.has(order._id)}
                      onCheckedChange={() => bulk.toggle(order._id)}
                      aria-label={`Sélectionner ${order.order_number}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold">
                    {order.order_number}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {order.store_name}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/users/${order.customer_id}`)}
                    >
                      {order.customer_name}
                    </div>
                    <a
                      href={`mailto:${order.customer_email}`}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {order.customer_email}
                    </a>
                    {order.customer_phone && (
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="block text-xs text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {order.customer_phone}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium whitespace-nowrap">
                    {formatPrice(order.total_amount, order.currency)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                    {formatPrice(order.commission_amount, order.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge className={ORDER_STATUS_STYLES[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={PAYMENT_STATUS_STYLES[order.payment_status]}>
                      {PAYMENT_STATUS_LABELS[order.payment_status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(order._creationTime)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
