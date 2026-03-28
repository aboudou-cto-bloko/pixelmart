// filepath: src/components/checkout/DeliveryDistanceCalculator.tsx

"use client";

import { useMemo, useState, useEffect } from "react";
import type { GeocodingResult, Coordinates } from "@/lib/geocoding";
import {
  calculateDeliveryDistance,
  DEFAULT_COLLECTION_POINT,
} from "@/lib/geocoding";
import type { DeliveryType } from "@/constants/deliveryTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, MapPin, Clock, AlertCircle, Navigation } from "lucide-react";
import { formatPrice } from "@/lib/format";

// ─── Calcul des frais (mirror du backend) ────────────────────

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

function checkIsNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= NIGHT_RATES.startHour || hour < NIGHT_RATES.endHour;
}

function calculateDeliveryFee(
  distanceKm: number,
  deliveryType: DeliveryType,
  weightKg: number = 0,
): number {
  const distance = Math.ceil(distanceKm);
  const nightRate = checkIsNightTime();

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
    weightSurcharge =
      (weightKg - WEIGHT_SURCHARGE.thresholdKg) * WEIGHT_SURCHARGE.pricePerKg;
  }

  return Math.round(baseFee + weightSurcharge);
}

// ─── Component ───────────────────────────────────────────────

interface DeliveryDistanceCalculatorProps {
  selectedAddress: GeocodingResult | null;
  deliveryType: DeliveryType;
  weightKg?: number;
  collectionPoint?: Coordinates;
  onDistanceCalculated?: (distanceKm: number, fee: number) => void;
}

export function DeliveryDistanceCalculator({
  selectedAddress,
  deliveryType,
  weightKg = 0,
  collectionPoint = DEFAULT_COLLECTION_POINT,
  onDistanceCalculated,
}: DeliveryDistanceCalculatorProps) {
  const calculation = useMemo(() => {
    if (!selectedAddress) return null;

    const distanceKm = calculateDeliveryDistance(
      { lat: selectedAddress.lat, lon: selectedAddress.lon },
      collectionPoint,
    );

    const fee = calculateDeliveryFee(distanceKm, deliveryType, weightKg);

    // Callback pour informer le parent
    onDistanceCalculated?.(distanceKm, fee);

    return { distanceKm, fee };
  }, [
    selectedAddress,
    deliveryType,
    weightKg,
    collectionPoint,
    onDistanceCalculated,
  ]);

  // Computed client-side only to avoid SSR/client mismatch on time-of-day
  const [isNight, setIsNight] = useState(false);
  useEffect(() => { setIsNight(checkIsNightTime()); }, []);

  if (!selectedAddress) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 p-4">
          <Navigation className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sélectionnez une adresse pour calculer les frais de livraison
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!calculation) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Livraison calculée</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{selectedAddress.city ?? "Adresse sélectionnée"}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Distance : ~{calculation.distanceKm.toFixed(1)} km
              </p>
              {isNight && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <Clock className="h-3 w-3" />
                  <span>Tarification de nuit (21h-06h)</span>
                </div>
              )}
              {weightKg > WEIGHT_SURCHARGE.thresholdKg && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
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
              {formatPrice(calculation.fee, "XOF")}
            </p>
            <p className="text-xs text-muted-foreground">Frais de livraison</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
