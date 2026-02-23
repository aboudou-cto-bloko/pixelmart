// filepath: src/app/(storefront)/orders/page.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Package,
  Store,
  ChevronRight,
  ShoppingBag,
  Filter,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import {
  getOrderStatusConfig,
  getPaymentStatusConfig,
  formatShortDate,
} from "@/lib/order-helpers";
import { ROUTES } from "@/constants/routes";

type StatusFilter =
  | "all"
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "paid", label: "Payées" },
  { value: "processing", label: "En traitement" },
  { value: "shipped", label: "Expédiées" },
  { value: "delivered", label: "Livrées" },
  { value: "cancelled", label: "Annulées" },
  { value: "refunded", label: "Remboursées" },
];

export default function CustomerOrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const orders = useQuery(
    api.orders.queries.listByCustomer,
    isAuthenticated
      ? {
          status: statusFilter === "all" ? undefined : statusFilter,
          limit: 50,
        }
      : "skip",
  );

  // ── Auth guard ──
  if (authLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold mb-4">Connectez-vous</h1>
        <p className="text-muted-foreground mb-6">
          Connectez-vous pour voir vos commandes.
        </p>
        <Button asChild>
          <Link href={`${ROUTES.LOGIN}?redirect=${ROUTES.CUSTOMER_ORDERS}`}>
            Se connecter
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mes commandes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivez vos achats et leur livraison
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as StatusFilter)}
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading */}
      {orders === undefined && (
        <div className="py-16 text-center">
          <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {orders && orders.length === 0 && (
        <div className="py-16 text-center">
          <ShoppingBag className="size-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            {statusFilter === "all"
              ? "Aucune commande"
              : "Aucune commande avec ce filtre"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {statusFilter === "all"
              ? "Vous n'avez pas encore passé de commande."
              : "Essayez un autre filtre."}
          </p>
          {statusFilter === "all" && (
            <Button asChild>
              <Link href={ROUTES.PRODUCTS}>Parcourir le catalogue</Link>
            </Button>
          )}
        </div>
      )}

      {/* Orders list */}
      {orders && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = getOrderStatusConfig(order.status);
            const paymentConfig = getPaymentStatusConfig(order.payment_status);
            const firstItem = order.items[0];
            const remainingCount = order.items.length - 1;

            return (
              <Link
                key={order._id}
                href={ROUTES.CUSTOMER_ORDER(order._id)}
                className="block"
              >
                <Card className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {firstItem?.image_url ? (
                          <Image
                            src={firstItem.image_url}
                            alt={firstItem.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="size-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">
                            {order.order_number}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-[11px] ${statusConfig.color} ${statusConfig.bgColor}`}
                          >
                            {statusConfig.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                          <Store className="size-3" />
                          <span>{order.store_name}</span>
                          <span className="mx-1">·</span>
                          <span>{formatShortDate(order._creationTime)}</span>
                        </div>

                        <p className="text-sm truncate">
                          {firstItem?.title ?? "Article"}
                          {remainingCount > 0 && (
                            <span className="text-muted-foreground">
                              {" "}
                              +{remainingCount} autre
                              {remainingCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Price + arrow */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formatPrice(order.total_amount, order.currency)}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] mt-1 ${paymentConfig.color}`}
                          >
                            {paymentConfig.label}
                          </Badge>
                        </div>
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
