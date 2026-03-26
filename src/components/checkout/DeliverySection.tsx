// filepath: src/components/checkout/DeliverySection.tsx

"use client";

import { useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { GeocodingResult } from "@/lib/geocoding";
import type { DeliveryType, PaymentMode } from "@/constants/deliveryTypes";
import { FEATURES } from "@/constants/features";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { DeliveryTypeSelector } from "./DeliveryTypeSelector";
import { PaymentModeSelector } from "./PaymentModeSelector";
import { DeliveryDistanceCalculator } from "./DeliveryDistanceCalculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Truck } from "lucide-react";

const MapPicker = dynamic(
  () => import("./MapPicker").then((mod) => mod.MapPicker),
  { ssr: false },
);

// ─── Types ───────────────────────────────────────────────────

export interface DeliveryConfig {
  /** Coordonnées GPS de livraison */
  deliveryLat?: number;
  deliveryLon?: number;
  /** Adresse affichée (pour référence) */
  deliveryAddress?: string;
  deliveryCity?: string;
  /** Distance calculée en km */
  deliveryDistanceKm?: number;
  /** Frais calculés en centimes */
  deliveryFee?: number;
  /** Type de livraison */
  deliveryType: DeliveryType;
  /** Mode de paiement */
  paymentMode: PaymentMode;
  /** Poids estimé (optionnel) */
  estimatedWeightKg?: number;
}

interface DeliverySectionProps {
  /** Poids estimé des articles */
  estimatedWeightKg?: number;
  /** Configuration actuelle */
  value: DeliveryConfig;
  /** Callback de mise à jour */
  onChange: (config: DeliveryConfig) => void;
  /** Erreur sur l'adresse */
  addressError?: string;
}

// ─── Component ───────────────────────────────────────────────

export function DeliverySection({
  estimatedWeightKg = 0,
  value,
  onChange,
  addressError,
}: DeliverySectionProps) {
  // ── Forcer paymentMode à "online" si COD désactivé ──
  useEffect(() => {
    if (!FEATURES.COD_ENABLED && value.paymentMode === "cod") {
      onChange({ ...value, paymentMode: "online" });
    }
  }, [value, onChange]);

  // ── Handlers ──

  const handleAddressSelect = useCallback(
    (result: GeocodingResult) => {
      onChange({
        ...value,
        deliveryLat: result.lat,
        deliveryLon: result.lon,
        deliveryAddress: result.displayName,
        deliveryCity: result.city,
        // Reset distance/fee — sera recalculé par DeliveryDistanceCalculator
        deliveryDistanceKm: undefined,
        deliveryFee: undefined,
      });
    },
    [value, onChange],
  );

  const handleDistanceCalculated = useCallback(
    (distanceKm: number, fee: number) => {
      // Éviter les mises à jour inutiles
      if (
        value.deliveryDistanceKm === distanceKm &&
        value.deliveryFee === fee
      ) {
        return;
      }
      onChange({
        ...value,
        deliveryDistanceKm: distanceKm,
        deliveryFee: fee,
      });
    },
    [value, onChange],
  );

  const handleTypeChange = useCallback(
    (deliveryType: DeliveryType) => {
      onChange({
        ...value,
        deliveryType,
        // Reset fee — sera recalculé
        deliveryFee: undefined,
      });
    },
    [value, onChange],
  );

  const handlePaymentModeChange = useCallback(
    (paymentMode: PaymentMode) => {
      onChange({ ...value, paymentMode });
    },
    [value, onChange],
  );

  // ── Construire l'objet GeocodingResult pour le calculateur ──
  const selectedAddress: GeocodingResult | null =
    value.deliveryLat && value.deliveryLon
      ? {
          placeId: "selected",
          displayName: value.deliveryAddress ?? "",
          lat: value.deliveryLat,
          lon: value.deliveryLon,
          city: value.deliveryCity,
        }
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-5 w-5" />
          Options de livraison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 1. Adresse de livraison (Autocomplete OSM + carte) */}
        <div className="space-y-3">
          <AddressAutocomplete
            label="Adresse de livraison"
            placeholder="Tapez votre adresse à Cotonou…"
            countryCode="bj"
            value={value.deliveryAddress}
            onSelect={handleAddressSelect}
            error={addressError}
            required
          />
          <p className="text-xs text-muted-foreground">
            Recherchez votre adresse ou placez le marqueur directement sur la
            carte.
          </p>
          <MapPicker
            value={
              value.deliveryLat !== undefined && value.deliveryLon !== undefined
                ? { lat: value.deliveryLat, lon: value.deliveryLon }
                : undefined
            }
            onLocationSelect={handleAddressSelect}
          />
        </div>

        <Separator />

        {/* 2. Type de livraison */}
        <DeliveryTypeSelector
          value={value.deliveryType}
          onChange={handleTypeChange}
        />

        <Separator />

        {/* 3. Mode de paiement (conditionnel selon feature flag) */}
        <PaymentModeSelector
          value={value.paymentMode}
          onChange={handlePaymentModeChange}
          codDisabled={!FEATURES.COD_ENABLED}
        />

        <Separator />

        {/* 4. Calcul des frais (basé sur la distance GPS) */}
        <DeliveryDistanceCalculator
          selectedAddress={selectedAddress}
          deliveryType={value.deliveryType}
          weightKg={estimatedWeightKg}
          onDistanceCalculated={handleDistanceCalculated}
        />
      </CardContent>
    </Card>
  );
}
