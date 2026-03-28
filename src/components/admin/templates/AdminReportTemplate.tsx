// filepath: src/components/admin/templates/AdminReportTemplate.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatPrice } from "@/lib/format";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────────────

type Period = "7d" | "30d" | "90d";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "90 derniers jours",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending:            "En attente",
  paid:               "Payée",
  processing:         "En préparation",
  shipped:            "Expédiée",
  delivered:          "Livrée",
  cancelled:          "Annulée",
  refunded:           "Remboursée",
  ready_for_delivery: "Prête à livrer",
  delivery_failed:    "Échec livraison",
};

const AUDIT_EVENT_LABELS: Record<string, string> = {
  user_banned:       "Utilisateur banni",
  user_unbanned:     "Utilisateur débanni",
  user_deleted:      "Utilisateur supprimé",
  user_role_changed: "Rôle modifié",
  store_verified:    "Boutique vérifiée",
  store_suspended:   "Boutique suspendue",
  store_reactivated: "Boutique réactivée",
  payout_approved:   "Retrait approuvé",
  payout_rejected:   "Retrait rejeté",
  config_changed:    "Configuration modifiée",
  config_reset:      "Configuration réinitialisée",
  storage_validated: "Stockage validé",
  storage_rejected:  "Stockage rejeté",
  bulk_action:       "Action groupée",
};

// ─── Section heading ──────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold border-b pb-1">{title}</h2>
      {children}
    </section>
  );
}

// ─── KPI row ──────────────────────────────────────────────────

function KpiRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b last:border-0">
      <div>
        <span className="text-sm">{label}</span>
        {sub && <span className="text-xs text-muted-foreground ml-2">{sub}</span>}
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

// ─── Main Template ────────────────────────────────────────────

export function AdminReportTemplate() {
  const [period, setPeriod] = useState<Period>("30d");

  const analytics = useQuery(api.admin.queries.getAnalytics, { period });
  const stats = useQuery(api.admin.queries.getPlatformStats);
  const auditLog = useQuery(api.admin.queries.listAuditLog, { limit: 50 });

  const reportDate = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header — hidden on print */}
      <div className="flex items-start justify-between print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Rapport d&apos;activité</h1>
          <p className="text-sm text-muted-foreground">Générez et imprimez un rapport de la plateforme</p>
        </div>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="size-4" />
          Imprimer / PDF
        </Button>
      </div>

      {/* Period selector — hidden on print */}
      <div className="flex items-center gap-2 print:hidden">
        {(["7d", "30d", "90d"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* ── Print document ── */}
      <div className="print:block space-y-8 p-0 print:p-0">

        {/* Document title — visible on print */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">Rapport d&apos;activité — Pixel-Mart</h1>
          <p className="text-sm text-muted-foreground">
            Période : {PERIOD_LABELS[period]} · Généré le {reportDate}
          </p>
        </div>

        {/* Totaux plateforme */}
        <Section title="Totaux plateforme">
          {!stats ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (
            <div className="divide-y rounded-md border px-4">
              <KpiRow label="Utilisateurs inscrits" value={String(stats.totals.users)} />
              <KpiRow label="Boutiques" value={String(stats.totals.stores)} />
              <KpiRow label="Commandes (total)" value={String(stats.totals.orders)} />
              <KpiRow label="Boutiques non vérifiées" value={String(stats.alerts.unverifiedStoresCount)} />
              <KpiRow label="Retraits en attente" value={String(stats.alerts.pendingPayoutsCount)} />
            </div>
          )}
        </Section>

        {/* KPIs de la période */}
        <Section title={`Analytics — ${PERIOD_LABELS[period]}`}>
          {!analytics ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (
            <div className="divide-y rounded-md border px-4">
              <KpiRow
                label="GMV (Volume de ventes)"
                value={formatPrice(analytics.kpis.gmv, "XOF")}
              />
              <KpiRow
                label="Commandes payées"
                value={String(analytics.kpis.orders)}
                sub={`panier moyen ${formatPrice(analytics.kpis.aov, "XOF")}`}
              />
              <KpiRow
                label="Taux de conversion"
                value={`${analytics.kpis.conversionRate}%`}
              />
              <KpiRow
                label="Commissions perçues"
                value={formatPrice(analytics.kpis.commissions, "XOF")}
              />
              <KpiRow
                label="Revenus publicitaires"
                value={formatPrice(analytics.kpis.adRevenue, "XOF")}
              />
              <KpiRow
                label="Revenus stockage"
                value={formatPrice(analytics.kpis.storageRevenue, "XOF")}
              />
              <KpiRow
                label="Revenus nets plateforme"
                value={formatPrice(analytics.kpis.netRevenue, "XOF")}
                sub="commissions + pub + stockage"
              />
              <KpiRow
                label="Nouveaux utilisateurs"
                value={String(analytics.kpis.newUsers)}
              />
              <KpiRow
                label="Nouvelles boutiques"
                value={String(analytics.kpis.newStores)}
              />
            </div>
          )}
        </Section>

        {/* Répartition statuts commandes */}
        {analytics && analytics.ordersByStatus.length > 0 && (
          <Section title="Répartition des commandes par statut">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Nombre</TableHead>
                    <TableHead className="text-right">Part</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.ordersByStatus
                    .sort((a, b) => b.count - a.count)
                    .map((row) => {
                      const total = analytics.ordersByStatus.reduce((s, r) => s + r.count, 0);
                      const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
                      return (
                        <TableRow key={row.status}>
                          <TableCell className="text-sm">
                            {ORDER_STATUS_LABELS[row.status] ?? row.status}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {row.count}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {pct}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </Section>
        )}

        {/* Top boutiques */}
        {analytics && analytics.topStores.length > 0 && (
          <Section title="Top boutiques — GMV période">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Boutique</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Commandes</TableHead>
                    <TableHead className="text-right">GMV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topStores.map((store, i) => (
                    <TableRow key={store.storeId}>
                      <TableCell className="text-sm text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="text-sm font-medium">{store.name}</TableCell>
                      <TableCell className="text-sm capitalize">{store.tier}</TableCell>
                      <TableCell className="text-right text-sm">{store.orders}</TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatPrice(store.gmv, "XOF")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Section>
        )}

        {/* Journal d'audit */}
        <Section title="Journal d'audit (50 dernières actions)">
          {!auditLog ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun événement enregistré.</p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Cible</TableHead>
                    <TableHead>Par</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLog.map((event) => (
                    <TableRow key={event._id}>
                      <TableCell className="text-sm">
                        {AUDIT_EVENT_LABELS[event.type] ?? event.type}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.target_label ?? event.target_id ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">{event.actor_name ?? "Admin"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(event.created_at).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Section>

        {/* Footer */}
        <div className="text-xs text-muted-foreground pt-4 border-t">
          Pixel-Mart · Rapport généré le {reportDate}
        </div>
      </div>
    </div>
  );
}
