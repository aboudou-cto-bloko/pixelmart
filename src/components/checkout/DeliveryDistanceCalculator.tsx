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
import { useDeliveryRates } from "@/hooks/useDeliveryRates";

// Seuil poids affiché dans les messages (fallback local)
const WEIGHT_THRESHOLD_KG = 20;

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
  const { computeFee } = useDeliveryRates();

  const calculation = useMemo(() => {
    if (!selectedAddress) return null;

    const distanceKm = calculateDeliveryDistance(
      { lat: selectedAddress.lat, lon: selectedAddress.lon },
      collectionPoint,
    );

    const fee = computeFee(distanceKm, deliveryType, weightKg);

    return { distanceKm, fee };
  }, [selectedAddress, deliveryType, weightKg, collectionPoint, computeFee]);

  // Call the callback in useEffect to avoid state updates during render
  useEffect(() => {
    if (calculation && onDistanceCalculated) {
      onDistanceCalculated(calculation.distanceKm, calculation.fee);
    }
  }, [calculation, onDistanceCalculated]);

  // isNight évalué côté client uniquement pour éviter le mismatch SSR
  const [isNight] = useState(() => {
    // Initialize directly to avoid useState in effect
    if (typeof window === "undefined") return false;
    const h = new Date().getHours();
    return h >= 21 || h < 6;
  });

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
              {weightKg > WEIGHT_THRESHOLD_KG && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>
                    Supplément poids : +{weightKg - WEIGHT_THRESHOLD_KG} kg
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
