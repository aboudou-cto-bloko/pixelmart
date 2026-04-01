// filepath: src/components/checkout/DeliveryFeePreview.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import type { DeliveryType } from "@/constants/deliveryTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Clock, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useDeliveryRates } from "@/hooks/useDeliveryRates";

// Seuil poids affiché dans les messages (fallback local)
const WEIGHT_THRESHOLD_KG = 20;

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
  const { computeFee } = useDeliveryRates();

  // isNight évalué côté client uniquement pour éviter le mismatch SSR
  const [isNight, setIsNight] = useState(false);
  useEffect(() => {
    const h = new Date().getHours();
    setIsNight(h >= 21 || h < 6);
  }, []);

  const fee = useMemo(() => {
    if (!distanceKm) return null;
    return computeFee(distanceKm, deliveryType, weightKg);
  }, [distanceKm, deliveryType, weightKg, computeFee]);

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
              {weightKg > WEIGHT_THRESHOLD_KG && (
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
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
              {fee !== null ? formatPrice(fee, "XOF") : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Frais de livraison</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
