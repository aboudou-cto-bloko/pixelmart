// filepath: src/app/(vendor)/vendor/dashboard/page.tsx

"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  TrendingUp,
  ShoppingCart,
  Package,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  Clock,
  BarChart3,
  ChevronRight,
  PackageX,
  Crown,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { getOrderStatusConfig, formatShortDate } from "@/lib/order-helpers";

export default function VendorDashboardPage() {
  const dashboard = useQuery(api.dashboard.queries.getVendorDashboard);

  if (dashboard === undefined) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  const { store, orders, revenue, products, recentOrders, topProducts } =
    dashboard;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenue sur {store.name}
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Crown className="size-3" />
          {store.subscription_tier}
        </Badge>
      </div>

      {/* Alertes urgentes */}
      {orders.paid > 0 && (
        <Link href="/vendor/orders?status=paid" className="block">
          <Card className="border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-900/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="size-5 text-yellow-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {orders.paid} commande{orders.paid > 1 ? "s" : ""} en attente
                  de traitement
                </p>
                <p className="text-xs text-muted-foreground">
                  Des clients ont payé — confirmez la prise en charge.
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard
          icon={DollarSign}
          label="Revenu ce mois"
          value={formatPrice(revenue.month, "XOF")}
          subtext={`${formatPrice(revenue.today, "XOF")} aujourd'hui`}
          trend={revenue.week > 0 ? "up" : undefined}
        />
        <KPICard
          icon={ShoppingCart}
          label="Commandes"
          value={String(orders.total)}
          subtext={`${orders.processing} en cours`}
        />
        <KPICard
          icon={Package}
          label="Produits actifs"
          value={String(products.active)}
          subtext={
            products.outOfStock > 0
              ? `${products.outOfStock} en rupture`
              : `${products.total} total`
          }
          alert={products.outOfStock > 0}
        />
        <KPICard
          icon={Wallet}
          label="Solde disponible"
          value={formatPrice(store.balance, "XOF")}
          subtext={`${formatPrice(store.pending_balance, "XOF")} en attente`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — Charts + recent orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue chart (7 days) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="size-4 text-muted-foreground" />
                Revenus — 7 derniers jours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenue.byDay} />
            </CardContent>
          </Card>

          {/* Recent orders */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Commandes récentes</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
                <Link href="/vendor/orders">
                  Tout voir
                  <ArrowUpRight className="size-3 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Aucune commande pour le moment
                </p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => {
                    const statusConfig = getOrderStatusConfig(order.status);
                    return (
                      <Link
                        key={order._id}
                        href={`/vendor/orders/${order._id}`}
                        className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {order.order_number}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${statusConfig.color} ${statusConfig.bgColor}`}
                            >
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {order.item_count} article
                            {order.item_count > 1 ? "s" : ""} ·{" "}
                            {formatShortDate(order.created_at)}
                          </p>
                        </div>
                        <span className="text-sm font-medium shrink-0">
                          {formatPrice(order.total_amount, order.currency)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Revenue breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Finances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenu brut total</span>
                <span className="font-medium">
                  {formatPrice(revenue.total, "XOF")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commissions</span>
                <span className="text-destructive">
                  -{formatPrice(revenue.totalCommission, "XOF")}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Revenu net</span>
                <span className="text-green-600">
                  {formatPrice(revenue.netTotal, "XOF")}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Solde disponible</span>
                <span>{formatPrice(store.balance, "XOF")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">En attente (48h)</span>
                <span className="text-yellow-600">
                  {formatPrice(store.pending_balance, "XOF")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Top products */}
          {topProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  Meilleures ventes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topProducts.map((product, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4 text-right">
                      {i + 1}
                    </span>
                    <div className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="size-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{product.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {product.totalSold} vendu
                        {product.totalSold > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-xs font-medium shrink-0">
                      {formatPrice(product.revenue, "XOF")}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Low stock alerts */}
          {products.lowStock.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="size-4" />
                  Stock faible
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {products.lowStock.map((product) => (
                  <Link
                    key={product._id}
                    href={`/vendor/products/${product._id}/edit`}
                    className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-1.5 -mx-1.5 transition-colors"
                  >
                    <div className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <PackageX className="size-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{product.title}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20"
                    >
                      {product.quantity} restant
                      {product.quantity > 1 ? "s" : ""}
                    </Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Order status breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Répartition commandes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatusRow
                label="En attente"
                count={orders.pending}
                total={orders.total}
                color="bg-yellow-500"
              />
              <StatusRow
                label="Payées"
                count={orders.paid}
                total={orders.total}
                color="bg-blue-500"
              />
              <StatusRow
                label="En préparation"
                count={orders.processing}
                total={orders.total}
                color="bg-indigo-500"
              />
              <StatusRow
                label="Expédiées"
                count={orders.shipped}
                total={orders.total}
                color="bg-purple-500"
              />
              <StatusRow
                label="Livrées"
                count={orders.delivered}
                total={orders.total}
                color="bg-green-500"
              />
              <StatusRow
                label="Annulées"
                count={orders.cancelled}
                total={orders.total}
                color="bg-red-500"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function KPICard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  alert,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext: string;
  trend?: "up" | "down";
  alert?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className="size-4 text-muted-foreground" />
          {trend === "up" && <TrendingUp className="size-3.5 text-green-500" />}
          {alert && <AlertTriangle className="size-3.5 text-yellow-500" />}
        </div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function StatusRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {count} <span className="text-muted-foreground">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RevenueChart({
  data,
}: {
  data: { date: string; revenue: number; orders: number }[];
}) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5 h-[140px]">
        {data.map((day) => {
          const height =
            maxRevenue > 0 ? Math.max(4, (day.revenue / maxRevenue) * 100) : 4;

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div className="w-full flex flex-col items-center justify-end h-[120px]">
                {day.revenue > 0 && (
                  <span className="text-[9px] text-muted-foreground mb-1">
                    {day.orders}
                  </span>
                )}
                <div
                  className="w-full rounded-t-sm bg-primary/80 hover:bg-primary transition-colors min-h-[4px]"
                  style={{ height: `${height}%` }}
                  title={`${formatPrice(day.revenue, "XOF")} — ${day.orders} commande(s)`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight text-center">
                {day.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
