// filepath: src/app/(vendor)/vendor/dashboard/page.tsx

"use client";

import { useQuery } from "convex/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useState } from "react";
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
  BarChart3,
  ChevronRight,
  PackageX,
  Crown,
  X,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { getOrderStatusConfig, formatShortDate } from "@/lib/order-helpers";
import { SetupGuide } from "@/components/onboarding/SetupGuide";
import { VendorAnnouncementBanner } from "@/components/vendor/VendorAnnouncementBanner";

const WA_BANNER_KEY = "pm_wa_banner_dismissed";

function WhatsAppBanner() {
  const [visible, setVisible] = useState(
    () => typeof window !== "undefined" && !localStorage.getItem(WA_BANNER_KEY),
  );

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 px-4 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#25D366]">
        <svg
          viewBox="0 0 24 24"
          className="size-5 fill-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#128C7E] dark:text-[#25D366]">
          Rejoignez le groupe WhatsApp des vendeurs Pixel-Mart
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Échangez avec d&apos;autres vendeurs, recevez les actualités et
          l&apos;assistance en direct.
        </p>
      </div>
      <a
        href="https://chat.whatsapp.com/ITOjPZs5LoL57rpRofhHJ8?mode=gi_t"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1ebe5d] transition-colors"
      >
        Rejoindre
      </a>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(WA_BANNER_KEY, "1");
          setVisible(false);
        }}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Fermer"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export default function VendorDashboardPage() {
  const { user } = useCurrentUser();
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
      {/* Bandeau d'annonce admin */}
      <VendorAnnouncementBanner />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Bienvenue{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{store.name}</p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Crown className="size-3" />
          {store.subscription_tier}
        </Badge>
      </div>

      {/* WhatsApp community banner */}
      <WhatsAppBanner />

      {/* Guide de configuration */}
      <SetupGuide />

      {/* Alertes urgentes */}
      {orders.paid > 0 && (
        <Link href="/vendor/orders?status=paid" className="block">
          <Card className="border-yellow-400/20 bg-yellow-400/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="size-5 text-yellow-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {orders.paid} commande{orders.paid > 1 ? "s" : ""} en attente
                  de traitement
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Des clients ont payé — confirmez la prise en charge.
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground/60" />
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
                <BarChart3 className="size-4 text-muted-foreground/60" />
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
                        className="flex items-center gap-3 hover:bg-muted/20 rounded-lg p-2 -mx-2 transition-colors"
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
                <span className="text-green-400">
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
                <span className="text-yellow-400">
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
                  <TrendingUp className="size-4 text-muted-foreground/60" />
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
                <CardTitle className="text-sm flex items-center gap-2 text-yellow-400">
                  <AlertTriangle className="size-4" />
                  Stock faible
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {products.lowStock.map((product) => (
                  <Link
                    key={product._id}
                    href={`/vendor/products/${product._id}/edit`}
                    className="flex items-center gap-3 hover:bg-muted/20 rounded-lg p-1.5 -mx-1.5 transition-colors"
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
                      className="text-[10px] text-yellow-400 bg-yellow-400/10"
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
                color="bg-yellow-400/70"
              />
              <StatusRow
                label="Payées"
                count={orders.paid}
                total={orders.total}
                color="bg-blue-400/70"
              />
              <StatusRow
                label="En préparation"
                count={orders.processing}
                total={orders.total}
                color="bg-indigo-400/70"
              />
              <StatusRow
                label="Expédiées"
                count={orders.shipped}
                total={orders.total}
                color="bg-purple-400/70"
              />
              <StatusRow
                label="Livrées"
                count={orders.delivered}
                total={orders.total}
                color="bg-green-400/70"
              />
              <StatusRow
                label="Annulées"
                count={orders.cancelled}
                total={orders.total}
                color="bg-red-400/70"
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
          <Icon className="size-4 text-muted-foreground/60" />
          {trend === "up" && <TrendingUp className="size-3.5 text-green-400" />}
          {alert && <AlertTriangle className="size-3.5 text-yellow-400" />}
        </div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground/50 mt-0.5">{subtext}</p>
        <p className="text-[11px] text-muted-foreground/40 mt-1">{label}</p>
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
                  <span className="text-[9px] text-muted-foreground/40 mb-1">
                    {day.orders}
                  </span>
                )}
                <div
                  className="w-full rounded-t-sm bg-primary/70 hover:bg-primary/80 transition-colors min-h-[4px]"
                  style={{ height: `${height}%` }}
                  title={`${formatPrice(day.revenue, "XOF")} — ${day.orders} commande(s)`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground/35 leading-tight text-center">
                {day.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
