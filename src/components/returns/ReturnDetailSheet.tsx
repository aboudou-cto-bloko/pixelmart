// filepath: src/components/returns/ReturnDetailSheet.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ReturnStatusBadge } from "./ReturnStatusBadge";
import { ReturnReasonBadge } from "./ReturnReasonBadge";
import { formatPrice, formatDate } from "@/lib/format";
import {
  AlertCircle,
  Check,
  X,
  PackageCheck,
  CreditCard,
  Loader2,
  Package,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ReturnDetailSheetProps {
  returnId: Id<"return_requests"> | null;
  onClose: () => void;
}

export function ReturnDetailSheet({
  returnId,
  onClose,
}: ReturnDetailSheetProps) {
  const returnDetail = useQuery(
    api.returns.queries.getById,
    returnId ? { returnId } : "skip",
  );

  const approveReturn = useMutation(api.returns.mutations.approveReturn);
  const rejectReturn = useMutation(api.returns.mutations.rejectReturn);
  const confirmReceived = useMutation(api.returns.mutations.confirmReceived);
  const processRefund = useMutation(api.returns.mutations.processRefund);

  const [vendorNotes, setVendorNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(
    action: "approve" | "reject" | "receive" | "refund",
  ) {
    if (!returnId) return;
    setActionLoading(action);
    setError(null);

    try {
      switch (action) {
        case "approve":
          await approveReturn({
            returnId,
            vendorNotes: vendorNotes.trim() || undefined,
          });
          break;
        case "reject":
          if (rejectionReason.trim().length < 5) {
            setError("Le motif de refus doit contenir au moins 5 caractères");
            setActionLoading(null);
            return;
          }
          await rejectReturn({
            returnId,
            rejectionReason: rejectionReason.trim(),
          });
          break;
        case "receive":
          await confirmReceived({
            returnId,
            vendorNotes: vendorNotes.trim() || undefined,
          });
          break;
        case "refund":
          await processRefund({ returnId });
          break;
      }
      setVendorNotes("");
      setRejectionReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setActionLoading(null);
    }
  }

  const ret = returnDetail;

  return (
    <Sheet open={returnId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        {!ret ? (
          <div className="space-y-4 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                Retour — {ret.order_number}
                <ReturnStatusBadge status={ret.status as any} />
              </SheetTitle>
              <SheetDescription>
                Demandé par {ret.customer_name}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 mt-6">
              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-md border border-red-500/50 bg-red-500/5 p-3">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Infos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    Client
                  </div>
                  <p className="text-sm font-medium">{ret.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ret.customer_email}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Demandé le
                  </div>
                  <p className="text-sm">{formatDate(ret.requested_at)}</p>
                </div>
              </div>

              <Separator />

              {/* Motif */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Motif</span>
                  <ReturnReasonBadge category={ret.reason_category as any} />
                </div>
                <p className="text-sm text-muted-foreground bg-muted/30 rounded-md p-3">
                  {ret.reason}
                </p>
              </div>

              <Separator />

              {/* Items */}
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Articles retournés
                </p>
                <div className="space-y-2">
                  {ret.items.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.unit_price, "XOF")} ×{" "}
                          {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium shrink-0 ml-3">
                        {formatPrice(item.unit_price * item.quantity, "XOF")}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    Total remboursement
                  </p>
                  <p className="text-lg font-semibold">
                    {formatPrice(ret.refund_amount, "XOF")}
                  </p>
                </div>
              </div>

              {/* Existing notes */}
              {ret.vendor_notes && (
                <>
                  <Separator />
                  <div className="rounded-md bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Vos notes
                    </p>
                    <p className="text-sm">{ret.vendor_notes}</p>
                  </div>
                </>
              )}

              {ret.rejection_reason && (
                <>
                  <Separator />
                  <div className="rounded-md bg-red-500/5 border border-red-500/20 p-3">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
                      Motif du refus
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      {ret.rejection_reason}
                    </p>
                  </div>
                </>
              )}

              {/* Timestamps */}
              {(ret.approved_at || ret.received_at || ret.refunded_at) && (
                <>
                  <Separator />
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {ret.approved_at && (
                      <p>Approuvé le {formatDate(ret.approved_at)}</p>
                    )}
                    {ret.received_at && (
                      <p>Reçu le {formatDate(ret.received_at)}</p>
                    )}
                    {ret.refunded_at && (
                      <p>Remboursé le {formatDate(ret.refunded_at)}</p>
                    )}
                  </div>
                </>
              )}

              <Separator />

              {/* ─── ACTIONS ─── */}

              {/* Status: requested → approve or reject */}
              {ret.status === "requested" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Notes vendeur (optionnel)</Label>
                    <Textarea
                      value={vendorNotes}
                      onChange={(e) => setVendorNotes(e.target.value)}
                      placeholder="Instructions pour le client, observations..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAction("approve")}
                      disabled={actionLoading !== null}
                      className="flex-1"
                    >
                      {actionLoading === "approve" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Approuver
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          disabled={actionLoading !== null}
                          className="flex-1"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Refuser
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Refuser le retour</AlertDialogTitle>
                          <AlertDialogDescription>
                            Le client sera notifié du refus. Cette action est
                            irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2 py-2">
                          <Label>Motif du refus</Label>
                          <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Expliquez pourquoi ce retour est refusé..."
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleAction("reject")}
                            disabled={rejectionReason.trim().length < 5}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {actionLoading === "reject" && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Confirmer le refus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}

              {/* Status: approved → confirm received */}
              {ret.status === "approved" && (
                <div className="space-y-4">
                  <div className="rounded-md bg-blue-500/5 border border-blue-500/20 p-3">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      En attente de réception des articles retournés par le
                      client.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Notes (optionnel)</Label>
                    <Textarea
                      value={vendorNotes}
                      onChange={(e) => setVendorNotes(e.target.value)}
                      placeholder="État des articles reçus, observations..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    onClick={() => handleAction("receive")}
                    disabled={actionLoading !== null}
                    className="w-full"
                  >
                    {actionLoading === "receive" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PackageCheck className="mr-2 h-4 w-4" />
                    )}
                    Confirmer la réception des articles
                  </Button>
                </div>
              )}

              {/* Status: received → process refund */}
              {ret.status === "received" && (
                <div className="space-y-4">
                  <div className="rounded-md bg-violet-500/5 border border-violet-500/20 p-3">
                    <p className="text-sm text-violet-700 dark:text-violet-400">
                      Articles reçus. L&apos;inventaire a été restauré. Prêt
                      pour le remboursement.
                    </p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={actionLoading !== null}
                        className="w-full"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Procéder au remboursement —{" "}
                        {formatPrice(ret.refund_amount, "XOF")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Confirmer le remboursement
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Le montant de {formatPrice(ret.refund_amount, "XOF")}{" "}
                          sera débité de votre solde et remboursé au client via
                          Moneroo. Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleAction("refund")}
                        >
                          {actionLoading === "refund" && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Confirmer le remboursement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {/* Terminal states */}
              {ret.status === "refunded" && (
                <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 p-3 text-center">
                  <CreditCard className="h-5 w-5 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Remboursement traité
                  </p>
                  {ret.refund_reference && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Réf. Moneroo : {ret.refund_reference}
                    </p>
                  )}
                </div>
              )}

              {ret.status === "rejected" && (
                <div className="rounded-md bg-red-500/5 border border-red-500/20 p-3 text-center">
                  <X className="h-5 w-5 mx-auto mb-1 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Retour refusé
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
