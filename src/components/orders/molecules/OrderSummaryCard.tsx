// filepath: src/components/orders/molecules/OrderSummaryCard.tsx

"use client";

import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";

interface OrderSummaryCardProps {
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  commissionAmount?: number;
  currency: string;
  couponCode?: string;
}

export function OrderSummaryCard({
  subtotal,
  shippingAmount,
  discountAmount,
  totalAmount,
  commissionAmount,
  currency,
  couponCode,
}: OrderSummaryCardProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Sous-total</span>
        <span>{formatPrice(subtotal, currency)}</span>
      </div>
      {shippingAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Livraison</span>
          <span>{formatPrice(shippingAmount, currency)}</span>
        </div>
      )}
      {discountAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Remise{couponCode ? ` (${couponCode})` : ""}
          </span>
          <span className="text-emerald-500">
            -{formatPrice(discountAmount, currency)}
          </span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between font-medium">
        <span>Total</span>
        <span>{formatPrice(totalAmount, currency)}</span>
      </div>
      {commissionAmount !== undefined && commissionAmount > 0 && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Commission Pixel-Mart</span>
          <span>-{formatPrice(commissionAmount, currency)}</span>
        </div>
      )}
    </div>
  );
}
