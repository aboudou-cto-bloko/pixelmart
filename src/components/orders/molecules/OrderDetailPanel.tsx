// filepath: src/components/orders/organisms/OrderDetailPanel.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "../atoms/OrderStatusBadge";
import { TrackingLink } from "../atoms/TrackingLink";
import { OrderTimeline } from "../molecules/OrderTimeline";
import { TrackingForm } from "../molecules/TrackingForm";
import { OrderStatusActions } from "../molecules/OrderStatusActions";
import { OrderSummaryCard } from "../molecules/OrderSummaryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoiceDownload } from "@/hooks/useInvoiceDownload";
import { FileText } from "lucide-react";
import Image from "next/image";

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

interface OrderItem {
  product_id: string;
  variant_id?: string;
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
  status: OrderStatus;
  payment_status: string;
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

  const {
    download: downloadInvoice,
    isGenerating: isInvoiceGenerating,
    isReady: invoiceReady,
  } = useInvoiceDownload(order?._id);

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
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Actions */}
      <OrderStatusActions
        status={order.status}
        onProcess={() => handleStatusChange("processing")}
        onShip={handleShipWithTracking}
        onDeliver={() => handleStatusChange("delivered")}
        isLoading={isLoading}
      />

      {invoiceReady && (
        <Button
          variant="outline"
          size="sm"
          onClick={downloadInvoice}
          disabled={isInvoiceGenerating}
        >
          <FileText className="mr-1.5 h-3.5 w-3.5" />
          {isInvoiceGenerating ? "Génération..." : "Facture PDF"}
        </Button>
      )}

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
                  className="h-10 w-10 rounded-md object-cover bg-muted"
                />
              ) : (
                <div className="h-10 w-10 rounded-md bg-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} ×{" "}
                  {(item.unit_price / 100).toLocaleString("fr-FR")}{" "}
                  {order.currency}
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {(item.total_price / 100).toLocaleString("fr-FR")}{" "}
                {order.currency}
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

      {/* Client info */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Client</h3>
        {order.customer && (
          <div className="text-sm">
            <p>{order.customer.name}</p>
            <p className="text-muted-foreground">{order.customer.email}</p>
          </div>
        )}
      </div>

      {/* Adresse livraison */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Adresse de livraison</h3>
        <div className="text-sm text-muted-foreground leading-relaxed">
          <p>{addr.full_name}</p>
          <p>{addr.line1}</p>
          {addr.line2 && <p>{addr.line2}</p>}
          <p>
            {addr.city}
            {addr.state ? `, ${addr.state}` : ""}
            {addr.postal_code ? ` ${addr.postal_code}` : ""}
          </p>
          <p>{addr.country}</p>
          {addr.phone && <p>{addr.phone}</p>}
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
