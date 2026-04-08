// filepath: src/components/storage/templates/VendorStorageTemplate.tsx
"use client";

import { useState } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice, formatDate } from "@/lib/format";
import {
  Plus,
  Package,
  CheckCircle2,
  ArrowDownToLine,
  Lock,
  FlaskConical,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

type StorageStatus = Doc<"storage_requests">["status"];
type StatusFilter = StorageStatus | "all";

interface StorageRequest {
  _id: string;
  storage_code: string;
  product_name: string;
  status: StorageStatus;
  estimated_qty?: number;
  actual_qty?: number;
  actual_weight_kg?: number;
  measurement_type?: "units" | "weight";
  storage_fee?: number;
  created_at: number;
  updated_at: number;
  rejection_reason?: string;
  pending_orders_count?: number; // nb commandes éligibles pour expédition entrepôt
}

interface StorageStats {
  in_stock_count: number;
  pending_count: number;
  outstanding_debt: number;
  unpaid_invoices_count: number;
}

interface VendorStorageTemplateProps {
  requests: StorageRequest[];
  stats: StorageStats | undefined;
  statusFilter: StatusFilter;
  onStatusFilterChange: (s: StatusFilter) => void;
  isLoading: boolean;
  usePmService?: boolean;
}

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "pending_drop_off", label: "À déposer" },
  { value: "received", label: "Réceptionnés" },
  { value: "in_stock", label: "En stock" },
  { value: "rejected", label: "Rejetés" },
];

const STATUS_BADGE: Record<
  StorageStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending_drop_off: { label: "À déposer", variant: "secondary" },
  received: { label: "Réceptionné", variant: "outline" },
  in_stock: { label: "En stock", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

function NewRequestDialog() {
  const [open, setOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [estimatedQty, setEstimatedQty] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ storageCode: string } | null>(null);

  const createRequest = useMutation(api.storage.mutations.createRequest);
  const products = useQuery(api.products.queries.listByStore, {
    status: "active",
  });

  const selectedProduct = products?.find((p) => p._id === selectedProductId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      const res = await createRequest({
        product_name: selectedProduct.title,
        product_id: selectedProduct._id as Id<"products">,
        estimated_qty: estimatedQty ? Number(estimatedQty) : undefined,
        notes: notes.trim() || undefined,
      });
      setResult({ storageCode: res.storageCode });
      setSelectedProductId("");
      setEstimatedQty("");
      setNotes("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la création",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle demande
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Demande de mise en stock</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <p className="text-sm text-muted-foreground">
              Votre demande a été créée. Écrivez ce code sur votre colis :
            </p>
            <div className="rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 p-6">
              <p className="font-mono text-3xl font-black tracking-widest text-amber-800">
                {result.storageCode}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Un email de confirmation vous a été envoyé.
            </p>
            <Button className="w-full" onClick={handleClose}>
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productSelect">Produit *</Label>
              {products === undefined ? (
                <div className="h-9 rounded-md border bg-muted animate-pulse" />
              ) : products.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-md border px-3 py-2">
                  Aucun produit actif dans votre boutique.
                </p>
              ) : (
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger id="productSelect">
                    <SelectValue placeholder="Sélectionner un produit…" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedQty">Quantité estimée (optionnel)</Label>
              <Input
                id="estimatedQty"
                type="number"
                min="1"
                value={estimatedQty}
                onChange={(e) => setEstimatedQty(e.target.value)}
                placeholder="Ex : 15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informations supplémentaires pour l'agent…"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedProductId}
              >
                {isSubmitting ? "Création…" : "Créer la demande"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WithdrawalDialog({
  requestId,
  productName,
  availableQty,
}: {
  requestId: Id<"storage_requests">;
  productName: string;
  availableQty: number;
}) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const requestWithdrawal = useMutation(
    api.storage.mutations.requestWithdrawal,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    if (qty < 1 || qty > availableQty) return;
    setIsSubmitting(true);
    try {
      await requestWithdrawal({
        request_id: requestId,
        quantity: qty,
        reason: reason.trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setDone(false);
    setQuantity("1");
    setReason("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
          <ArrowDownToLine className="mr-1 h-3 w-3" />
          Retrait
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Demande de retrait</DialogTitle>
        </DialogHeader>
        {done ? (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
            <p className="text-sm text-muted-foreground">
              Votre demande de retrait a été soumise. Un agent vous contactera
              pour organiser la récupération.
            </p>
            <Button className="w-full" onClick={handleClose}>
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Produit :{" "}
              <span className="font-medium text-foreground">{productName}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="withdrawQty">
                Quantité à retirer (max {availableQty})
              </Label>
              <Input
                id="withdrawQty"
                type="number"
                min="1"
                max={availableQty}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawReason">Raison (optionnel)</Label>
              <Textarea
                id="withdrawReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex : retour fournisseur, rupture de commande…"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  Number(quantity) < 1 ||
                  Number(quantity) > availableQty
                }
              >
                {isSubmitting ? "Envoi…" : "Soumettre"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MeasureLabel({ request }: { request: StorageRequest }) {
  if (
    request.measurement_type === "units" &&
    request.actual_qty !== undefined
  ) {
    return (
      <span>
        {request.actual_qty} unité{request.actual_qty > 1 ? "s" : ""}
      </span>
    );
  }
  if (
    request.measurement_type === "weight" &&
    request.actual_weight_kg !== undefined
  ) {
    return <span>{request.actual_weight_kg} kg</span>;
  }
  if (request.estimated_qty !== undefined) {
    return (
      <span className="text-muted-foreground">
        {request.estimated_qty} est.
      </span>
    );
  }
  return <span className="text-muted-foreground">—</span>;
}

function DemoStorageActions({
  requestId,
  status,
}: {
  requestId: string;
  status: StorageStatus;
}) {
  const [loading, setLoading] = useState(false);
  const simulateReceived = useAction(api.demo.actions.simulateStorageReceived);
  const simulateValidated = useAction(
    api.demo.actions.simulateStorageValidated,
  );

  if (status !== "pending_drop_off" && status !== "received") return null;

  const handleReceive = async () => {
    setLoading(true);
    try {
      await simulateReceived({
        requestId: requestId as Parameters<
          typeof simulateReceived
        >[0]["requestId"],
      });
      toast.success("Réception simulée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setLoading(true);
    try {
      await simulateValidated({
        requestId: requestId as Parameters<
          typeof simulateValidated
        >[0]["requestId"],
      });
      toast.success("Validation simulée — produit en stock");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={status === "pending_drop_off" ? handleReceive : handleValidate}
      className="border-primary/40 text-primary hover:bg-primary/10 text-xs"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
      ) : (
        <FlaskConical className="h-3 w-3 mr-1" />
      )}
      {status === "pending_drop_off" ? "Sim. réception" : "Sim. validation"}
    </Button>
  );
}

function StorageRequestsTable({
  requests,
  isLoading,
  isDemo,
}: {
  requests: StorageRequest[];
  isLoading: boolean;
  isDemo?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
        <Package className="h-10 w-10 opacity-30" />
        <p className="text-sm">Aucune demande de stockage</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Produit</TableHead>
          <TableHead className="hidden sm:table-cell">Quantité</TableHead>
          <TableHead className="hidden md:table-cell">Frais</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="hidden md:table-cell text-center">
            Cmdes en attente
          </TableHead>
          <TableHead className="hidden md:table-cell text-center">
            Actions
          </TableHead>
          <TableHead className="hidden lg:table-cell text-right">
            Date
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((req) => {
          const badge = STATUS_BADGE[req.status];
          return (
            <TableRow key={req._id}>
              <TableCell>
                <span className="font-mono font-semibold text-sm">
                  {req.storage_code}
                </span>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">{req.product_name}</p>
                  {req.status === "rejected" && req.rejection_reason && (
                    <p className="text-xs text-destructive line-clamp-1">
                      {req.rejection_reason}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm">
                <MeasureLabel request={req} />
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm">
                {req.storage_fee !== undefined ? (
                  formatPrice(req.storage_fee, "XOF")
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell text-center">
                {req.status === "in_stock" ? (
                  req.pending_orders_count !== null &&
                  req.pending_orders_count !== undefined &&
                  req.pending_orders_count > 0 ? (
                    <Badge className="bg-teal-100 text-teal-700 border-teal-300">
                      {req.pending_orders_count} cmd
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell text-center">
                {req.status === "in_stock" && (req.actual_qty ?? 0) > 0 ? (
                  <WithdrawalDialog
                    requestId={req._id as Id<"storage_requests">}
                    productName={req.product_name}
                    availableQty={req.actual_qty ?? 0}
                  />
                ) : isDemo &&
                  (req.status === "pending_drop_off" ||
                    req.status === "received") ? (
                  <DemoStorageActions requestId={req._id} status={req.status} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-right text-xs text-muted-foreground">
                {formatDate(req.created_at, {
                  hour: undefined,
                  minute: undefined,
                })}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function VendorStorageTemplate({
  requests,
  stats,
  statusFilter,
  onStatusFilterChange,
  isLoading,
  usePmService = true,
}: VendorStorageTemplateProps) {
  const isDemo = useQuery(api.demo.queries.isCurrentUserDemo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Stockage
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos demandes de mise en stock à l&apos;entrepôt Pixel-Mart
          </p>
        </div>
        {usePmService && <NewRequestDialog />}
      </div>

      {/* Hard block: PM delivery service required */}
      {!usePmService && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-destructive/10 p-2 shrink-0">
                <Lock className="size-5 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-destructive">
                  Service de stockage non disponible
                </p>
                <p className="text-sm text-muted-foreground">
                  Le service de stockage Pixel-Mart est réservé aux boutiques
                  qui utilisent le service de livraison Pixel-Mart. Activez le
                  service de livraison dans vos{" "}
                  <a
                    href="/vendor/settings"
                    className="underline text-foreground hover:text-primary"
                  >
                    paramètres boutique
                  </a>{" "}
                  pour accéder au stockage.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              En stock
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">{stats?.in_stock_count ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">{stats?.pending_count ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Dette en cours
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-amber-600">
              {stats !== undefined
                ? formatPrice(stats.outstanding_debt, "XOF")
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Factures impayées
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p
              className={`text-2xl font-bold ${(stats?.unpaid_invoices_count ?? 0) > 0 ? "text-destructive" : ""}`}
            >
              {stats?.unpaid_invoices_count ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Table */}
      <div className="space-y-4">
        <Tabs
          value={statusFilter}
          onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}
        >
          <TabsList className="h-auto flex-wrap gap-1">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs sm:text-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <StorageRequestsTable
          requests={requests}
          isLoading={isLoading}
          isDemo={isDemo === true}
        />
      </div>
    </div>
  );
}
