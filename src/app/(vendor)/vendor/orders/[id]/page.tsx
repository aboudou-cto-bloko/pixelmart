// filepath: src/app/(vendor)/vendor/orders/[id]/page.tsx

"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  Package,
  User,
  MapPin,
  CreditCard,
  Clock,
  Truck,
  CheckCircle2,
  Circle,
  AlertCircle,
  Copy,
  Check,
  Mail,
} from "lucide-react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatPrice } from "@/lib/utils";
import {
  getOrderStatusConfig,
  getPaymentStatusConfig,
  getOrderTimeline,
  formatOrderDate,
} from "@/lib/order-helpers";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default function VendorOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const order = useQuery(api.orders.queries.getById, {
    orderId: id as Id<"orders">,
  });

  const updateStatus = useMutation(api.orders.mutations.updateStatus);
  const cancelOrder = useMutation(api.orders.mutations.cancelOrder);

  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Loading ──
  if (order === undefined) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="py-16 text-center">
        <Package className="size-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Commande introuvable</h1>
        <Button asChild>
          <Link href="/vendor/orders">Retour aux commandes</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = getOrderStatusConfig(order.status);
  const paymentConfig = getPaymentStatusConfig(order.payment_status);
  const timeline = getOrderTimeline(order.status);

  // ── Actions disponibles ──
  const canConfirm = order.status === "paid";
  const canShip = order.status === "processing";
  const canMarkDelivered = order.status === "shipped";
  const canCancel = order.status === "processing";

  async function handleStatusUpdate(
    newStatus: "processing" | "shipped" | "delivered",
  ) {
    setIsUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      await updateStatus({
        orderId: order!._id,
        status: newStatus,
        trackingNumber:
          newStatus === "shipped"
            ? trackingNumber.trim() || undefined
            : undefined,
        carrier:
          newStatus === "shipped" ? carrier.trim() || undefined : undefined,
      });
      setSuccess(
        newStatus === "processing"
          ? "Commande confirmée — en préparation"
          : newStatus === "shipped"
            ? "Commande marquée comme expédiée"
            : "Commande marquée comme livrée",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de mise à jour");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleCancel() {
    setIsCancelling(true);
    setError(null);
    setSuccess(null);
    try {
      await cancelOrder({
        orderId: order!._id,
        reason: "Annulée par le vendeur",
      });
      setSuccess("Commande annulée");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'annulation");
    } finally {
      setIsCancelling(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(order!.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendor/orders">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{order.order_number}</h1>
            <button
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <Check className="size-4 text-green-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatOrderDate(order._creationTime)}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={`${statusConfig.color} ${statusConfig.bgColor}`}
        >
          {statusConfig.label}
        </Badge>
      </div>

      {/* Feedback messages */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-md border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10 p-3">
          <CheckCircle2 className="size-4 text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-400">
            {success}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Suivi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-0">
                {timeline.map((step, i) => (
                  <div
                    key={step.label}
                    className="flex items-center flex-1 last:flex-none"
                  >
                    <div className="flex flex-col items-center">
                      {step.status === "done" ? (
                        <CheckCircle2 className="size-5 text-green-500" />
                      ) : step.status === "active" ? (
                        <div className="size-5 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center">
                          <div className="size-2 rounded-full bg-primary" />
                        </div>
                      ) : (
                        <Circle className="size-5 text-muted-foreground/30" />
                      )}
                      <span
                        className={`text-[10px] mt-1.5 text-center max-w-[80px] leading-tight ${
                          step.status === "upcoming"
                            ? "text-muted-foreground/40"
                            : step.status === "active"
                              ? "text-primary font-medium"
                              : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < timeline.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-1 mt-[-18px] ${
                          step.status === "done"
                            ? "bg-green-500"
                            : "bg-muted-foreground/15"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Articles commandés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="size-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.sku && (
                      <p className="text-xs text-muted-foreground">
                        SKU : {item.sku}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.unit_price, order.currency)} ×{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium shrink-0">
                    {formatPrice(item.total_price, order.currency)}
                  </p>
                </div>
              ))}

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{formatPrice(order.subtotal, order.currency)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Réduction
                      {order.coupon_code ? ` (${order.coupon_code})` : ""}
                    </span>
                    <span>
                      -{formatPrice(order.discount_amount, order.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>
                    {order.shipping_amount > 0
                      ? formatPrice(order.shipping_amount, order.currency)
                      : "Gratuite"}
                  </span>
                </div>
                {order.commission_amount != null &&
                  order.commission_amount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Commission Pixel-Mart</span>
                      <span>
                        -{formatPrice(order.commission_amount, order.currency)}
                      </span>
                    </div>
                  )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatPrice(order.total_amount, order.currency)}
                  </span>
                </div>
                {order.commission_amount != null && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Votre revenu net
                    </span>
                    <span className="font-medium text-green-600">
                      {formatPrice(
                        order.total_amount - order.commission_amount,
                        order.currency,
                      )}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping action — expédier */}
          {canShip && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="size-4" />
                  Expédier la commande
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="tracking" className="text-xs">
                      Numéro de suivi
                    </Label>
                    <Input
                      id="tracking"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="EX : LY123456789BJ"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carrier" className="text-xs">
                      Transporteur
                    </Label>
                    <Input
                      id="carrier"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      placeholder="La Poste, DHL, EMS…"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => handleStatusUpdate("shipped")}
                  disabled={isUpdating}
                  className="w-full sm:w-auto"
                >
                  {isUpdating ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Truck className="size-4 mr-2" />
                  )}
                  Marquer comme expédiée
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canConfirm && (
                <Button
                  onClick={() => handleStatusUpdate("processing")}
                  disabled={isUpdating}
                  className="w-full"
                >
                  {isUpdating ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4 mr-2" />
                  )}
                  Confirmer la commande
                </Button>
              )}

              {canMarkDelivered && (
                <Button
                  onClick={() => handleStatusUpdate("delivered")}
                  disabled={isUpdating}
                  className="w-full"
                  variant="outline"
                >
                  {isUpdating ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Package className="size-4 mr-2" />
                  )}
                  Marquer comme livrée
                </Button>
              )}

              {canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-destructive"
                    >
                      Annuler la commande
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Annuler cette commande ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Le client sera remboursé automatiquement. Le stock sera
                        restauré. Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Non, garder</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isCancelling ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Oui, annuler"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {!canConfirm && !canShip && !canMarkDelivered && !canCancel && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Aucune action disponible pour ce statut.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Client */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3" />
                {order.customer_email}
              </p>
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                Adresse de livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-0.5">
              <p className="font-medium">{order.shipping_address.full_name}</p>
              <p className="text-muted-foreground">
                {order.shipping_address.line1}
              </p>
              {order.shipping_address.line2 && (
                <p className="text-muted-foreground">
                  {order.shipping_address.line2}
                </p>
              )}
              <p className="text-muted-foreground">
                {order.shipping_address.city}
                {order.shipping_address.state
                  ? `, ${order.shipping_address.state}`
                  : ""}
                {order.shipping_address.postal_code
                  ? ` ${order.shipping_address.postal_code}`
                  : ""}
              </p>
              <p className="text-muted-foreground">
                {order.shipping_address.country}
              </p>
              {order.shipping_address.phone && (
                <p className="text-muted-foreground pt-1">
                  {order.shipping_address.phone}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                Paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Méthode</span>
                <span>{order.payment_method ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${paymentConfig.color}`}
                >
                  {paymentConfig.label}
                </Badge>
              </div>
              {order.payment_reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Réf.</span>
                  <span className="text-xs font-mono truncate max-w-[140px]">
                    {order.payment_reference}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Note du client</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3" />
              Créée le {formatOrderDate(order._creationTime)}
            </div>
            {order.delivered_at && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3" />
                Livrée le {formatOrderDate(order.delivered_at)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
