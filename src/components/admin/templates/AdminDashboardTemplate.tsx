// filepath: src/components/admin/templates/AdminDashboardTemplate.tsx

"use client";

import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  UserPlus,
  Store,
  AlertTriangle,
  CreditCard,
  Warehouse,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, formatDate } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────────

type StatsType = {
  today: {
    revenue: number;
    orders: number;
    newUsers: number;
    newStores: number;
  };
  alerts: {
    pendingPayoutsCount: number;
    unverifiedStoresCount: number;
    storageReceivedCount: number;
  };
  revenuePerDay: { date: string; revenue: number }[];
  topStores: { storeId: string; storeName: string; revenue: number }[];
  lastOrders: {
    _id: string;
    order_number: string;
    total_amount: number;
    currency: string;
    status: string;
    _creationTime: number;
    store_id: string;
  }[];
  ordersByStatus: { status: string; count: number }[];
  totals: { users: number; stores: number; orders: number };
};

interface Props {
  stats: StatsType | undefined;
}

// ─── KPI Card ────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`size-4 ${iconColor}`} />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function KpiCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Skeleton className="h-8 w-20" />
      </CardContent>
    </Card>
  );
}

// ─── Alert Card ──────────────────────────────────────────────

function AlertCard({
  label,
  count,
  href,
  colorClass,
}: {
  label: string;
  count: number;
  href: string;
  colorClass: string;
}) {
  return (
    <Link href={href}>
      <Card
        className={`cursor-pointer hover:opacity-90 transition-opacity border ${colorClass}`}
      >
        <CardContent className="px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="size-5 shrink-0" />
          <div>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Order Status Badge ──────────────────────────────────────

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
    paid: "bg-blue-100 text-blue-700 border-blue-300",
    processing: "bg-purple-100 text-purple-700 border-purple-300",
    shipped: "bg-indigo-100 text-indigo-700 border-indigo-300",
    delivered: "bg-green-100 text-green-700 border-green-300",
    cancelled: "bg-red-100 text-red-700 border-red-300",
    refunded: "bg-gray-100 text-gray-700 border-gray-300",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-700 border-gray-300";
  return <Badge className={cls}>{status}</Badge>;
}

// ─── Tooltip Formatter ───────────────────────────────────────

function revenueFormatter(value: unknown) {
  if (typeof value === "number") {
    return [formatPrice(value, "XOF"), "Revenus"];
  }
  return [String(value), "Revenus"];
}

// ─── Main Template ────────────────────────────────────────────

export function AdminDashboardTemplate({ stats }: Props) {
  const hasAlerts =
    stats &&
    (stats.alerts.pendingPayoutsCount > 0 ||
      stats.alerts.unverifiedStoresCount > 0 ||
      stats.alerts.storageReceivedCount > 0);

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Vue d&apos;ensemble
        </h1>
        <p className="text-sm text-muted-foreground">
          Indicateurs plateforme en temps réel
        </p>
      </div>

      {/* Section 1 — KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats === undefined ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              title="Revenus du jour"
              value={formatPrice(stats.today.revenue, "XOF")}
              icon={TrendingUp}
              iconColor="text-green-600"
            />
            <KpiCard
              title="Commandes du jour"
              value={stats.today.orders}
              icon={ShoppingBag}
              iconColor="text-blue-600"
            />
            <KpiCard
              title="Nouveaux utilisateurs"
              value={stats.today.newUsers}
              icon={UserPlus}
              iconColor="text-indigo-600"
            />
            <KpiCard
              title="Nouvelles boutiques"
              value={stats.today.newStores}
              icon={Store}
              iconColor="text-purple-600"
            />
          </>
        )}
      </div>

      {/* Section 2 — Alertes */}
      {hasAlerts && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.alerts.pendingPayoutsCount > 0 && (
            <AlertCard
              label="retraits en attente"
              count={stats.alerts.pendingPayoutsCount}
              href="/admin/payouts"
              colorClass="bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-700 dark:text-yellow-300"
            />
          )}
          {stats.alerts.unverifiedStoresCount > 0 && (
            <AlertCard
              label="boutiques non vérifiées"
              count={stats.alerts.unverifiedStoresCount}
              href="/admin/stores"
              colorClass="bg-orange-50 border-orange-300 text-orange-800 dark:bg-orange-950 dark:border-orange-700 dark:text-orange-300"
            />
          )}
          {stats.alerts.storageReceivedCount > 0 && (
            <AlertCard
              label="dépôts à valider"
              count={stats.alerts.storageReceivedCount}
              href="/admin/storage"
              colorClass="bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300"
            />
          )}
        </div>
      )}

      {/* Section 3 — Graphiques */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue chart — 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium">
              Revenus 30 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {stats === undefined ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={stats.revenuePerDay}
                  margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => {
                      const parts = v.split("-");
                      return `${parts[2]}/${parts[1]}`;
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) =>
                      new Intl.NumberFormat("fr-FR", {
                        notation: "compact",
                      }).format(v)
                    }
                  />
                  <Tooltip formatter={revenueFormatter} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 5 stores — 1/3 */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium">
              Top 5 boutiques
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {stats === undefined ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_item, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : stats.topStores.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune donnée
              </p>
            ) : (
              <div className="space-y-1">
                {stats.topStores.map((store, i) => (
                  <div
                    key={store.storeId}
                    className="flex items-center gap-2 py-1.5"
                  >
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm truncate">
                      {store.storeName}
                    </span>
                    <span className="text-sm font-medium whitespace-nowrap">
                      {formatPrice(store.revenue, "XOF")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 4 — Activité récente */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium">
            10 dernières commandes payées
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 overflow-x-auto">
          {stats === undefined ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_item, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : stats.lastOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune commande payée
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Boutique</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.lastOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-mono text-xs">
                      {order.order_number}
                    </TableCell>
                    <TableCell>
                      <Link
                        href="/admin/stores"
                        className="text-xs text-muted-foreground hover:underline font-mono"
                      >
                        {/* TODO: hydrate store name from store_id */}
                        {order.store_id.slice(0, 10)}…
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(order.total_amount, order.currency)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(order._creationTime, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
