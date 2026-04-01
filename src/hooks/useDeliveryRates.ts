// filepath: src/hooks/useDeliveryRates.ts

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "../../convex/_generated/api";
import type { DeliveryType } from "@/constants/deliveryTypes";

// ─── Constantes de fallback ───────────────────────────────────

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

type DbRate = {
  delivery_type: string;
  is_night_rate: boolean;
  distance_min_km: number;
  distance_max_km?: number;
  base_price: number;
  price_per_km?: number;
  weight_threshold_kg: number;
  weight_surcharge_per_kg: number;
};

function computeFeeFromDb(
  distanceKm: number,
  deliveryType: DeliveryType,
  weightKg: number,
  nightRate: boolean,
  dbRates: DbRate[],
): number | null {
  const candidates = dbRates.filter(
    (r) => r.delivery_type === deliveryType && r.is_night_rate === nightRate,
  );
  if (candidates.length === 0) return null;

  const tier = candidates
    .slice()
    .sort((a, b) => a.distance_min_km - b.distance_min_km)
    .find(
      (r) =>
        distanceKm >= r.distance_min_km &&
        (r.distance_max_km === undefined || distanceKm <= r.distance_max_km),
    );

  if (!tier) return null;

  const baseFee =
    tier.price_per_km !== undefined
      ? distanceKm * tier.price_per_km
      : tier.base_price;

  let weightSurcharge = 0;
  if (weightKg > tier.weight_threshold_kg) {
    weightSurcharge =
      (weightKg - tier.weight_threshold_kg) * tier.weight_surcharge_per_kg;
  }

  return Math.round(baseFee + weightSurcharge);
}

function computeFeeFromConstants(
  distanceKm: number,
  deliveryType: DeliveryType,
  weightKg: number,
  nightRate: boolean,
): number {
  const distance = Math.ceil(distanceKm);
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

/**
 * Hook qui expose `computeFee(distanceKm, type, weightKg)`.
 * Utilise les tarifs stockés en DB si disponibles, sinon les constantes locales.
 * `isLoaded` est false pendant le chargement initial des tarifs DB.
 */
export function useDeliveryRates() {
  const dbRates = useQuery(api.delivery.queries.getActiveRates);

  const computeFee = useMemo(
    () =>
      (
        distanceKm: number,
        deliveryType: DeliveryType,
        weightKg: number = 0,
      ): number => {
        const nightRate = isNightTime();
        const distance = Math.ceil(distanceKm);

        if (dbRates && dbRates.length > 0) {
          const fromDb = computeFeeFromDb(
            distance,
            deliveryType,
            weightKg,
            nightRate,
            dbRates,
          );
          if (fromDb !== null) return fromDb;
        }

        return computeFeeFromConstants(distance, deliveryType, weightKg, nightRate);
      },
    [dbRates],
  );

  return {
    computeFee,
    isLoaded: dbRates !== undefined,
  };
}
