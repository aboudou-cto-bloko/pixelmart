// filepath: src/components/admin/templates/AdminOrderDetailTemplate.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail, Phone, Store, User, MapPin, Package, Clock, Truck, CreditCard, CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDate, formatRelativeTime } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────────

type OrderStatus =
  | "pending" | "paid" | "processing" | "shipped" | "delivered"
  | "cancelled" | "refunded" | "ready_for_delivery" | "delivery_failed";

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

type DeliveryType = "standard" | "urgent" | "fragile";

interface AdminOrderDetail {
  _id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  source?: "marketplace" | "vendor_shop";
  items: Array<{
    title: string;
    variant_title?: string;
    sku?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    resolved_image_url: string | null;
  }>;
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  commission_amount?: number;
  currency: string;
  coupon_code?: string;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery?: number;
  delivered_at?: number;
  payment_mode?: "online" | "cod";
  delivery_type?: DeliveryType;
  delivery_fee?: number;
  delivery_distance_km?: number;
  delivery_distance_vendor_to_hub_km?: number;
  delivery_distance_hub_to_client_km?: number;
  delivery_lat?: number;
  delivery_lon?: number;
  shipping_address: {
    full_name: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code?: string;
    country: string;
    phone?: string;
  };
  notes?: string;
  store_name: string;
  store_slug: string | null;
  customer: {
    _id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    role: string;
    is_banned: boolean;
    _creationTime: number;
  } | null;
  _creationTime: number;
}

interface Props {
  order: AdminOrderDetail | null | undefined;
  onBack: () => void;
}

// ─── Timeline ─────────────────────────────────────────────────

type TimelineEvent = {
  _id: string;
  type: string;
  description: string;
  actorType: string;
  createdAt: number;
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  created:     <Circle className="size-3.5 text-muted-foreground" />,
  paid:        <CheckCircle2 className="size-3.5 text-green-500" />,
  processing:  <Clock className="size-3.5 text-violet-500" />,
  shipped:     <Truck className="size-3.5 text-cyan-500" />,
  delivered:   <CheckCircle2 className="size-3.5 text-green-600" />,
  cancelled:   <AlertTriangle className="size-3.5 text-red-500" />,
  refunded:    <AlertTriangle className="size-3.5 text-slate-500" />,
  note:        <Circle className="size-3.5 text-muted-foreground" />,
};

function OrderTimeline({ orderId }: { orderId: Id<"orders"> }) {
  const events = useQuery(api.orders.events.getTimeline, { orderId });

  if (!events) return null;
  if (events.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          Historique
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative border-l border-border ml-2 space-y-4">
          {events.map((event) => (
            <li key={event._id} className="pl-5 relative">
              <span className="absolute -left-[9px] top-0.5 flex items-center justify-center bg-background">
                {EVENT_ICONS[event.type] ?? EVENT_ICONS.note}
              </span>
              <p className="text-sm leading-snug">{event.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatRelativeTime(event.createdAt)}
                {event.actorType !== "system" && (
                  <span className="capitalize"> · {event.actorType}</span>
                )}
              </p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

// ─── Admin Status Actions ─────────────────────────────────────

const NEXT_STATUSES: Partial<Record<string, { status: string; label: string; variant: "default" | "outline" | "destructive" }[]>> = {
  paid:               [{ status: "processing", label: "Prendre en charge", variant: "default" }],
  processing:         [
    { status: "ready_for_delivery", label: "Prêt à livrer", variant: "outline" },
    { status: "shipped", label: "Expédier", variant: "default" },
  ],
  ready_for_delivery: [{ status: "shipped", label: "Expédier", variant: "default" }],
  shipped:            [
    { status: "delivered", label: "Marquer livré", variant: "default" },
    { status: "delivery_failed", label: "Échec livraison", variant: "destructive" },
  ],
  delivery_failed:    [{ status: "shipped", label: "Réexpédier", variant: "outline" }],
};

function AdminStatusActions({ orderId, currentStatus }: { orderId: Id<"orders">; currentStatus: string }) {
  const updateStatus = useMutation(api.admin.mutations.adminUpdateOrderStatus);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = NEXT_STATUSES[currentStatus];
  if (!actions || actions.length === 0) return null;

  async function handle(status: string) {
    setLoading(status);
    setError(null);
    try {
      await updateStatus({ orderId, status: status as Parameters<typeof updateStatus>[0]["status"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Truck className="size-4 text-muted-foreground" />
          Actions admin
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.status}
              size="sm"
              variant={action.variant}
              disabled={!!loading}
              onClick={() => handle(action.status)}
              className={action.variant === "destructive" ? "" : action.variant === "default" ? "bg-primary" : ""}
            >
              {loading === action.status ? "…" : action.label}
            </Button>
          ))}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Badge styles ─────────────────────────────────────────────

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending:            "bg-amber-100 text-amber-700 border-amber-300",
  paid:               "bg-blue-100 text-blue-700 border-blue-300",
  processing:         "bg-violet-100 text-violet-700 border-violet-300",
  shipped:            "bg-cyan-100 text-cyan-700 border-cyan-300",
  delivered:          "bg-green-100 text-green-700 border-green-300",
  cancelled:          "bg-red-100 text-red-700 border-red-300",
  refunded:           "bg-slate-100 text-slate-700 border-slate-300",
  ready_for_delivery: "bg-pink-100 text-pink-700 border-pink-300",
  delivery_failed:    "bg-rose-100 text-rose-700 border-rose-300",
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending:            "En attente",
  paid:               "Payée",
  processing:         "En préparation",
  shipped:            "Expédiée",
  delivered:          "Livrée",
  cancelled:          "Annulée",
  refunded:           "Remboursée",
  ready_for_delivery: "Prête à livrer",
  delivery_failed:    "Échec livraison",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pending:  "bg-amber-100 text-amber-700 border-amber-300",
  paid:     "bg-green-100 text-green-700 border-green-300",
  failed:   "bg-red-100 text-red-700 border-red-300",
  refunded: "bg-slate-100 text-slate-700 border-slate-300",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending:  "En attente",
  paid:     "Payé",
  failed:   "Échoué",
  refunded: "Remboursé",
};

const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  standard: "Standard",
  urgent:   "Urgent",
  fragile:  "Fragile",
};

const SOURCE_LABELS = {
  marketplace:  "Marketplace",
  vendor_shop:  "Boutique vendeur",
};

// ─── Template ────────────────────────────────────────────────

export function AdminOrderDetailTemplate({ order, onBack }: Props) {
  if (order === undefined) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Commande introuvable.</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          Retour aux commandes
        </Button>
      </div>
    );
  }

  const addr = order.shipping_address;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold font-mono tracking-tight">
              {order.order_number}
            </h1>
            <Badge className={ORDER_STATUS_STYLES[order.status]}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
            <Badge className={PAYMENT_STATUS_STYLES[order.payment_status]}>
              {PAYMENT_STATUS_LABELS[order.payment_status]}
            </Badge>
            {order.source && (
              <Badge variant="outline" className="text-xs">
                {SOURCE_LABELS[order.source]}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(order._creationTime)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — items + financials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Articles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="size-4 text-muted-foreground" />
                Articles ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {item.resolved_image_url ? (
                    <Image
                      src={item.resolved_image_url}
                      alt={item.title}
                      width={48}
                      height={48}
                      className="size-12 rounded-md object-cover bg-muted shrink-0"
                    />
                  ) : (
                    <div className="size-12 rounded-md bg-muted shrink-0 flex items-center justify-center">
                      <Package className="size-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                    {item.variant_title && (
                      <p className="text-xs text-muted-foreground font-medium">
                        {item.variant_title}
                      </p>
                    )}
                    {item.sku && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {item.sku}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {formatPrice(item.unit_price, order.currency)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    {formatPrice(item.total_price, order.currency)}
                  </span>
                </div>
              ))}

              <Separator />

              {/* Totals */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Sous-total</span>
                  <span>{formatPrice(order.subtotal, order.currency)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Réduction{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
                    <span>-{formatPrice(order.discount_amount, order.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Livraison</span>
                  <span>
                    {order.payment_mode === "cod"
                      ? "Paiement à la livraison"
                      : order.shipping_amount > 0
                        ? formatPrice(order.shipping_amount, order.currency)
                        : "Par la boutique"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.total_amount, order.currency)}</span>
                </div>
                {order.commission_amount !== undefined && (
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Commission Pixel-Mart</span>
                    <span>{formatPrice(order.commission_amount, order.currency)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery info */}
          {(order.delivery_type || order.delivery_distance_km || order.payment_mode || order.tracking_number) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="size-4 text-muted-foreground" />
                  Livraison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {order.delivery_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span>{DELIVERY_TYPE_LABELS[order.delivery_type]}</span>
                  </div>
                )}
                {order.payment_mode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paiement</span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="size-3.5" />
                      {order.payment_mode === "cod" ? "À la livraison" : "En ligne"}
                    </span>
                  </div>
                )}
                {order.delivery_fee !== undefined && order.delivery_fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais livraison</span>
                    <span>{formatPrice(order.delivery_fee, order.currency)}</span>
                  </div>
                )}
                {order.delivery_distance_km !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance</span>
                    <span>{order.delivery_distance_km.toFixed(1)} km</span>
                  </div>
                )}
                {order.delivery_distance_vendor_to_hub_km !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendeur → Hub</span>
                    <span>{order.delivery_distance_vendor_to_hub_km.toFixed(1)} km</span>
                  </div>
                )}
                {order.delivery_distance_hub_to_client_km !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hub → Client</span>
                    <span>{order.delivery_distance_hub_to_client_km.toFixed(1)} km</span>
                  </div>
                )}
                {order.delivery_lat !== undefined && order.delivery_lon !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coordonnées GPS</span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${order.delivery_lat}&mlon=${order.delivery_lon}&zoom=16`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <MapPin className="size-3.5" />
                      {order.delivery_lat.toFixed(4)}, {order.delivery_lon.toFixed(4)}
                    </a>
                  </div>
                )}
                {order.tracking_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Numéro de suivi</span>
                    <span className="font-mono text-xs">{order.tracking_number}</span>
                  </div>
                )}
                {order.carrier && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transporteur</span>
                    <span>{order.carrier}</span>
                  </div>
                )}
                {order.estimated_delivery && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livraison estimée</span>
                    <span>{formatDate(order.estimated_delivery)}</span>
                  </div>
                )}
                {order.delivered_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livré le</span>
                    <span>{formatDate(order.delivered_at)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — customer + address + store */}
        <div className="space-y-4">
          {/* Customer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  Client
                </span>
                {order.customer && (
                  <Link
                    href={`/admin/users/${order.customer._id}`}
                    className="text-xs text-primary hover:underline font-normal"
                  >
                    Voir le profil →
                  </Link>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.customer ? (
                <>
                  <div>
                    <p className="font-medium text-sm">{order.customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Client depuis {formatDate(order.customer._creationTime)}
                    </p>
                    {order.customer.is_banned && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        Banni
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <a
                      href={`mailto:${order.customer.email}`}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Mail className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{order.customer.email}</span>
                    </a>
                    {order.customer.phone && (
                      <a
                        href={`tel:${order.customer.phone}`}
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Phone className="size-3.5 text-muted-foreground shrink-0" />
                        <span>{order.customer.phone}</span>
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Client introuvable</p>
              )}
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
            <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-0.5">
              <p className="font-medium text-foreground">{addr.full_name}</p>
              <p>{addr.line1}</p>
              {addr.line2 && <p>{addr.line2}</p>}
              <p>
                {addr.city}
                {addr.state ? `, ${addr.state}` : ""}
                {addr.postal_code ? ` ${addr.postal_code}` : ""}
              </p>
              <p>{addr.country}</p>
              {addr.phone && (
                <a
                  href={`tel:${addr.phone}`}
                  className="flex items-center gap-1 pt-1 text-foreground hover:text-primary transition-colors"
                >
                  <Phone className="size-3.5" />
                  {addr.phone}
                </a>
              )}
            </CardContent>
          </Card>

          {/* Store */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Store className="size-4 text-muted-foreground" />
                Boutique
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{order.store_name}</p>
              {order.store_slug && (
                <Link
                  href={`/admin/stores`}
                  className="text-xs text-primary hover:underline"
                >
                  Voir dans les boutiques
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  Note du client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Admin status actions */}
          <AdminStatusActions
            orderId={order._id as Id<"orders">}
            currentStatus={order.status}
          />

          {/* Timeline */}
          <OrderTimeline orderId={order._id as Id<"orders">} />
        </div>
      </div>
    </div>
  );
}
