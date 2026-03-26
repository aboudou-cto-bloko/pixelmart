// filepath: src/components/checkout/DeliveryFeePreview.tsx

"use client";

import { useMemo } from "react";
import type { DeliveryType } from "@/constants/deliveryTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Clock, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/format";

// ─── Copie locale du calcul (pour preview instantané côté client) ───

const URGENT_FRAGILE_RATES = {
  tier1: { maxKm: 5, fixedPrice: 700 },
  tier2: { minKm: 6, maxKm: 10, pricePerKm: 200 },
  tier3: { minKm: 11, pricePerKm: 150 },
} as const;

const STANDARD_RATES = {
  tier1: { maxKm: 5, fixedPrice: 600 },
  tier2: { minKm: 6, pricePerKm: 170 },
} as const;

const NIGHT_RATES = {
  startHour: 21,
  endHour: 6,
  pricePerKm: 250,
} as const;

const WEIGHT_SURCHARGE = {
  thresholdKg: 20,
  pricePerKg: 50,
} as const;

function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= NIGHT_RATES.startHour || hour < NIGHT_RATES.endHour;
}

function calculateDeliveryFeeClient(
  distanceKm: number,
  deliveryType: DeliveryType,
  weightKg: number = 0,
): number {
  const distance = Math.ceil(distanceKm);
  const nightRate = isNightTime();

  let baseFee: number;

  if (nightRate) {
    baseFee = distance * NIGHT_RATES.pricePerKm;
  } else if (deliveryType === "urgent" || deliveryType === "fragile") {
    if (distance <= URGENT_FRAGILE_RATES.tier1.maxKm) {
      baseFee = URGENT_FRAGILE_RATES.tier1.fixedPrice;
    } else if (distance <= URGENT_FRAGILE_RATES.tier2.maxKm) {
      baseFee = distance * URGENT_FRAGILE_RATES.tier2.pricePerKm;
    } else {
      baseFee = distance * URGENT_FRAGILE_RATES.tier3.pricePerKm;
    }
  } else {
    if (distance <= STANDARD_RATES.tier1.maxKm) {
      baseFee = STANDARD_RATES.tier1.fixedPrice;
    } else {
      baseFee = distance * STANDARD_RATES.tier2.pricePerKm;
    }
  }

  let weightSurcharge = 0;
  if (weightKg > WEIGHT_SURCHARGE.thresholdKg) {
    const extraKg = weightKg - WEIGHT_SURCHARGE.thresholdKg;
    weightSurcharge = extraKg * WEIGHT_SURCHARGE.pricePerKg;
  }

  return Math.round(baseFee + weightSurcharge);
}

// ─── Component ───────────────────────────────────────────────

interface DeliveryFeePreviewProps {
  zoneName?: string;
  distanceKm?: number;
  deliveryType: DeliveryType;
  weightKg?: number;
}

export function DeliveryFeePreview({
  zoneName,
  distanceKm,
  deliveryType,
  weightKg = 0,
}: DeliveryFeePreviewProps) {
  const fee = useMemo(() => {
    if (!distanceKm) return null;
    return calculateDeliveryFeeClient(distanceKm, deliveryType, weightKg);
  }, [distanceKm, deliveryType, weightKg]);

  const isNight = isNightTime();

  if (!zoneName || !distanceKm) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 p-4">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sélectionnez une zone pour voir les frais de livraison
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Livraison vers {zoneName}</p>
              <p className="text-sm text-muted-foreground">
                Distance estimée : ~{distanceKm} km
              </p>
              {isNight && (
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                  <Clock className="h-3 w-3" />
                  <span>Tarification de nuit appliquée (21h-06h)</span>
                </div>
              )}
              {weightKg > WEIGHT_SURCHARGE.thresholdKg && (
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>
                    Supplément poids : +
                    {weightKg - WEIGHT_SURCHARGE.thresholdKg} kg
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">
              {fee !== null ? formatPrice(fee, "XOF") : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Frais de livraison</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
