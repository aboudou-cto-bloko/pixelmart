---
name: delivery-system
description: |
  Use when working with delivery features for Pixel-Mart. Triggers on: delivery, geocoding,
  address autocomplete, Nominatim, Haversine, distance calculation, delivery fees, or 
  shipping zones. Covers the OpenStreetMap/Nominatim integration for Benin.
allowed-tools: [Read, Write, Grep, Glob]
---

# Delivery System for Pixel-Mart

## Overview

Pixel-Mart uses a distance-based delivery system:
1. **Address Autocomplete**: OpenStreetMap Nominatim (free, no API key)
2. **Distance Calculation**: Haversine formula
3. **Fee Tiers**: Based on kilometers from store

## Nominatim API

### Rate Limits (CRITICAL)
- **1 request per second** maximum
- Must include `User-Agent` header
- Restricted to Benin: `countrycodes=bj`

### Search Endpoint

```typescript
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

async function searchAddress(query: string): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    countrycodes: "bj", // Benin only
    limit: "5",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      "User-Agent": "PixelMart/1.0 (contact@pixelmart.io)",
    },
  });

  return response.json();
}
```

## Address Autocomplete Hook

```typescript
// src/hooks/useAddressAutocomplete.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";

interface AddressSuggestion {
  placeId: number;
  displayName: string;
  lat: number;
  lon: number;
  shortAddress: string;
}

export function useAddressAutocomplete() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);

  // Debounced search - 500ms delay to respect rate limit
  const searchAddresses = useDebouncedCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        format: "json",
        addressdetails: "1",
        countrycodes: "bj",
        limit: "5",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            "User-Agent": "PixelMart/1.0",
          },
        }
      );

      const results = await response.json();

      setSuggestions(
        results.map((r: any) => ({
          placeId: r.place_id,
          displayName: r.display_name,
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
          shortAddress: formatShortAddress(r.address),
        }))
      );
    } catch (error) {
      console.error("Address search failed:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, 500);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSelectedAddress(null);
    searchAddresses(value);
  }, [searchAddresses]);

  const handleSelect = useCallback((suggestion: AddressSuggestion) => {
    setSelectedAddress(suggestion);
    setQuery(suggestion.shortAddress);
    setSuggestions([]);
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    setSelectedAddress(null);
    setSuggestions([]);
  }, []);

  return {
    query,
    setQuery: handleQueryChange,
    suggestions,
    isLoading,
    selectedAddress,
    selectAddress: handleSelect,
    clear,
  };
}

function formatShortAddress(address: any): string {
  const parts = [
    address.road,
    address.neighbourhood || address.suburb,
    address.city,
  ].filter(Boolean);
  return parts.join(", ");
}
```

## Haversine Distance Calculation

```typescript
// src/lib/distance.ts

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

// Cotonou center coordinates (for reference)
export const COTONOU_CENTER = {
  lat: 6.3654,
  lon: 2.4183,
};
```

## Delivery Fee Calculation

```typescript
// src/lib/delivery.ts

interface DeliveryTier {
  maxKm: number;
  feeCentimes: number;
}

const DELIVERY_TIERS: DeliveryTier[] = [
  { maxKm: 3, feeCentimes: 50000 },    // 500 XOF
  { maxKm: 7, feeCentimes: 100000 },   // 1,000 XOF
  { maxKm: 15, feeCentimes: 150000 },  // 1,500 XOF
  { maxKm: 25, feeCentimes: 250000 },  // 2,500 XOF
  { maxKm: Infinity, feeCentimes: 350000 }, // 3,500 XOF
];

export function calculateDeliveryFee(distanceKm: number): number {
  const tier = DELIVERY_TIERS.find((t) => distanceKm <= t.maxKm);
  return tier?.feeCentimes ?? DELIVERY_TIERS[DELIVERY_TIERS.length - 1].feeCentimes;
}

export function getDeliveryEstimate(distanceKm: number): string {
  if (distanceKm <= 5) return "30-45 min";
  if (distanceKm <= 10) return "45-60 min";
  if (distanceKm <= 20) return "1-2 heures";
  return "2-3 heures";
}
```

## Delivery Fee Calculator Component

```tsx
// src/components/checkout/DeliveryFeeCalculator.tsx
"use client";

import { useEffect, useState } from "react";
import { useAddressAutocomplete } from "@/hooks/useAddressAutocomplete";
import { calculateHaversineDistance } from "@/lib/distance";
import { calculateDeliveryFee, getDeliveryEstimate } from "@/lib/delivery";
import { formatXOF } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Truck, Clock } from "lucide-react";

interface DeliveryFeeCalculatorProps {
  storeLat: number;
  storeLon: number;
  onFeeCalculated: (fee: number, address: string, lat: number, lon: number) => void;
}

export function DeliveryFeeCalculator({
  storeLat,
  storeLon,
  onFeeCalculated,
}: DeliveryFeeCalculatorProps) {
  const {
    query,
    setQuery,
    suggestions,
    isLoading,
    selectedAddress,
    selectAddress,
  } = useAddressAutocomplete();

  const [deliveryInfo, setDeliveryInfo] = useState<{
    distance: number;
    fee: number;
    estimate: string;
  } | null>(null);

  useEffect(() => {
    if (selectedAddress) {
      const distance = calculateHaversineDistance(
        storeLat,
        storeLon,
        selectedAddress.lat,
        selectedAddress.lon
      );
      const fee = calculateDeliveryFee(distance);
      const estimate = getDeliveryEstimate(distance);

      setDeliveryInfo({ distance, fee, estimate });
      onFeeCalculated(
        fee,
        selectedAddress.displayName,
        selectedAddress.lat,
        selectedAddress.lon
      );
    }
  }, [selectedAddress, storeLat, storeLon, onFeeCalculated]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="delivery-address">Adresse de livraison</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="delivery-address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Entrez votre adresse..."
            className="pl-10"
          />
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.placeId}
                onClick={() => selectAddress(suggestion)}
                className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
              >
                {suggestion.shortAddress}
              </li>
            ))}
          </ul>
        )}

        {isLoading && (
          <p className="text-sm text-muted-foreground">Recherche...</p>
        )}
      </div>

      {/* Delivery info card */}
      {deliveryInfo && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <MapPin className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Distance</p>
                <p className="font-medium">{deliveryInfo.distance.toFixed(1)} km</p>
              </div>
              <div>
                <Truck className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Frais</p>
                <p className="font-medium">{formatXOF(deliveryInfo.fee)}</p>
              </div>
              <div>
                <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Estimation</p>
                <p className="font-medium">{deliveryInfo.estimate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

## Order Schema Fields

```typescript
// convex/schema.ts
orders: defineTable({
  // ... other fields
  delivery_address: v.string(),
  delivery_lat: v.number(),
  delivery_lon: v.number(),
  delivery_distance_km: v.number(),
  delivery_fee: v.number(), // centimes
})
```

## Creating Order with Delivery

```typescript
// convex/orders/mutations.ts
export const createOrder = mutation({
  args: {
    items: v.array(v.object({
      productId: v.id("products"),
      variantId: v.optional(v.id("product_variants")),
      quantity: v.number(),
      price: v.number(),
    })),
    deliveryAddress: v.string(),
    deliveryLat: v.number(),
    deliveryLon: v.number(),
    deliveryDistanceKm: v.number(),
    deliveryFee: v.number(), // Calculated client-side, validated server-side
  },
  handler: async (ctx, args) => {
    // Validate delivery fee matches expected tiers
    const expectedFee = calculateDeliveryFee(args.deliveryDistanceKm);
    if (Math.abs(args.deliveryFee - expectedFee) > 100) {
      throw new Error("Invalid delivery fee");
    }

    const subtotal = args.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const total = subtotal + args.deliveryFee;

    return await ctx.db.insert("orders", {
      // ... other fields
      subtotal,
      delivery_fee: args.deliveryFee,
      delivery_address: args.deliveryAddress,
      delivery_lat: args.deliveryLat,
      delivery_lon: args.deliveryLon,
      delivery_distance_km: args.deliveryDistanceKm,
      total,
      status: "pending",
      created_at: Date.now(),
    });
  },
});
```

## Store Location

Each store has coordinates for distance calculation:

```typescript
// convex/schema.ts
stores: defineTable({
  // ... other fields
  address: v.string(),
  lat: v.number(),
  lon: v.number(),
})
```

## Best Practices

1. **Always debounce** Nominatim requests (500ms minimum)
2. **Include User-Agent** header in all requests
3. **Validate fee server-side** — don't trust client calculation alone
4. **Cache coordinates** — store lat/lon with the order
5. **Handle Nominatim failures** gracefully with fallback
