// filepath: src/app/(vendor)/vendor/orders/page.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Package,
  ChevronRight,
  Search,
  Filter,
  User,
  Clock,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";
import {
  getOrderStatusConfig,
  getPaymentStatusConfig,
  formatShortDate,
} from "@/lib/order-helpers";

type StatusFilter =
  | "all"
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

const QUICK_TABS: { value: StatusFilter; label: string; count?: boolean }[] = [
  { value: "all", label: "Toutes" },
  { value: "paid", label: "À traiter" },
  { value: "processing", label: "En préparation" },
  { value: "shipped", label: "Expédiées" },
  { value: "delivered", label: "Livrées" },
];

const ALL_STATUSES: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tous les statuts" },
  { value: "pending", label: "En attente de paiement" },
  { value: "paid", label: "Payées — à traiter" },
  { value: "processing", label: "En préparation" },
  { value: "shipped", label: "Expédiées" },
  { value: "delivered", label: "Livrées" },
  { value: "cancelled", label: "Annulées" },
  { value: "refunded", label: "Remboursées" },
];

export default function VendorOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const orders = useQuery(api.orders.queries.listByStore, {
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 100,
  });

  const stats = useQuery(api.orders.queries.getStoreOrderStats);

  // Filtrage local par recherche (numéro de commande ou nom client)
  const filteredOrders = orders?.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      order.customer_email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Commandes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez et traitez les commandes de votre boutique
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="À traiter" value={stats.paid} variant="warning" />
          <StatCard
            label="En préparation"
            value={stats.processing}
            variant="info"
          />
          <StatCard label="Expédiées" value={stats.shipped} variant="purple" />
          <StatCard
            label="Chiffre d'affaires"
            value={formatPrice(stats.totalRevenue, "XOF")}
            variant="success"
          />
        </div>
      )}

      {/* Quick tabs + search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as StatusFilter)}
        >
          <TabsList className="h-9">
            {QUICK_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs"
              >
                {tab.label}
                {stats && tab.value !== "all" && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 h-4 min-w-4 px-1 text-[10px]"
                  >
                    {stats[tab.value as keyof typeof stats] ?? 0}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="N° commande, client…"
              className="pl-9 h-9 w-[220px] text-sm"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as StatusFilter)}
          >
            <SelectTrigger className="w-[180px] h-9 sm:hidden">
              <Filter className="size-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading */}
      {filteredOrders === undefined && (
        <div className="py-16 text-center">
          <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {filteredOrders && filteredOrders.length === 0 && (
        <div className="py-16 text-center">
          <Package className="size-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Aucune commande</h2>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Aucun résultat pour cette recherche."
              : statusFilter === "all"
                ? "Vous n'avez pas encore reçu de commande."
                : "Aucune commande avec ce statut."}
          </p>
        </div>
      )}

      {/* Orders list */}
      {filteredOrders && filteredOrders.length > 0 && (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusConfig = getOrderStatusConfig(order.status);
            const paymentConfig = getPaymentStatusConfig(order.payment_status);
            const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
            const firstItem = order.items[0];

            return (
              <Link
                key={order._id}
                href={`/vendor/orders/${order._id}`}
                className="block"
              >
                <Card className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {firstItem?.image_url ? (
                          <Image
                            src={firstItem.image_url}
                            alt={firstItem.title}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="size-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold">
                            {order.order_number}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-[11px] ${statusConfig.color} ${statusConfig.bgColor}`}
                          >
                            {statusConfig.label}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${paymentConfig.color}`}
                          >
                            {paymentConfig.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                          <span className="flex items-center gap-1">
                            <User className="size-3" />
                            {order.customer_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatShortDate(order._creationTime)}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {itemCount} article{itemCount > 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* Amount + arrow */}
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-sm font-semibold">
                          {formatPrice(order.total_amount, order.currency)}
                        </p>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number | string;
  variant: "warning" | "info" | "purple" | "success";
}) {
  const colors = {
    warning: "text-yellow-700 dark:text-yellow-400",
    info: "text-blue-700 dark:text-blue-400",
    purple: "text-purple-700 dark:text-purple-400",
    success: "text-green-700 dark:text-green-400",
  };

  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={`text-lg font-bold ${colors[variant]}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
