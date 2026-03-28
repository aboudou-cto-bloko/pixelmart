// filepath: src/components/admin/templates/AdminStorageTemplate.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Warehouse, ArrowDownToLine } from "lucide-react";
import { formatRelativeTime } from "@/lib/format";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ────────────────────────────────────────────────────

type StorageRequest = {
  _id: Id<"storage_requests">;
  storage_code: string;
  status: string;
  storeName: string;
  storeId: Id<"stores">;
  productTitle: string;
  estimated_qty: number | undefined;
  actual_qty: number | undefined;
  actual_weight_kg: number | undefined;
  measurement_type: "units" | "weight" | undefined;
  agent_notes: string | undefined;
  created_at: number;
};

type PendingWithdrawal = {
  _id: Id<"storage_withdrawals">;
  store_id: Id<"stores">;
  request_id: Id<"storage_requests">;
  quantity: number;
  reason?: string;
  status: string;
  requested_by: Id<"users">;
  created_at: number;
  product_name: string;
  storage_code: string;
  store_name: string;
};

interface Props {
  requests: StorageRequest[];
  pendingWithdrawals: PendingWithdrawal[];
}

// ─── Mesures ─────────────────────────────────────────────────

function MesuresCell({ req }: { req: StorageRequest }) {
  if (req.measurement_type === "units" && req.actual_qty !== undefined) {
    return (
      <span className="text-sm">
        <span className="font-medium">{req.actual_qty}</span>{" "}
        <span className="text-muted-foreground text-xs">unités</span>
      </span>
    );
  }
  if (req.measurement_type === "weight" && req.actual_weight_kg !== undefined) {
    return (
      <span className="text-sm">
        <span className="font-medium">{req.actual_weight_kg}</span>{" "}
        <span className="text-muted-foreground text-xs">kg</span>
      </span>
    );
  }
  return <span className="text-muted-foreground text-xs">—</span>;
}

// ─── Notes Agent ─────────────────────────────────────────────

function AgentNotesCell({ notes }: { notes: string | undefined }) {
  if (!notes) return <span className="text-muted-foreground text-xs">—</span>;
  const truncated = notes.length > 50 ? notes.slice(0, 50) + "…" : notes;
  if (notes.length <= 50) {
    return <span className="text-sm">{notes}</span>;
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-sm cursor-help">{truncated}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          <p className="text-xs whitespace-pre-wrap">{notes}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Validate Dialog ─────────────────────────────────────────

function ValidateDialog({
  req,
  onClose,
}: {
  req: StorageRequest | null;
  onClose: () => void;
}) {
  const validateRequest = useMutation(api.storage.mutations.validateRequest);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!req) return null;

  const handleValidate = async () => {
    setLoading(true);
    setError(null);
    try {
      await validateRequest({ request_id: req._id });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!req} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Valider le dépôt</DialogTitle>
          <DialogDescription>
            Confirmez la validation de ce dépôt entrepôt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-24">Code PM</span>
            <Badge
              variant="outline"
              className="font-mono tracking-wider text-xs"
            >
              {req.storage_code}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-24">Boutique</span>
            <span className="font-medium">{req.storeName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-24">Produit</span>
            <span>{req.productTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-24">Mesures</span>
            <MesuresCell req={req} />
          </div>
        </div>

        <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          Les frais de stockage seront calculés et facturés automatiquement
          après validation.
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleValidate}
            disabled={loading}
          >
            {loading ? "Validation…" : "Confirmer la validation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reject Dialog ────────────────────────────────────────────

function RejectDialog({
  req,
  onClose,
}: {
  req: StorageRequest | null;
  onClose: () => void;
}) {
  const rejectRequest = useMutation(api.storage.mutations.rejectRequest);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!req) return null;

  const handleReject = async () => {
    if (reason.trim().length < 5) return;
    setLoading(true);
    setError(null);
    try {
      await rejectRequest({
        request_id: req._id,
        rejection_reason: reason.trim(),
      });
      onClose();
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!req} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeter le dépôt</DialogTitle>
          <DialogDescription>
            Le dépôt{" "}
            <span className="font-mono font-semibold">{req.storage_code}</span>{" "}
            sera rejeté. Le vendeur sera notifié.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="Raison du rejet (obligatoire, min. 5 caractères)…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading || reason.trim().length < 5}
          >
            {loading ? "Rejet…" : "Rejeter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ProcessWithdrawalDialog ──────────────────────────────────

function ProcessWithdrawalDialog({
  withdrawal,
  onClose,
}: {
  withdrawal: PendingWithdrawal | null;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const processWithdrawal = useMutation(api.storage.mutations.processWithdrawal);

  if (!withdrawal) return null;

  async function handle(status: "approved" | "processed" | "cancelled") {
    if (!withdrawal) return;
    setLoading(true);
    try {
      await processWithdrawal({
        withdrawalId: withdrawal._id,
        status,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={!!withdrawal} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Traiter le retrait</DialogTitle>
          <DialogDescription>
            {withdrawal.store_name} — {withdrawal.product_name} ({withdrawal.storage_code})
            <br />
            Quantité demandée : <strong>{withdrawal.quantity}</strong>
            {withdrawal.reason && (
              <><br />Raison : {withdrawal.reason}</>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            placeholder="Notes (optionnel)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => handle("cancelled")}
            disabled={loading}
            className="text-destructive border-destructive hover:bg-destructive hover:text-white"
          >
            Refuser
          </Button>
          <Button
            onClick={() => handle("approved")}
            disabled={loading}
            variant="outline"
          >
            Approuver
          </Button>
          <Button
            onClick={() => handle("processed")}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? "Traitement…" : "Marquer remis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Template ────────────────────────────────────────────

export function AdminStorageTemplate({ requests, pendingWithdrawals }: Props) {
  const [validateTarget, setValidateTarget] = useState<StorageRequest | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<StorageRequest | null>(null);
  const [withdrawalTarget, setWithdrawalTarget] = useState<PendingWithdrawal | null>(null);

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Validation des dépôts entrepôt
        </h1>
        <p className="text-sm text-muted-foreground">
          Demandes reçues et mesurées par les agents — en attente de validation
          admin
        </p>
      </div>

      {/* Counter */}
      <div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {requests.length} dépôt{requests.length !== 1 ? "s" : ""} en attente
          de validation
        </Badge>
      </div>

      {/* Empty state */}
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <Warehouse className="size-12 opacity-25" />
          <p className="text-sm">Aucun dépôt en attente de validation</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code PM</TableHead>
                <TableHead>Boutique</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Mesures</TableHead>
                <TableHead>Notes agent</TableHead>
                <TableHead>Reçu</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req._id}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-mono tracking-wider text-xs"
                    >
                      {req.storage_code}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {req.storeName}
                  </TableCell>
                  <TableCell className="text-sm max-w-36 truncate">
                    {req.productTitle}
                  </TableCell>
                  <TableCell>
                    <MesuresCell req={req} />
                  </TableCell>
                  <TableCell className="max-w-48">
                    <AgentNotesCell notes={req.agent_notes} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(req.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs"
                        onClick={() => setValidateTarget(req)}
                      >
                        Valider
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-3 text-xs"
                        onClick={() => setRejectTarget(req)}
                      >
                        Rejeter
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Retraits en attente */}
      {pendingWithdrawals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold">
              Retraits en attente
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({pendingWithdrawals.length})
              </span>
            </h2>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Boutique</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="hidden sm:table-cell">Raison</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingWithdrawals.map((w) => (
                  <TableRow key={w._id}>
                    <TableCell className="font-medium text-sm">{w.store_name}</TableCell>
                    <TableCell className="text-sm">{w.product_name}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{w.storage_code}</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{w.quantity}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {w.reason ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => setWithdrawalTarget(w)}
                      >
                        Traiter
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ValidateDialog
        req={validateTarget}
        onClose={() => setValidateTarget(null)}
      />
      <RejectDialog
        req={rejectTarget}
        onClose={() => setRejectTarget(null)}
      />
      <ProcessWithdrawalDialog
        withdrawal={withdrawalTarget}
        onClose={() => setWithdrawalTarget(null)}
      />
    </div>
  );
}
