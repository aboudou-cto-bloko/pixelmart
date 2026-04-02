// filepath: src/components/orders/organisms/OrderDetailPanel.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "../atoms/OrderStatusBadge";
import { TrackingLink } from "../atoms/TrackingLink";
import { OrderTimeline } from "../molecules/OrderTimeline";
import { TrackingForm } from "../molecules/TrackingForm";
import { OrderStatusActions } from "../molecules/OrderStatusActions";
import { OrderSummaryCard } from "../molecules/OrderSummaryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/format";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

interface OrderItem {
  product_id: string;
  variant_id?: string;
  variant_title?: string;
  title: string;
  sku?: string;
  image_url: string;
  resolved_image_url: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderDetail {
  _id: Id<"orders">;
  order_number: string;
  status: Doc<"orders">["status"];
  payment_status: string;
  source?: "marketplace" | "vendor_shop";
  items: OrderItem[];
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  commission_amount?: number;
  coupon_code?: string;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery?: number;
  delivered_at?: number;
  payment_mode?: "online" | "cod";
  delivery_type?: "standard" | "urgent" | "fragile";
  delivery_fee?: number;
  delivery_distance_km?: number;
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
  customer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  } | null;
  _creationTime: number;
}
interface OrderDetailPanelProps {
  order: OrderDetail | null | undefined;
}

export function OrderDetailPanel({ order }: OrderDetailPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showTrackingForm, setShowTrackingForm] = useState(false);

  const updateStatus = useMutation(api.orders.mutations.updateStatus);
  const addTracking = useMutation(api.orders.mutations.addTracking);

  if (order === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <p className="text-sm text-muted-foreground">Commande introuvable.</p>
    );
  }

  const handleStatusChange = async (
    status: "processing" | "shipped" | "delivered",
  ) => {
    setIsLoading(true);
    try {
      await updateStatus({ orderId: order._id, status });
      toast.success("Statut mis à jour");
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTracking = async (data: {
    trackingNumber: string;
    carrier?: string;
    estimatedDelivery?: number;
  }) => {
    setIsLoading(true);
    try {
      await addTracking({ orderId: order._id, ...data });
      toast.success("Suivi mis à jour");
      setShowTrackingForm(false);
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipWithTracking = () => {
    setShowTrackingForm(true);
  };

  const addr = order.shipping_address;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight font-mono">
            {order.order_number}
          </h2>
          <p className="text-xs text-muted-foreground">
            {new Date(order._creationTime).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <OrderStatusBadge status={order.status} />
          {order.payment_status === "failed" && (
            <Badge className="bg-red-100 text-red-700 border-red-300">
              Paiement échoué
            </Badge>
          )}
          {order.payment_mode === "cod" && (
            <Badge variant="outline" className="text-xs">
              Paiement à la livraison
            </Badge>
          )}
          {order.source && (
            <Badge variant="outline" className="text-xs">
              {order.source === "marketplace" ? "Marketplace" : "Boutique"}
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <OrderStatusActions
        status={order.status}
        onProcess={() => handleStatusChange("processing")}
        onShip={handleShipWithTracking}
        onDeliver={() => handleStatusChange("delivered")}
        isLoading={isLoading}
      />

      {/* Tracking form (affiché quand on clique "Marquer comme expédié") */}
      {showTrackingForm && (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-sm font-medium">Informations de suivi</h3>
          <TrackingForm
            currentTrackingNumber={order.tracking_number}
            currentCarrier={order.carrier}
            onSubmit={async (data) => {
              // Si en processing, on passe à shipped + tracking
              if (order.status === "processing") {
                setIsLoading(true);
                try {
                  await updateStatus({
                    orderId: order._id,
                    status: "shipped",
                    trackingNumber: data.trackingNumber,
                    carrier: data.carrier,
                    estimatedDelivery: data.estimatedDelivery,
                  });
                  toast.success("Commande expédiée");
                  setShowTrackingForm(false);
                } catch (err) {
                  toast.error("Erreur", {
                    description: err instanceof Error ? err.message : "Erreur",
                  });
                } finally {
                  setIsLoading(false);
                }
              } else {
                await handleAddTracking(data);
              }
            }}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Tracking info (si déjà renseigné) */}
      {order.tracking_number && !showTrackingForm && (
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Suivi du colis</h3>
            {(order.status === "processing" || order.status === "shipped") && (
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => setShowTrackingForm(true)}
              >
                Modifier
              </button>
            )}
          </div>
          <TrackingLink
            trackingNumber={order.tracking_number}
            carrier={order.carrier}
          />
          {order.estimated_delivery && (
            <p className="text-xs text-muted-foreground">
              Livraison estimée :{" "}
              {new Date(order.estimated_delivery).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
              })}
            </p>
          )}
        </div>
      )}

      <Separator />

      {/* Articles */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Articles ({order.items.length})</h3>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.resolved_image_url ? (
                <Image
                  src={item.resolved_image_url}
                  alt={item.title}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-md object-cover bg-muted shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-md bg-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-1">{item.title}</p>
                {item.variant_title && (
                  <p className="text-xs text-muted-foreground font-medium">
                    {item.variant_title}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {item.quantity} ×{" "}
                  {formatPrice(item.unit_price, order.currency)}
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {formatPrice(item.total_price, order.currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Summary */}
      <OrderSummaryCard
        subtotal={order.subtotal}
        shippingAmount={order.shipping_amount}
        discountAmount={order.discount_amount}
        totalAmount={order.total_amount}
        commissionAmount={order.commission_amount}
        currency={order.currency}
        couponCode={order.coupon_code}
      />

      <Separator />

      {/* Infos livraison */}
      {(order.delivery_type || order.delivery_distance_km || order.payment_mode === "cod") && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Livraison</h3>
          <div className="rounded-lg border p-3 text-sm space-y-1.5">
            {order.delivery_type && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">
                  {{ standard: "Standard", urgent: "Urgent", fragile: "Fragile" }[order.delivery_type]}
                </span>
              </div>
            )}
            {order.delivery_distance_km !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance</span>
                <span>{order.delivery_distance_km.toFixed(1)} km</span>
              </div>
            )}
            {order.delivery_fee !== undefined && order.delivery_fee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frais de livraison</span>
                <span>{formatPrice(order.delivery_fee, order.currency)}</span>
              </div>
            )}
            {order.payment_mode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode de paiement</span>
                <span>{order.payment_mode === "cod" ? "À la livraison" : "En ligne"}</span>
              </div>
            )}
            {order.delivery_lat !== undefined && order.delivery_lon !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Localisation GPS</span>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${order.delivery_lat}&mlon=${order.delivery_lon}&zoom=16`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 text-xs"
                >
                  <MapPin className="size-3" />
                  Voir sur la carte
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Client info */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Client</h3>
        {order.customer ? (
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-sm font-medium">{order.customer.name}</p>
            <div className="space-y-1.5">
              <a
                href={`mailto:${order.customer.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{order.customer.email}</span>
              </a>
              {order.customer.phone && (
                <a
                  href={`tel:${order.customer.phone}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="size-3.5 shrink-0" />
                  <span>{order.customer.phone}</span>
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Client introuvable</p>
        )}
      </div>

      {/* Adresse livraison */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Adresse de livraison</h3>
        <div className="rounded-lg border p-3 text-sm text-muted-foreground leading-relaxed">
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
              className="flex items-center gap-1 mt-1 text-foreground hover:text-primary transition-colors"
            >
              <Phone className="size-3.5" />
              {addr.phone}
            </a>
          )}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Note du client</h3>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </div>
        </>
      )}

      <Separator />

      {/* Timeline */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Historique</h3>
        <OrderTimeline orderId={order._id} />
      </div>
    </div>
  );
}
