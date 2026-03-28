// filepath: src/components/admin/templates/AdminPayoutsTemplate.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { formatPrice, formatRelativeTime, formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { CreditCard } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

type PayoutDetails = {
  provider: string;
  phone_number?: string;
  account_name?: string;
  account_number?: string;
  bank_code?: string;
};

type Payout = {
  _id: Id<"payouts">;
  storeName: string;
  storeId: Id<"stores">;
  amount: number;
  fee: number;
  currency: string;
  payout_method: string;
  payout_details: PayoutDetails;
  requested_at: number;
};

type HistoryPayout = Payout & {
  status: string;
  processed_at?: number;
  notes?: string;
};

interface Props {
  pending: Payout[];
  history: HistoryPayout[];
}

// ─── Status Badge ─────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "En attente", variant: "secondary" },
    processing: { label: "En cours", variant: "default" },
    completed: { label: "Complété", variant: "outline" },
    failed: { label: "Échoué", variant: "destructive" },
    cancelled: { label: "Annulé", variant: "destructive" },
  };

  const config = variants[status] ?? { label: status, variant: "secondary" as const };

  return (
    <Badge variant={config.variant} className={
      status === "completed" ? "border-green-500 text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950" :
      status === "processing" ? "border-blue-500 text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950" :
      status === "pending" ? "border-yellow-500 text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950" :
      ""
    }>
      {config.label}
    </Badge>
  );
}

// ─── Approve Dialog ───────────────────────────────────────────

function ApproveDialog({
  payout,
  onClose,
}: {
  payout: Payout | null;
  onClose: () => void;
}) {
  const approvePayout = useMutation(api.admin.mutations.approvePayout);
  const [loading, setLoading] = useState(false);

  if (!payout) return null;

  const net = payout.amount - payout.fee;

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approvePayout({ payoutId: payout._id });
      onClose();
    } catch (err) {
      console.error("Erreur approbation:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!payout} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approuver le virement</DialogTitle>
          <DialogDescription>
            Confirmez l&apos;envoi du virement vers la boutique{" "}
            <strong>{payout.storeName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Boutique</span>
            <span className="font-medium">{payout.storeName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Montant net</span>
            <span className="font-semibold text-green-600">
              {formatPrice(net, payout.currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Méthode</span>
            <span>{payout.payout_details.provider}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Numéro / Compte</span>
            <span>
              {payout.payout_details.phone_number ??
                payout.payout_details.account_number ??
                "—"}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleApprove}
            disabled={loading}
          >
            {loading ? "En cours..." : "Confirmer le virement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reject Dialog ─────────────────────────────────────────────

function RejectDialog({
  payout,
  onClose,
}: {
  payout: Payout | null;
  onClose: () => void;
}) {
  const rejectPayout = useMutation(api.admin.mutations.rejectPayout);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  if (!payout) return null;

  const handleReject = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await rejectPayout({ payoutId: payout._id, reason: reason.trim() });
      onClose();
      setReason("");
    } catch (err) {
      console.error("Erreur rejet:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!payout} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeter le virement</DialogTitle>
          <DialogDescription>
            Le solde sera re-crédité à la boutique{" "}
            <strong>{payout.storeName}</strong>. Indiquez la raison du rejet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            placeholder="Raison du rejet (obligatoire)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={loading || !reason.trim()}
          >
            {loading ? "En cours..." : "Rejeter le virement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pending Tab ──────────────────────────────────────────────

function PendingTab({ payouts }: { payouts: Payout[] }) {
  const [approveTarget, setApproveTarget] = useState<Payout | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Payout | null>(null);

  if (payouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <CreditCard className="size-10 opacity-30" />
        <p className="text-sm">Aucun virement en attente</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Boutique</TableHead>
              <TableHead className="text-right">Montant brut</TableHead>
              <TableHead className="text-right">Frais</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead>Numéro / Compte</TableHead>
              <TableHead>Demandé</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map((payout) => (
              <TableRow key={payout._id}>
                <TableCell className="font-medium">{payout.storeName}</TableCell>
                <TableCell className="text-right">
                  {formatPrice(payout.amount, payout.currency)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatPrice(payout.fee, payout.currency)}
                </TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  {formatPrice(payout.amount - payout.fee, payout.currency)}
                </TableCell>
                <TableCell>{payout.payout_details.provider}</TableCell>
                <TableCell>
                  {payout.payout_details.phone_number ??
                    payout.payout_details.account_number ??
                    "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatRelativeTime(payout.requested_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setApproveTarget(payout)}
                    >
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRejectTarget(payout)}
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

      <ApproveDialog payout={approveTarget} onClose={() => setApproveTarget(null)} />
      <RejectDialog payout={rejectTarget} onClose={() => setRejectTarget(null)} />
    </>
  );
}

// ─── History Tab ──────────────────────────────────────────────

function HistoryTab({ payouts }: { payouts: HistoryPayout[] }) {
  if (payouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <CreditCard className="size-10 opacity-30" />
        <p className="text-sm">Aucun historique disponible</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Boutique</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead>Méthode</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date demande</TableHead>
            <TableHead>Date traitement</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts.map((payout) => (
            <TableRow key={payout._id}>
              <TableCell className="font-medium">{payout.storeName}</TableCell>
              <TableCell className="text-right">
                {formatPrice(payout.amount, payout.currency)}
              </TableCell>
              <TableCell>{payout.payout_details.provider}</TableCell>
              <TableCell>
                <StatusBadge status={payout.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(payout.requested_at)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {payout.processed_at ? formatDate(payout.processed_at) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Main Template ────────────────────────────────────────────

export function AdminPayoutsTemplate({ pending, history }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Gestion des virements
        </h1>
        <p className="text-sm text-muted-foreground">
          Approuvez ou rejetez les demandes de retrait des vendeurs.
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            En attente ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <PendingTab payouts={pending} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTab payouts={history} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
