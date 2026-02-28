// filepath: src/app/(storefront)/orders/[id]/page.tsx

"use client";

import { use } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  Package,
  Store,
  Truck,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { ROUTES } from "@/constants/routes";
import type { Id } from "../../../../../convex/_generated/dataModel";

function ReturnButton({ orderId }: { orderId: string }) {
  const eligibility = useQuery(api.returns.queries.checkEligibility, {
    orderId: orderId as Id<"orders">,
  });

  if (!eligibility?.eligible) return null;

  return (
    <Button variant="outline" asChild>
      <Link href={`/orders/${orderId}/return`}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Demander un retour
      </Link>
    </Button>
  );
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useCurrentUser();

  const order = useQuery(
    api.orders.queries.getById,
    isAuthenticated ? { orderId: id as Id<"orders"> } : "skip",
  );

  const cancelOrder = useMutation(api.orders.mutations.cancelOrder);
  const initializePayment = useAction(api.payments.moneroo.initializePayment);

  const [isCancelling, setIsCancelling] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Auth guard ──
  if (authLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-4">Connectez-vous</h1>
        <Button asChild>
          <Link href={`${ROUTES.LOGIN}?redirect=/orders/${id}`}>
            Se connecter
          </Link>
        </Button>
      </div>
    );
  }

  // ── Loading ──
  if (order === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  // ── Not found ──
  if (order === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Package className="size-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Commande introuvable</h1>
        <p className="text-muted-foreground mb-6">
          Cette commande n&apos;existe pas ou ne vous appartient pas.
        </p>
        <Button asChild>
          <Link href={ROUTES.CUSTOMER_ORDERS}>Mes commandes</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = getOrderStatusConfig(order.status);
  const paymentConfig = getPaymentStatusConfig(order.payment_status);
  const timeline = getOrderTimeline(order.status);

  const canCancel =
    order.status === "pending" ||
    (order.status === "paid" &&
      Date.now() - order._creationTime <= 2 * 60 * 60 * 1000);

  const canPay = order.status === "pending" && order.payment_status !== "paid";

  async function handleCancel() {
    setIsCancelling(true);
    setError(null);
    try {
      await cancelOrder({ orderId: order!._id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'annulation");
    } finally {
      setIsCancelling(false);
    }
  }

  async function handlePay() {
    setIsPaying(true);
    setError(null);
    try {
      const { checkoutUrl } = await initializePayment({
        orderId: order!._id,
      });
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de paiement");
      setIsPaying(false);
    }
  }

  function handleCopyOrderNumber() {
    navigator.clipboard.writeText(order!.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.CUSTOMER_ORDERS}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{order.order_number}</h1>
            <button
              onClick={handleCopyOrderNumber}
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

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 mb-6">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Suivi de commande</CardTitle>
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

        {/* Tracking */}
        {order.tracking_number && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Truck className="size-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Numéro de suivi</p>
                <p className="text-sm text-muted-foreground">
                  {order.carrier && `${order.carrier} — `}
                  {order.tracking_number}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Store className="size-4 text-muted-foreground" />
              <Link
                href={ROUTES.STORE(order.store_slug)}
                className="hover:text-primary transition-colors"
              >
                {order.store_name}
              </Link>
            </CardTitle>
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
          </CardContent>
        </Card>

        {/* Totals + Payment */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{formatPrice(order.subtotal, order.currency)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>
                  Réduction{order.coupon_code ? ` (${order.coupon_code})` : ""}
                </span>
                <span>
                  -{formatPrice(order.discount_amount, order.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Livraison</span>
              <span>
                {order.shipping_amount > 0
                  ? formatPrice(order.shipping_amount, order.currency)
                  : "Gratuite"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">
                {formatPrice(order.total_amount, order.currency)}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <CreditCard className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {order.payment_method ?? "Méthode non définie"}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] ml-auto ${paymentConfig.color}`}
              >
                {paymentConfig.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">
                  {order.shipping_address.full_name}
                </p>
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
                  <p className="text-muted-foreground mt-1">
                    {order.shipping_address.phone}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {order.notes && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Note</p>
              <p className="text-sm">{order.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {/* Bouton retour si commande livrée */}
          {order.status === "delivered" && <ReturnButton orderId={order._id} />}

          {canPay && (
            <Button onClick={handlePay} disabled={isPaying} className="flex-1">
              {isPaying ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Redirection…
                </>
              ) : (
                <>
                  <CreditCard className="size-4 mr-2" />
                  Payer maintenant
                </>
              )}
            </Button>
          )}

          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive">
                  Annuler la commande
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Annuler la commande ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Si la commande est déjà
                    payée, un remboursement sera initié automatiquement.
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
        </div>

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
  );
}
