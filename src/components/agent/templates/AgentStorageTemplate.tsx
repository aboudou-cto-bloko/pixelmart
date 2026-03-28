// filepath: src/components/agent/templates/AgentStorageTemplate.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatPrice } from "@/lib/format";
import {
  Search,
  Package,
  CheckCircle2,
  AlertCircle,
  Store,
  FileText,
  List,
  Truck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

type PaymentMethod = "deferred" | "immediate";

type MeasurementType = "units" | "weight";

interface FoundRequest {
  _id: string;
  storage_code: string;
  product_name: string;
  status: string;
  estimated_qty?: number;
  actual_qty?: number;
  actual_weight_kg?: number;
  measurement_type?: MeasurementType;
  notes?: string;
  created_at: number;
  store_name: string;
}

interface ValidationResult {
  invoiceId: Id<"storage_invoices">;
  storageFee: number;
}

function CodeLookup({ onFound }: { onFound: (code: string) => void }) {
  const [input, setInput] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const code = input.trim().toUpperCase();
    if (code) onFound(code);
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value.toUpperCase())}
        placeholder="Ex : PM-042"
        className="font-mono text-base uppercase"
        maxLength={10}
      />
      <Button type="submit" disabled={!input.trim()}>
        <Search className="h-4 w-4 mr-2" />
        Rechercher
      </Button>
    </form>
  );
}

function RequestCard({ request }: { request: FoundRequest }) {
  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xl font-black tracking-widest text-primary">
              {request.storage_code}
            </p>
            <p className="font-semibold text-base mt-0.5">
              {request.product_name}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {request.status === "pending_drop_off"
              ? "À réceptionner"
              : request.status === "received"
                ? "Réceptionné"
                : request.status === "in_stock"
                  ? "En stock"
                  : request.status === "rejected"
                    ? "Rejeté"
                    : request.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Store className="h-4 w-4" />
          <span>{request.store_name}</span>
        </div>
        {request.estimated_qty !== undefined && (
          <p className="text-sm text-muted-foreground">
            Quantité estimée par le vendeur :{" "}
            <strong>
              {request.estimated_qty} unité
              {request.estimated_qty > 1 ? "s" : ""}
            </strong>
          </p>
        )}
        {request.notes && (
          <div className="rounded bg-muted px-3 py-2 text-xs text-muted-foreground">
            Note vendeur : {request.notes}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Demande créée le{" "}
          {formatDate(request.created_at, {
            hour: undefined,
            minute: undefined,
          })}
        </p>
      </CardContent>
    </Card>
  );
}

function ReceptionForm({
  storageCode,
  onSuccess,
}: {
  storageCode: string;
  onSuccess: () => void;
}) {
  const [measurementType, setMeasurementType] =
    useState<MeasurementType>("units");
  const [actualQty, setActualQty] = useState("");
  const [actualWeightKg, setActualWeightKg] = useState("");
  const [agentNotes, setAgentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const receiveRequest = useMutation(api.storage.mutations.receiveRequest);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await receiveRequest({
        storage_code: storageCode,
        measurement_type: measurementType,
        actual_qty: measurementType === "units" ? Number(actualQty) : undefined,
        actual_weight_kg:
          measurementType === "weight" ? Number(actualWeightKg) : undefined,
        agent_notes: agentNotes.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isValid =
    measurementType === "units"
      ? Boolean(actualQty) && Number(actualQty) >= 1
      : Boolean(actualWeightKg) && Number(actualWeightKg) > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-3">
        <Label>Type de mesure</Label>
        <RadioGroup
          value={measurementType}
          onValueChange={(v) => setMeasurementType(v as MeasurementType)}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="units" id="units" />
            <Label htmlFor="units" className="cursor-pointer font-normal">
              Unités
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="weight" id="weight" />
            <Label htmlFor="weight" className="cursor-pointer font-normal">
              Poids (kg)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {measurementType === "units" ? (
        <div className="space-y-2">
          <Label htmlFor="actualQty">Quantité réelle *</Label>
          <Input
            id="actualQty"
            type="number"
            min="1"
            value={actualQty}
            onChange={(e) => setActualQty(e.target.value)}
            placeholder="Ex : 15"
            required
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="actualWeightKg">Poids réel (kg) *</Label>
          <Input
            id="actualWeightKg"
            type="number"
            min="0.1"
            step="0.1"
            value={actualWeightKg}
            onChange={(e) => setActualWeightKg(e.target.value)}
            placeholder="Ex : 12.5"
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="agentNotes">Notes agent (optionnel)</Label>
        <Textarea
          id="agentNotes"
          value={agentNotes}
          onChange={(e) => setAgentNotes(e.target.value)}
          placeholder="Observations sur l'état du colis…"
          rows={3}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !isValid}
      >
        {isSubmitting ? "Enregistrement…" : "Confirmer la réception"}
      </Button>
    </form>
  );
}

function ValidationSection({
  requestId,
  storageCode,
  onSuccess,
}: {
  requestId: Id<"storage_requests">;
  storageCode: string;
  onSuccess: (result: ValidationResult) => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("deferred");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateRequest = useMutation(api.storage.mutations.validateRequest);

  async function handleValidate() {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await validateRequest({
        request_id: requestId,
        payment_method: paymentMethod,
      });
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <p className="text-sm font-semibold">Valider la réception</p>
      <p className="text-xs text-muted-foreground">
        Colis <span className="font-mono font-bold">{storageCode}</span> reçu et
        mesuré. Choisissez le mode de paiement pour la facture de stockage.
      </p>
      <div className="space-y-2">
        <Label htmlFor="payment_method">Mode de paiement</Label>
        <Select
          value={paymentMethod}
          onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
        >
          <SelectTrigger id="payment_method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deferred">
              Différé (dette mensuelle)
            </SelectItem>
            <SelectItem value="immediate">
              Immédiat (paiement direct)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <Button
        className="w-full"
        onClick={handleValidate}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Validation en cours…" : "Valider"}
      </Button>
    </div>
  );
}

function ValidationSuccessBanner({
  storageCode,
  result,
  onReset,
}: {
  storageCode: string;
  result: ValidationResult;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4 text-center py-4">
      <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
      <div>
        <p className="font-semibold text-lg">Stockage validé</p>
        <p className="text-sm text-muted-foreground">
          {storageCode} — Produit mis en stock
        </p>
      </div>
      <div className="rounded-lg border bg-muted/50 p-4 text-sm space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-muted-foreground">
            <FileText className="h-4 w-4" />
            Frais de stockage
          </span>
          <span className="font-semibold">
            {formatPrice(result.storageFee)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Facture #{result.invoiceId.slice(-8).toUpperCase()} créée
        </p>
      </div>
      <Button className="w-full" onClick={onReset}>
        Scanner un autre colis
      </Button>
    </div>
  );
}

function CodeResult({
  storageCode,
  onReset,
}: {
  storageCode: string;
  onReset: () => void;
}) {
  const [received, setReceived] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const result = useQuery(api.storage.queries.getByCode, {
    storage_code: storageCode,
  });

  if (result === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Recherche…
      </div>
    );
  }

  if (result === null) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">Code introuvable : {storageCode}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vérifiez que le code est bien écrit sur le colis.
          </p>
        </div>
      </div>
    );
  }

  if (validationResult) {
    return (
      <ValidationSuccessBanner
        storageCode={storageCode}
        result={validationResult}
        onReset={onReset}
      />
    );
  }

  if (result.status === "received") {
    return (
      <div className="space-y-4">
        <RequestCard request={result as FoundRequest} />
        <ValidationSection
          requestId={result._id as Id<"storage_requests">}
          storageCode={storageCode}
          onSuccess={(r) => setValidationResult(r)}
        />
        <Button variant="ghost" size="sm" className="w-full" onClick={onReset}>
          Annuler
        </Button>
      </div>
    );
  }

  if (result.status !== "pending_drop_off") {
    return (
      <div className="space-y-4">
        <RequestCard request={result as FoundRequest} />
        <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground text-center">
          Ce colis est déjà en statut <strong>{result.status}</strong>. Aucune
          action requise.
        </div>
        <Button variant="outline" className="w-full" onClick={onReset}>
          Nouveau scan
        </Button>
      </div>
    );
  }

  if (received) {
    return (
      <div className="space-y-4 text-center py-6">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
        <div>
          <p className="font-semibold text-lg">Colis réceptionné</p>
          <p className="text-sm text-muted-foreground">
            {storageCode} — En attente de validation
          </p>
        </div>
        <Button className="w-full" onClick={onReset}>
          Scanner un autre colis
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RequestCard request={result as FoundRequest} />
      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-4">
          Saisir les mesures officielles
        </p>
        <ReceptionForm
          storageCode={storageCode}
          onSuccess={() => setReceived(true)}
        />
      </div>
      <Button variant="ghost" size="sm" className="w-full" onClick={onReset}>
        Annuler
      </Button>
    </div>
  );
}

// ─── Status config ────────────────────────────────────────────

type StorageStatus = "pending_drop_off" | "received" | "in_stock" | "rejected";

const STATUS_LABELS: Record<StorageStatus, string> = {
  pending_drop_off: "À réceptionner",
  received:         "Réceptionné",
  in_stock:         "En stock",
  rejected:         "Rejeté",
};

const STATUS_STYLES: Record<StorageStatus, string> = {
  pending_drop_off: "bg-amber-100 text-amber-700 border-amber-300",
  received:         "bg-blue-100 text-blue-700 border-blue-300",
  in_stock:         "bg-green-100 text-green-700 border-green-300",
  rejected:         "bg-red-100 text-red-700 border-red-300",
};

// ─── Pipeline Tab ─────────────────────────────────────────────

function PipelineTab() {
  const [statusFilter, setStatusFilter] = useState<StorageStatus | "all">("all");
  const [search, setSearch] = useState("");

  const allRequests = useQuery(api.storage.queries.listAllForAgent, {});
  const filteredByStatus = useQuery(
    api.storage.queries.listAllForAgent,
    statusFilter !== "all" ? { status: statusFilter } : {},
  );

  const requests = statusFilter === "all" ? (allRequests ?? []) : (filteredByStatus ?? []);

  const counts = (allRequests ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const visible = requests.filter((r) => {
    const q = search.trim().toLowerCase();
    return (
      q === "" ||
      r.storage_code.toLowerCase().includes(q) ||
      r.product_name.toLowerCase().includes(q) ||
      r.store_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Status counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(["pending_drop_off", "received", "in_stock", "rejected"] as StorageStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              statusFilter === s
                ? "border-primary bg-primary/5"
                : "bg-muted/40 hover:bg-muted"
            }`}
          >
            <p className="text-lg font-bold">{counts[s] ?? 0}</p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">
              {STATUS_LABELS[s]}
            </p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Code, produit, boutique…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Package className="size-10 opacity-25" />
          <p className="text-sm">Aucun colis trouvé</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Boutique</TableHead>
                <TableHead>Qté / Poids</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="font-mono text-sm font-bold">
                    {r.storage_code}
                  </TableCell>
                  <TableCell className="text-sm">{r.product_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.store_name}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.measurement_type === "weight" && r.actual_weight_kg
                      ? `${r.actual_weight_kg} kg`
                      : r.actual_qty
                        ? `${r.actual_qty} u.`
                        : r.estimated_qty
                          ? `~${r.estimated_qty} u. (estimé)`
                          : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_STYLES[r.status as StorageStatus]}>
                      {STATUS_LABELS[r.status as StorageStatus] ?? r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(r.created_at)}
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

// ─── Dispatch Tab ─────────────────────────────────────────────

type WarehouseBatch = {
  _id: string;
  batch_number: string;
  store_name: string;
  status: string;
  order_count: number;
  storage_codes: string[];
  total_delivery_fee: number;
  assigned_at?: number;
  orders: Array<{
    _id: string;
    order_number: string;
    customer_name: string;
    items: Array<{ product_id: string; name: string; quantity: number; storage_code?: string }>;
    total_amount: number;
    payment_mode: string;
  }>;
};

const BATCH_STATUS_LABELS: Record<string, string> = {
  transmitted: "Transmis",
  assigned: "Assigné",
  in_progress: "En cours",
};

const BATCH_STATUS_STYLES: Record<string, string> = {
  transmitted: "bg-blue-100 text-blue-700 border-blue-300",
  assigned: "bg-purple-100 text-purple-700 border-purple-300",
  in_progress: "bg-orange-100 text-orange-700 border-orange-300",
};

function DispatchBatchCard({ batch }: { batch: WarehouseBatch }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card">
      <button
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-muted/40 transition-colors rounded-lg"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Truck className="size-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <span className="font-mono text-sm font-bold">{batch.batch_number}</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="text-sm">{batch.store_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={BATCH_STATUS_STYLES[batch.status] ?? ""}>
            {BATCH_STATUS_LABELS[batch.status] ?? batch.status}
          </Badge>
          <span className="text-xs text-muted-foreground">{batch.order_count} cmd</span>
          {expanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4">
          {/* Codes à prélever */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Codes à prélever en rayon
            </p>
            <div className="flex flex-wrap gap-2">
              {batch.storage_codes.length > 0 ? (
                batch.storage_codes.map((code) => (
                  <span
                    key={code}
                    className="font-mono text-sm font-bold bg-primary/10 text-primary border border-primary/20 rounded px-2 py-0.5"
                  >
                    {code}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic">
                  Codes non renseignés sur les articles
                </span>
              )}
            </div>
          </div>

          {/* Liste des commandes */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Commandes ({batch.orders.length})
            </p>
            <div className="space-y-2">
              {batch.orders.map((order) => (
                <div key={order._id} className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono font-medium text-xs">{order.order_number}</span>
                    {order.payment_mode === "cod" && (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                        COD — {formatPrice(order.total_amount, "XOF")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">{order.customer_name}</p>
                  <ul className="mt-1.5 space-y-0.5">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.quantity}×</span>
                        <span className="flex-1">{item.name}</span>
                        {item.storage_code && (
                          <span className="font-mono text-primary font-bold">{item.storage_code}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DispatchTab() {
  const batches = useQuery(api.delivery.queries.listWarehouseBatchesForAgent);

  if (batches === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Chargement…
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <Truck className="size-10 opacity-25" />
        <p className="text-sm">Aucune expédition entrepôt en attente</p>
        <p className="text-xs">
          Les lots marqués "Entrepôt" par les vendeurs apparaissent ici une fois assignés.
        </p>
      </div>
    );
  }

  const transmittedCount = batches.filter((b) => b.status === "transmitted").length;
  const assignedCount = batches.filter((b) => b.status === "assigned").length;
  const inProgressCount = batches.filter((b) => b.status === "in_progress").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Transmis", count: transmittedCount, style: "bg-blue-50 border-blue-200" },
          { label: "Assignés", count: assignedCount, style: "bg-purple-50 border-purple-200" },
          { label: "En cours", count: inProgressCount, style: "bg-orange-50 border-orange-200" },
        ].map(({ label, count, style }) => (
          <div key={label} className={`rounded-lg border p-3 ${style}`}>
            <p className="text-xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {batches.map((batch) => (
          <DispatchBatchCard key={batch._id} batch={batch as unknown as WarehouseBatch} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Template ────────────────────────────────────────────

export function AgentStorageTemplate() {
  const [activeCode, setActiveCode] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Entrepôt
        </h1>
        <p className="text-sm text-muted-foreground">
          Réception et suivi du pipeline de stockage
        </p>
      </div>

      <Tabs defaultValue="scan">
        <TabsList>
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Scanner un colis
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="dispatch" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Expéditions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5" />
                Code de stockage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <CodeLookup onFound={(code) => setActiveCode(code)} />
              {activeCode && (
                <div className="border-t pt-4">
                  <CodeResult
                    storageCode={activeCode}
                    onReset={() => setActiveCode(null)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          <PipelineTab />
        </TabsContent>

        <TabsContent value="dispatch" className="mt-4">
          <DispatchTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
