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
import { formatDate, formatPrice } from "@/lib/format";
import {
  Search,
  Package,
  CheckCircle2,
  AlertCircle,
  Store,
  FileText,
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

export function AgentStorageTemplate() {
  const [activeCode, setActiveCode] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Réception entrepôt
        </h1>
        <p className="text-sm text-muted-foreground">
          Scannez ou saisissez le code écrit sur le colis
        </p>
      </div>

      {/* Scanner / Lookup */}
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
    </div>
  );
}
