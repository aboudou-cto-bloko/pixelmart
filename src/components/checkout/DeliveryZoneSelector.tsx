// filepath: src/components/checkout/DeliveryZoneSelector.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";

interface DeliveryZoneSelectorProps {
  value?: Id<"delivery_zones">;
  onChange: (
    zoneId: Id<"delivery_zones">,
    zoneName: string,
    distanceKm: number,
  ) => void;
  city?: string;
  disabled?: boolean;
}

export function DeliveryZoneSelector({
  value,
  onChange,
  city,
  disabled = false,
}: DeliveryZoneSelectorProps) {
  const zones = useQuery(api.delivery.queries.listZones, { city });

  if (zones === undefined) {
    return (
      <div className="space-y-2">
        <Label>Zone de livraison</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Zone de livraison</Label>
        <p className="text-sm text-muted-foreground">
          Aucune zone de livraison disponible pour cette ville.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="delivery-zone">Zone de livraison</Label>
      <Select
        value={value}
        onValueChange={(zoneId) => {
          const zone = zones.find((z) => z._id === zoneId);
          if (zone) {
            onChange(zone._id, zone.name, zone.default_distance_km);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger id="delivery-zone" className="w-full">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Sélectionnez votre zone" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {zones.map((zone) => (
            <SelectItem key={zone._id} value={zone._id}>
              <div className="flex items-center justify-between gap-4">
                <span>{zone.name}</span>
                <span className="text-xs text-muted-foreground">
                  {zone.city} • ~{zone.default_distance_km} km
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
