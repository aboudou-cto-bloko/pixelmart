// filepath: src/components/admin/templates/AdminDeliveryBatchesTemplate.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  ChevronDown,
  Warehouse,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─── Types ────────────────────────────────────────────────────

type BatchStatus =
  | "pending"
  | "transmitted"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

type Batch = {
  _id: Id<"delivery_batches">;
  batch_number: string;
  store_id: Id<"stores">;
  store_name: string;
  vendor_name: string;
  order_ids: Id<"orders">[];
  order_count: number;
  status: BatchStatus;
  grouping_type: "zone" | "manual";
  is_warehouse_batch?: boolean;
  total_delivery_fee: number;
  total_to_collect: number;
  zone_name?: string;
  admin_notes?: string;
  transmitted_at?: number;
  assigned_at?: number;
  completed_at?: number;
  _creationTime: number;
};

type Stats = {
  transmitted: number;
  assigned: number;
  in_progress: number;
  completed_today: number;
  total_fees_all: number;
};

interface Props {
  batches: Batch[];
  stats: Stats;
}

// ─── Status Badge ─────────────────────────────────────────────

const STATUS_LABELS: Record<BatchStatus, string> = {
  pending: "En attente",
  transmitted: "Transmis",
  assigned: "Assigné",
  in_progress: "En cours",
  completed: "Livré",
  cancelled: "Annulé",
};

const STATUS_CLASSES: Record<BatchStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  transmitted: "bg-blue-100 text-blue-700 border-blue-300",
  assigned: "bg-purple-100 text-purple-700 border-purple-300",
  in_progress: "bg-orange-100 text-orange-700 border-orange-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
};

function StatusBadge({ status }: { status: BatchStatus }) {
  return (
    <Badge className={STATUS_CLASSES[status]}>{STATUS_LABELS[status]}</Badge>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 flex items-center gap-3 ${highlight ? "border-blue-200 bg-blue-50" : ""}`}
    >
      <Icon className="size-5 text-muted-foreground shrink-0" />
      <div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Status Transition Dialog ─────────────────────────────────

function TransitionDialog({
  batch,
  targetStatus,
  onClose,
}: {
  batch: Batch | null;
  targetStatus: "assigned" | "in_progress" | "completed" | "cancelled" | null;
  onClose: () => void;
}) {
  const update = useMutation(api.admin.mutations.updateBatchStatus);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!batch || !targetStatus) return null;

  const LABELS: Record<string, string> = {
    assigned: "Assigner le lot",
    in_progress: "Démarrer la livraison",
    completed: "Marquer comme livré",
    cancelled: "Annuler le lot",
  };

  const DESCRIPTIONS: Record<string, string> = {
    assigned: `Le lot ${batch.batch_number} sera marqué comme assigné à un livreur.`,
    in_progress: `La livraison du lot ${batch.batch_number} sera démarrée.`,
    completed: `Le lot ${batch.batch_number} sera marqué comme entièrement livré.`,
    cancelled: `Le lot ${batch.batch_number} sera annulé. Les commandes retourneront en statut prêt.`,
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await update({
        batchId: batch._id,
        status: targetStatus,
        notes: notes.trim() || undefined,
      });
      onClose();
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const isDestructive = targetStatus === "cancelled";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{LABELS[targetStatus]}</DialogTitle>
          <DialogDescription>{DESCRIPTIONS[targetStatus]}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optionnel)</Label>
          <Textarea
            id="notes"
            placeholder="Infos livreur, raison d'annulation…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            variant={isDestructive ? "destructive" : "default"}
          >
            {loading ? "…" : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Batch Detail Sheet ───────────────────────────────────────

function BatchDetailSheet({
  batch,
  onClose,
}: {
  batch: Batch | null;
  onClose: () => void;
}) {
  if (!batch) return null;

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm">{batch.batch_number}</span>
            <StatusBadge status={batch.status} />
            {batch.is_warehouse_batch && (
              <Badge className="bg-teal-100 text-teal-700 border-teal-300 gap-1 text-xs">
                <Warehouse className="size-3" />
                Entrepôt
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Boutique</p>
              <p className="font-medium">{batch.store_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Vendeur</p>
              <p className="font-medium">{batch.vendor_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Zone</p>
              <p className="font-medium">{batch.zone_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Commandes</p>
              <p className="font-medium">{batch.order_count}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Frais de livraison</p>
              <p className="font-medium">
                {formatPrice(batch.total_delivery_fee, "XOF")}
              </p>
            </div>
            {batch.total_to_collect > 0 && (
              <div>
                <p className="text-muted-foreground text-xs">À encaisser (COD)</p>
                <p className="font-medium text-orange-600">
                  {formatPrice(batch.total_to_collect, "XOF")}
                </p>
              </div>
            )}
          </div>

          {batch.admin_notes && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Notes admin</p>
              <p>{batch.admin_notes}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Créé {formatRelativeTime(batch._creationTime)}</p>
            {batch.transmitted_at && (
              <p>Transmis {formatRelativeTime(batch.transmitted_at)}</p>
            )}
            {batch.assigned_at && (
              <p>Assigné {formatRelativeTime(batch.assigned_at)}</p>
            )}
            {batch.completed_at && (
              <p>Livré {formatRelativeTime(batch.completed_at)}</p>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">
              {batch.order_count} commande{batch.order_count !== 1 ? "s" : ""} dans ce lot
            </p>
            <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
              IDs: {batch.order_ids.slice(0, 5).join(", ")}
              {batch.order_ids.length > 5 && ` + ${batch.order_ids.length - 5} autres`}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────

const FILTERS: { label: string; value: BatchStatus | "all" | "warehouse" }[] = [
  { label: "Tous", value: "all" },
  { label: "Transmis", value: "transmitted" },
  { label: "Assignés", value: "assigned" },
  { label: "En cours", value: "in_progress" },
  { label: "Livrés", value: "completed" },
  { label: "Annulés", value: "cancelled" },
  { label: "Entrepôt", value: "warehouse" },
];

// ─── Main Template ────────────────────────────────────────────

export function AdminDeliveryBatchesTemplate({ batches, stats }: Props) {
  const [filter, setFilter] = useState<BatchStatus | "all" | "warehouse">("all");
  const [detailBatch, setDetailBatch] = useState<Batch | null>(null);
  const [transitionBatch, setTransitionBatch] = useState<Batch | null>(null);
  const [transitionTarget, setTransitionTarget] = useState<
    "assigned" | "in_progress" | "completed" | "cancelled" | null
  >(null);

  const filtered =
    filter === "all"
      ? batches
      : filter === "warehouse"
        ? batches.filter((b) => b.is_warehouse_batch)
        : batches.filter((b) => b.status === filter);

  const openTransition = (
    batch: Batch,
    status: "assigned" | "in_progress" | "completed" | "cancelled",
  ) => {
    setTransitionBatch(batch);
    setTransitionTarget(status);
  };

  const closeTransition = () => {
    setTransitionBatch(null);
    setTransitionTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Transmis (en attente)"
          value={stats.transmitted}
          icon={Clock}
          highlight={stats.transmitted > 0}
        />
        <KpiCard
          label="Assignés"
          value={stats.assigned}
          icon={Package}
        />
        <KpiCard
          label="En cours"
          value={stats.in_progress}
          icon={Truck}
        />
        <KpiCard
          label="Livrés aujourd'hui"
          value={stats.completed_today}
          icon={CheckCircle2}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f) => {
          const count =
            f.value === "all"
              ? batches.length
              : f.value === "warehouse"
                ? batches.filter((b) => b.is_warehouse_batch).length
                : batches.filter((b) => b.status === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
              {count > 0 && (
                <span className="ml-1.5 text-xs opacity-70">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Truck className="size-10 opacity-20" />
          <p className="text-sm">Aucun lot dans cette catégorie</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot</TableHead>
                <TableHead>Boutique</TableHead>
                <TableHead className="text-center">Commandes</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Frais</TableHead>
                <TableHead className="text-right">COD</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((batch) => (
                <TableRow
                  key={batch._id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setDetailBatch(batch)}
                >
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-medium">
                        {batch.batch_number}
                      </span>
                      {batch.is_warehouse_batch && (
                        <Badge className="bg-teal-100 text-teal-700 border-teal-300 gap-1 text-xs py-0">
                          <Warehouse className="size-3" />
                          Entrepôt
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{batch.store_name}</TableCell>
                  <TableCell className="text-center text-sm">
                    {batch.order_count}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {batch.zone_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={batch.status} />
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatPrice(batch.total_delivery_fee, "XOF")}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {batch.total_to_collect > 0 ? (
                      <span className="text-orange-600">
                        {formatPrice(batch.total_to_collect, "XOF")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(batch._creationTime)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ChevronDown className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailBatch(batch);
                          }}
                        >
                          <ChevronRight className="size-3.5 mr-2" />
                          Voir le détail
                        </DropdownMenuItem>

                        {batch.status === "transmitted" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openTransition(batch, "assigned");
                              }}
                            >
                              <Package className="size-3.5 mr-2" />
                              Assigner
                            </DropdownMenuItem>
                          </>
                        )}

                        {batch.status === "assigned" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openTransition(batch, "in_progress");
                              }}
                            >
                              <Truck className="size-3.5 mr-2" />
                              Démarrer livraison
                            </DropdownMenuItem>
                          </>
                        )}

                        {batch.status === "in_progress" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openTransition(batch, "completed");
                              }}
                            >
                              <CheckCircle2 className="size-3.5 mr-2" />
                              Marquer livré
                            </DropdownMenuItem>
                          </>
                        )}

                        {["transmitted", "assigned", "in_progress"].includes(
                          batch.status,
                        ) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                openTransition(batch, "cancelled");
                              }}
                            >
                              <X className="size-3.5 mr-2" />
                              Annuler
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <BatchDetailSheet
        batch={detailBatch}
        onClose={() => setDetailBatch(null)}
      />

      <TransitionDialog
        batch={transitionBatch}
        targetStatus={transitionTarget}
        onClose={closeTransition}
      />
    </div>
  );
}
