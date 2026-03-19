// filepath: src/app/(vendor)/vendor/delivery/[id]/page.tsx

"use client";

import { use } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { useDeliveryBatchPDF } from "@/hooks/useDeliveryBatchPDF";
import { BatchStatusBadge } from "@/components/delivery/atoms/BatchStatusBadge";
import { DeliveryTypeBadge } from "@/components/delivery/atoms/DeliveryTypeBadge";
import { PaymentModeBadge } from "@/components/delivery/atoms/PaymentModeBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  XCircle,
  FileText,
  Loader2,
  MapPin,
  Phone,
  User,
  Package,
  Truck,
  Banknote,
  CreditCard,
  Clock,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Page Component ──────────────────────────────────────────

export default function BatchDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const batchId = id as Id<"delivery_batches">;

  const batchDetail = useQuery(api.delivery.queries.getBatchDetail, {
    batchId,
  });

  const transmitBatch = useMutation(api.delivery.mutations.transmitBatch);
  const cancelBatch = useMutation(api.delivery.mutations.cancelBatch);

  const {
    download: downloadPDF,
    isGenerating: isPDFGenerating,
    isReady: isPDFReady,
  } = useDeliveryBatchPDF({ batchId });

  // ── Handlers ──

  const handleTransmit = async () => {
    try {
      await transmitBatch({ batchId });
      toast.success("Lot transmis à l'administration");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la transmission",
      );
    }
  };

  const handleCancel = async () => {
    try {
      await cancelBatch({ batchId });
      toast.success("Lot annulé");
      router.push("/vendor/delivery");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'annulation",
      );
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadPDF();
      toast.success("PDF téléchargé");
    } catch {
      toast.error("Erreur lors du téléchargement");
    }
  };

  // ── Loading ──

  if (batchDetail === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // ── Not found ──

  if (batchDetail === null) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/vendor/delivery">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Retour aux livraisons
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg">Lot introuvable</h3>
            <p className="text-sm text-muted-foreground">
              Ce lot n'existe pas ou ne vous appartient pas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Data ──

  const validOrders = batchDetail.orders.filter(
    (o): o is NonNullable<typeof o> => o !== null,
  );

  const codOrders = validOrders.filter((o) => o.payment_mode === "cod");
  const paidOrders = validOrders.filter((o) => o.payment_mode === "online");
  const totalToCollect = codOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const canTransmit = batchDetail.status === "pending";
  const canCancel = batchDetail.status === "pending";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vendor/delivery">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-mono">
                {batchDetail.batch_number}
              </h1>
              <BatchStatusBadge status={batchDetail.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Créé le{" "}
              {new Date(batchDetail._creationTime).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {/* PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isPDFGenerating || !isPDFReady}
          >
            {isPDFGenerating ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-1.5" />
            )}
            Télécharger PDF
          </Button>

          {/* Transmettre */}
          {canTransmit && (
            <Button size="sm" onClick={handleTransmit}>
              <Send className="h-4 w-4 mr-1.5" />
              Transmettre à l'admin
            </Button>
          )}

          {/* Annuler */}
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Annuler le lot
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Annuler ce lot ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Les {validOrders.length} commandes seront retirées du lot et
                    reviendront dans la liste des commandes prêtes. Cette action
                    est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Non, garder le lot</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Oui, annuler
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{validOrders.length}</p>
            <p className="text-xs text-muted-foreground">
              {batchDetail.zone_name ?? "Zones diverses"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Frais de livraison
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrice(
                batchDetail.total_delivery_fee,
                batchDetail.currency,
              )}
            </p>
            <p className="text-xs text-muted-foreground">Total des frais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Déjà payées</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {paidOrders.length}
            </p>
            <p className="text-xs text-muted-foreground">Paiement en ligne</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">À collecter</CardTitle>
            <Banknote className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {formatPrice(totalToCollect, batchDetail.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {codOrders.length} commande{codOrders.length > 1 ? "s" : ""} COD
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Timeline (si transmis) */}
      {batchDetail.status !== "pending" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>
                  Créé le{" "}
                  {new Date(batchDetail._creationTime).toLocaleDateString(
                    "fr-FR",
                  )}
                </span>
              </div>
              {batchDetail.transmitted_at && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-blue-500" />
                    <span>
                      Transmis le{" "}
                      {new Date(batchDetail.transmitted_at).toLocaleDateString(
                        "fr-FR",
                      )}
                    </span>
                  </div>
                </>
              )}
              {batchDetail.assigned_at && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-purple-500" />
                    <span>
                      Assigné le{" "}
                      {new Date(batchDetail.assigned_at).toLocaleDateString(
                        "fr-FR",
                      )}
                    </span>
                  </div>
                </>
              )}
              {batchDetail.completed_at && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>
                      Terminé le{" "}
                      {new Date(batchDetail.completed_at).toLocaleDateString(
                        "fr-FR",
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Commandes ({validOrders.length})</span>
            {codOrders.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              >
                <Banknote className="h-3 w-3 mr-1" />
                {codOrders.length} à collecter
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {validOrders.map((order, index) => (
            <div
              key={order._id}
              className={`p-4 rounded-lg border ${
                order.payment_mode === "cod"
                  ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
                  : "border-border"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Left: Order info */}
                <div className="space-y-3 flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      #{index + 1}
                    </span>
                    <Link
                      href={`/vendor/orders/${order._id}`}
                      className="font-mono font-medium hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {order.order_number}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <div className="flex items-center gap-2">
                      {order.delivery_type && (
                        <DeliveryTypeBadge type={order.delivery_type} />
                      )}
                      {order.payment_mode && (
                        <PaymentModeBadge mode={order.payment_mode} />
                      )}
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="font-medium text-foreground">
                        {order.customer_name}
                      </span>
                    </div>
                    {order.customer_phone && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="hover:text-primary"
                        >
                          {order.customer_phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p>{order.shipping_address.line1}</p>
                      <p className="font-medium text-foreground">
                        {order.shipping_address.city}
                      </p>
                    </div>
                  </div>

                  {/* Items count */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>
                      {order.items.reduce((sum, i) => sum + i.quantity, 0)}{" "}
                      article
                      {order.items.reduce((sum, i) => sum + i.quantity, 0) > 1
                        ? "s"
                        : ""}
                    </span>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <p className="text-xs text-muted-foreground italic bg-muted/50 rounded p-2">
                      Note: {order.notes}
                    </p>
                  )}
                </div>

                {/* Right: Amount */}
                <div className="text-right sm:min-w-[140px]">
                  {order.payment_mode === "cod" ? (
                    <div className="inline-block bg-amber-100 dark:bg-amber-900/50 rounded-lg px-4 py-2">
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        À COLLECTER
                      </p>
                      <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                        {formatPrice(order.total_amount, order.currency)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 mb-1"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Payé
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(order.total_amount, order.currency)}
                      </p>
                    </div>
                  )}
                  {order.delivery_fee && order.delivery_fee > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Livraison:{" "}
                      {formatPrice(order.delivery_fee, order.currency)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Footer Totals */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Frais de livraison total
              </span>
              <span className="font-medium">
                {formatPrice(
                  batchDetail.total_delivery_fee,
                  batchDetail.currency,
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Commandes payées</span>
              <span className="font-medium text-green-600">
                {paidOrders.length} commande{paidOrders.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Commandes COD</span>
              <span className="font-medium">
                {codOrders.length} commande{codOrders.length > 1 ? "s" : ""}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Total à collecter (COD)</span>
              <span className="text-xl font-bold text-amber-700 dark:text-amber-400">
                {formatPrice(totalToCollect, batchDetail.currency)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
