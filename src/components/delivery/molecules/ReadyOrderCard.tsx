// filepath: src/components/delivery/molecules/ReadyOrderCard.tsx

"use client";

import type { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DeliveryTypeBadge } from "../atoms/DeliveryTypeBadge";
import { PaymentModeBadge } from "../atoms/PaymentModeBadge";
import { formatPrice } from "@/lib/format";
import { MapPin, Phone, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeliveryType, PaymentMode } from "@/constants/deliveryTypes";

interface ReadyOrderCardProps {
  order: {
    _id: Id<"orders">;
    order_number: string;
    customer_name: string;
    customer_phone?: string;
    zone_name: string;
    delivery_type?: DeliveryType;
    payment_mode?: PaymentMode;
    delivery_fee?: number;
    total_amount: number;
    currency: string;
    items: { title: string; quantity: number }[];
    shipping_address: {
      line1: string;
      city: string;
    };
  };
  selected: boolean;
  onSelect: (orderId: Id<"orders">, selected: boolean) => void;
}

export function ReadyOrderCard({
  order,
  selected,
  onSelect,
}: ReadyOrderCardProps) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card
      className={cn(
        "transition-all cursor-pointer",
        selected && "ring-2 ring-primary",
      )}
      onClick={() => onSelect(order._id, !selected)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect(order._id, checked === true)}
            className="mt-1"
          />

          {/* Content */}
          <div className="flex-1 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-medium">
                {order.order_number}
              </span>
              <div className="flex items-center gap-2">
                {order.delivery_type && (
                  <DeliveryTypeBadge type={order.delivery_type} />
                )}
                {order.payment_mode && (
                  <PaymentModeBadge mode={order.payment_mode} />
                )}
              </div>
            </div>

            {/* Client */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>{order.customer_name}</span>
              </div>
              {order.customer_phone && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{order.customer_phone}</span>
                </div>
              )}
            </div>

            {/* Adresse */}
            <div className="flex items-start gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                {order.shipping_address.line1}, {order.shipping_address.city}
                <span className="ml-2 font-medium text-foreground">
                  ({order.zone_name})
                </span>
              </span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                <span>
                  {itemCount} article{itemCount > 1 ? "s" : ""}
                </span>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatPrice(order.total_amount, order.currency)}
                </p>
                {order.delivery_fee && (
                  <p className="text-xs text-muted-foreground">
                    Livraison :{" "}
                    {formatPrice(order.delivery_fee, order.currency)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
