// filepath: src/components/checkout/DeliverySection.tsx

"use client";

import { useState, useEffect } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import type { DeliveryType, PaymentMode } from "@/constants/deliveryTypes";
import { DeliveryZoneSelector } from "./DeliveryZoneSelector";
import { DeliveryTypeSelector } from "./DeliveryTypeSelector";
import { PaymentModeSelector } from "./PaymentModeSelector";
import { DeliveryFeePreview } from "./DeliveryFeePreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Truck } from "lucide-react";

export interface DeliveryConfig {
  zoneId?: Id<"delivery_zones">;
  zoneName?: string;
  distanceKm?: number;
  deliveryType: DeliveryType;
  paymentMode: PaymentMode;
  estimatedWeightKg?: number;
}

interface DeliverySectionProps {
  city?: string;
  estimatedWeightKg?: number;
  codEnabled?: boolean;
  value: DeliveryConfig;
  onChange: (config: DeliveryConfig) => void;
}

export function DeliverySection({
  city,
  estimatedWeightKg,
  codEnabled = true,
  value,
  onChange,
}: DeliverySectionProps) {
  const handleZoneChange = (
    zoneId: Id<"delivery_zones">,
    zoneName: string,
    distanceKm: number,
  ) => {
    onChange({
      ...value,
      zoneId,
      zoneName,
      distanceKm,
    });
  };

  const handleTypeChange = (deliveryType: DeliveryType) => {
    onChange({ ...value, deliveryType });
  };

  const handlePaymentModeChange = (paymentMode: PaymentMode) => {
    onChange({ ...value, paymentMode });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Options de livraison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zone de livraison */}
        <DeliveryZoneSelector
          value={value.zoneId}
          onChange={handleZoneChange}
          city={city}
        />

        <Separator />

        {/* Type de livraison */}
        <DeliveryTypeSelector
          value={value.deliveryType}
          onChange={handleTypeChange}
        />

        <Separator />

        {/* Mode de paiement */}
        <PaymentModeSelector
          value={value.paymentMode}
          onChange={handlePaymentModeChange}
          codDisabled={!codEnabled}
        />

        <Separator />

        {/* Aperçu des frais */}
        <DeliveryFeePreview
          zoneName={value.zoneName}
          distanceKm={value.distanceKm}
          deliveryType={value.deliveryType}
          weightKg={estimatedWeightKg}
        />
      </CardContent>
    </Card>
  );
}
