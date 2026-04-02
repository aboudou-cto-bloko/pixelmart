// filepath: src/components/admin/templates/AdminDashboardTemplate.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingBag,
  UserPlus,
  Store,
  CreditCard,
  Warehouse,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  BarChart3,
  ScrollText,
  Megaphone,
  Truck,
  Settings2,
  RefreshCw,
  Shield,
  Ban,
  UserCog,
  PackageCheck,
  PackageX,
  Printer,
  Bug,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────

type Period = "7d" | "30d" | "90d";

// ─── Helpers ──────────────────────────────────────────────────

function pct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function Trend({ current, previous }: { current: number; previous: number }) {
  const delta = pct(current, previous);
  if (Math.abs(delta) < 1)
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
        <Minus className="size-3" />—
      </span>
    );
  if (delta > 0)
    return (
      <span className="text-xs text-green-600 flex items-center gap-0.5">
        <TrendingUp className="size-3" />+{delta}%
      </span>
    );
  return (
    <span className="text-xs text-red-500 flex items-center gap-0.5">
      <TrendingDown className="size-3" />
      {delta}%
    </span>
  );
}

function formatDuration(ms: number): string {
  if (ms < 3600000) return `${Math.round(ms / 60000)} min`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)} h`;
  return `${Math.round(ms / 86400000)} j`;
}

// ─── KPI Card ─────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  trend?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-bold tracking-tight mt-0.5">{value}</p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
            {trend && <div className="mt-1">{trend}</div>}
          </div>
          <div className="rounded-md bg-muted p-2 shrink-0">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Health Indicator ─────────────────────────────────────────

type Severity = "ok" | "warn" | "critical";

function HealthCard({
  label,
  value,
  sub,
  severity,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  severity: Severity;
  icon: React.ElementType;
}) {
  const colors: Record<Severity, string> = {
    ok: "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800",
    warn: "border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800",
    critical: "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800",
  };
  const iconColors: Record<Severity, string> = {
    ok: "text-green-600",
    warn: "text-yellow-600",
    critical: "text-red-600",
  };
  const dot: Record<Severity, string> = {
    ok: "bg-green-500",
    warn: "bg-yellow-500",
    critical: "bg-red-500",
  };

  return (
    <Card className={`border ${colors[severity]}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={`size-2 rounded-full shrink-0 ${dot[severity]}`}
              />
              <p className="text-xs text-muted-foreground truncate">{label}</p>
            </div>
            <p className="text-xl font-bold tracking-tight">{value}</p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
          <Icon className={`size-5 shrink-0 mt-0.5 ${iconColors[severity]}`} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Audit Event Icon ─────────────────────────────────────────

const EVENT_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  user_banned: { label: "Utilisateur banni", icon: Ban, color: "text-red-600" },
  user_unbanned: {
    label: "Utilisateur débanni",
    icon: CheckCircle2,
    color: "text-green-600",
  },
  user_role_changed: {
    label: "Rôle modifié",
    icon: UserCog,
    color: "text-blue-600",
  },
  store_verified: {
    label: "Boutique vérifiée",
    icon: CheckCircle2,
    color: "text-green-600",
  },
  store_suspended: {
    label: "Boutique suspendue",
    icon: AlertCircle,
    color: "text-orange-600",
  },
  store_reactivated: {
    label: "Boutique réactivée",
    icon: RefreshCw,
    color: "text-blue-600",
  },
  payout_approved: {
    label: "Retrait approuvé",
    icon: CreditCard,
    color: "text-green-600",
  },
  payout_rejected: {
    label: "Retrait rejeté",
    icon: CreditCard,
    color: "text-red-600",
  },
  config_changed: {
    label: "Configuration modifiée",
    icon: Settings2,
    color: "text-purple-600",
  },
  config_reset: {
    label: "Configuration réinitialisée",
    icon: RefreshCw,
    color: "text-gray-600",
  },
  storage_validated: {
    label: "Stockage validé",
    icon: PackageCheck,
    color: "text-green-600",
  },
  storage_rejected: {
    label: "Stockage rejeté",
    icon: PackageX,
    color: "text-red-600",
  },
  client_error: { label: "Erreur client", icon: Bug, color: "text-red-600" },
};

const FALLBACK_EVENT = {
  label: "Action admin",
  icon: Shield,
  color: "text-gray-600",
};

// ─── Pie colors ───────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  paid: "#3b82f6",
  processing: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#10b981",
  cancelled: "#ef4444",
  refunded: "#6b7280",
  ready_for_delivery: "#ec4899",
  delivery_failed: "#dc2626",
};

const TIER_COLORS: Record<string, string> = {
  free: "#6b7280",
  pro: "#3b82f6",
  business: "#8b5cf6",
};

// ─── Analytics Tab ────────────────────────────────────────────

function TodayStats() {
  const stats = useQuery(api.admin.queries.getPlatformStats);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Aujourd&apos;hui
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="GMV du jour"
          value={formatPrice(stats.today.revenue, "XOF")}
          icon={TrendingUp}
        />
        <KpiCard
          label="Commandes payées"
          value={String(stats.today.orders)}
          icon={ShoppingBag}
        />
        <KpiCard
          label="Nouveaux utilisateurs"
          value={String(stats.today.newUsers)}
          icon={UserPlus}
        />
        <KpiCard
          label="Nouvelles boutiques"
          value={String(stats.today.newStores)}
          icon={Store}
        />
      </div>
    </div>
  );
}

function AnalyticsTab({
  period,
  onPeriodChange,
}: {
  period: Period;
  onPeriodChange: (p: Period) => void;
}) {
  const data = useQuery(api.admin.queries.getAnalytics, { period });

  return (
    <div className="space-y-6">
      {/* Today's snapshot — always visible */}
      <TodayStats />

      <div className="border-t" />

      {/* Period selector */}
      <div className="flex items-center gap-2">
        {(["7d", "30d", "90d"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {p === "7d" ? "7 jours" : p === "30d" ? "30 jours" : "90 jours"}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      {!data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="GMV"
            value={formatPrice(data.kpis.gmv, "XOF")}
            icon={TrendingUp}
            trend={
              <Trend current={data.kpis.gmv} previous={data.kpis.prevGmv} />
            }
          />
          <KpiCard
            label="Commissions"
            value={formatPrice(data.kpis.commissions, "XOF")}
            icon={CreditCard}
            trend={
              <Trend
                current={data.kpis.commissions}
                previous={data.kpis.prevCommissions}
              />
            }
          />
          <KpiCard
            label="Commandes payées"
            value={String(data.kpis.orders)}
            sub={`Panier moyen ${formatPrice(data.kpis.aov, "XOF")}`}
            icon={ShoppingBag}
            trend={
              <Trend
                current={data.kpis.orders}
                previous={data.kpis.prevOrders}
              />
            }
          />
          <KpiCard
            label="Taux conversion"
            value={`${data.kpis.conversionRate}%`}
            sub="commandes payées / total"
            icon={Activity}
          />
          <KpiCard
            label="Nouveaux utilisateurs"
            value={String(data.kpis.newUsers)}
            sub={`${data.totals.users} total`}
            icon={UserPlus}
            trend={
              <Trend
                current={data.kpis.newUsers}
                previous={data.kpis.prevNewUsers}
              />
            }
          />
          <KpiCard
            label="Nouvelles boutiques"
            value={String(data.kpis.newStores)}
            sub={`${data.totals.stores} total`}
            icon={Store}
            trend={
              <Trend
                current={data.kpis.newStores}
                previous={data.kpis.prevNewStores}
              />
            }
          />
          <KpiCard
            label="Revenus plateforme (net)"
            value={formatPrice(data.kpis.netRevenue, "XOF")}
            sub="commissions + pub + stockage + livraison"
            icon={TrendingUp}
          />
          <KpiCard
            label="Frais de livraison"
            value={formatPrice(data.kpis.deliveryFees, "XOF")}
            trend={
              <Trend
                current={data.kpis.deliveryFees}
                previous={data.kpis.prevDeliveryFees}
              />
            }
            icon={Truck}
          />
          <KpiCard
            label="Revenus publicitaires"
            value={formatPrice(data.kpis.adRevenue, "XOF")}
            icon={Megaphone}
          />
          <KpiCard
            label="Revenus stockage"
            value={formatPrice(data.kpis.storageRevenue, "XOF")}
            icon={Warehouse}
          />
        </div>
      )}

      {/* Revenue chart */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium">
            GMV & Commissions
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {!data ? (
            <Skeleton className="h-48 w-full" />
          ) : data.series.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              Aucune donnée pour la période
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.series}
                margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    formatPrice(v, "XOF"),
                    name === "gmv" ? "GMV" : "Commissions",
                  ]}
                  labelFormatter={(l: string) => `Journée du ${l}`}
                />
                <Bar
                  dataKey="gmv"
                  fill="hsl(var(--primary))"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="commissions"
                  fill="hsl(var(--primary) / 0.35)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order status distribution */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium">
              Répartition statuts commandes
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {!data ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.ordersByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({
                      status,
                      percent,
                    }: {
                      status: string;
                      percent: number;
                    }) => `${status} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.ordersByStatus.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} commandes`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Store tiers */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium">
              Boutiques par abonnement
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {!data ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.storesByTier}
                    dataKey="count"
                    nameKey="tier"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                  >
                    {data.storesByTier.map((entry) => (
                      <Cell
                        key={entry.tier}
                        fill={TIER_COLORS[entry.tier] ?? "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      `${v} boutiques`,
                      name,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top stores leaderboard */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium">
            Top 10 boutiques — GMV période
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {!data ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : data.topStores.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune commande sur la période
            </p>
          ) : (
            <div className="space-y-2">
              {data.topStores.map((store, i) => (
                <div key={store.storeId} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4 text-right shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {store.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 shrink-0"
                      >
                        {store.tier}
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{
                          width: `${Math.round((store.gmv / (data.topStores[0]?.gmv || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">
                      {formatPrice(store.gmv, "XOF")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {store.orders} cmd
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Monitoring Tab ───────────────────────────────────────────

function MonitoringTab() {
  const health = useQuery(api.admin.queries.getPlatformHealth);

  if (!health) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  const payoutSeverity: Severity =
    health.payouts.pending === 0
      ? "ok"
      : health.payouts.oldestAgeMs > 48 * 3600000
        ? "critical"
        : "warn";

  const storeSeverity: Severity =
    health.stores.unverified === 0
      ? "ok"
      : health.stores.unverified > 10
        ? "warn"
        : "ok";

  const blockedSeverity: Severity =
    health.stores.blocked === 0
      ? "ok"
      : health.stores.blocked > 5
        ? "critical"
        : "warn";

  const storageSeverity: Severity =
    health.storage.receivedPendingValidation === 0
      ? "ok"
      : health.storage.receivedPendingValidation > 10
        ? "warn"
        : "ok";

  const overdueSeverity: Severity =
    health.storage.overdueInvoices === 0
      ? "ok"
      : health.storage.overdueInvoices > 5
        ? "critical"
        : "warn";

  const staleOrdersSeverity: Severity =
    health.orders.staleInPaid === 0
      ? "ok"
      : health.orders.staleInPaid > 20
        ? "critical"
        : "warn";

  const paymentFailSeverity: Severity =
    health.orders.paymentFailures === 0
      ? "ok"
      : health.orders.paymentFailures > 10
        ? "warn"
        : "ok";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <HealthCard
          label="Retraits en attente"
          value={health.payouts.pending}
          sub={
            health.payouts.pending > 0
              ? `${formatPrice(health.payouts.totalAmount, "XOF")} · plus ancien : ${formatDuration(health.payouts.oldestAgeMs)}`
              : "Aucun retrait en attente"
          }
          severity={payoutSeverity}
          icon={CreditCard}
        />
        <HealthCard
          label="Boutiques non vérifiées"
          value={health.stores.unverified}
          sub={
            health.stores.unverified > 0
              ? "En attente de vérification"
              : "Tout est vérifié"
          }
          severity={storeSeverity}
          icon={Store}
        />
        <HealthCard
          label="Boutiques bloquées (dette > 30j)"
          value={health.stores.blocked}
          sub={
            health.stores.blocked > 0
              ? "Retrait produits bloqué (règle F-06)"
              : "Aucun blocage actif"
          }
          severity={blockedSeverity}
          icon={AlertCircle}
        />
        <HealthCard
          label="Stockage — validation en attente"
          value={health.storage.receivedPendingValidation}
          sub={
            health.storage.pendingDropOff > 0
              ? `+ ${health.storage.pendingDropOff} dépôts en attente`
              : "Dépôts à réceptionner : 0"
          }
          severity={storageSeverity}
          icon={Warehouse}
        />
        <HealthCard
          label="Factures stockage impayées"
          value={health.storage.unpaidInvoices}
          sub={
            health.storage.unpaidInvoices > 0
              ? `${formatPrice(health.storage.unpaidInvoicesTotal, "XOF")} dont ${health.storage.overdueInvoices} en retard`
              : "Aucune facture impayée"
          }
          severity={overdueSeverity}
          icon={AlertTriangle}
        />
        <HealthCard
          label="Commandes bloquées en « Payé »"
          value={health.orders.staleInPaid}
          sub="Payées mais non traitées depuis > 48h"
          severity={staleOrdersSeverity}
          icon={Clock}
        />
        <HealthCard
          label="Paiements non aboutis (7j)"
          value={health.orders.paymentFailures}
          sub="Commandes pending > 24h non confirmées"
          severity={paymentFailSeverity}
          icon={AlertCircle}
        />
        <HealthCard
          label="Publicités actives"
          value={health.ads.active}
          sub={`${health.ads.queued} en file · ${health.ads.pendingPayment} en attente paiement`}
          severity="ok"
          icon={Megaphone}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-green-500" />
          Normal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-yellow-500" />
          Attention
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-500" />
          Critique
        </span>
      </div>
    </div>
  );
}

// ─── Audit Tab ────────────────────────────────────────────────

const AUDIT_FILTERS = [
  { value: "", label: "Tous" },
  { value: "user_banned", label: "Ban" },
  { value: "user_role_changed", label: "Rôle" },
  { value: "store_verified", label: "Vérification" },
  { value: "store_suspended", label: "Suspension" },
  { value: "payout_approved", label: "Retrait" },
  { value: "config_changed", label: "Config" },
  { value: "client_error", label: "Erreurs" },
];

function AuditTab() {
  const [filter, setFilter] = useState("");
  const events = useQuery(api.admin.queries.listAuditLog, {
    limit: 100,
    type: filter || undefined,
  });

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {AUDIT_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Events timeline */}
      {!events ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <ScrollText className="size-10 opacity-25" />
          <p className="text-sm">Aucun événement enregistré</p>
          {filter && (
            <button onClick={() => setFilter("")} className="text-xs underline">
              Effacer le filtre
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {events.map((event) => {
            const config = EVENT_CONFIG[event.type] ?? FALLBACK_EVENT;
            const Icon = config.icon;
            return (
              <div
                key={event._id}
                className="flex items-start gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/50 transition-colors"
              >
                <Icon className={`size-4 shrink-0 mt-0.5 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{config.label}</span>
                    {event.target_label && (
                      <span className="text-xs text-muted-foreground truncate">
                        — {event.target_label}
                      </span>
                    )}
                    {event.metadata && event.type === "user_role_changed" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0"
                      >
                        {String(
                          (event.metadata as Record<string, unknown>).from,
                        )}{" "}
                        →{" "}
                        {String((event.metadata as Record<string, unknown>).to)}
                      </Badge>
                    )}
                    {event.metadata && event.type === "config_changed" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0"
                      >
                        {String(
                          (event.metadata as Record<string, unknown>).from ??
                            "—",
                        )}{" "}
                        →{" "}
                        {String((event.metadata as Record<string, unknown>).to)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Par {event.actor_name ?? "Admin"} ·{" "}
                    {formatDistanceToNow(new Date(event.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5 font-mono">
                  {new Date(event.created_at).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Template ────────────────────────────────────────────

export function AdminDashboardTemplate() {
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Analytics, monitoring et journal d&apos;audit de la plateforme
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="print:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          title="Imprimer le tableau de bord"
        >
          <Printer className="size-4" />
          <span className="hidden sm:inline">Imprimer</span>
        </button>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList className="grid w-full grid-cols-3 max-w-sm">
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="size-3.5" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-1.5">
            <Activity className="size-3.5" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <ScrollText className="size-3.5" />
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsTab period={period} onPeriodChange={setPeriod} />
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <MonitoringTab />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
