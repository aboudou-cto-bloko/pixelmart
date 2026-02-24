// filepath: src/components/orders/molecules/TrackingForm.tsx

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck } from "lucide-react";

interface TrackingFormProps {
  currentTrackingNumber?: string;
  currentCarrier?: string;
  onSubmit: (data: {
    trackingNumber: string;
    carrier?: string;
    estimatedDelivery?: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

const CARRIERS = [
  { value: "dhl", label: "DHL" },
  { value: "fedex", label: "FedEx" },
  { value: "ups", label: "UPS" },
  { value: "chronopost", label: "Chronopost" },
  { value: "laposte", label: "La Poste" },
  { value: "local", label: "Transporteur local" },
  { value: "pixel_mart", label: "Pixel-Mart Delivery" },
];

export function TrackingForm({
  currentTrackingNumber,
  currentCarrier,
  onSubmit,
  isLoading,
}: TrackingFormProps) {
  const [trackingNumber, setTrackingNumber] = useState(
    currentTrackingNumber ?? "",
  );
  const [carrier, setCarrier] = useState(currentCarrier ?? "");
  const [estimatedDays, setEstimatedDays] = useState("");

  const handleSubmit = async () => {
    if (!trackingNumber.trim()) return;

    const estimatedDelivery = estimatedDays
      ? Date.now() + Number(estimatedDays) * 24 * 60 * 60 * 1000
      : undefined;

    await onSubmit({
      trackingNumber: trackingNumber.trim(),
      carrier: carrier || undefined,
      estimatedDelivery,
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Numéro de suivi
          </label>
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Ex: 1Z999AA10123456784"
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Transporteur
          </label>
          <Select value={carrier} onValueChange={setCarrier}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {CARRIERS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Livraison estimée (en jours)
        </label>
        <Input
          type="number"
          min="1"
          max="90"
          value={estimatedDays}
          onChange={(e) => setEstimatedDays(e.target.value)}
          placeholder="Ex: 5"
          className="w-32"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!trackingNumber.trim() || isLoading}
        size="sm"
      >
        <Truck className="mr-1.5 h-3.5 w-3.5" />
        {currentTrackingNumber ? "Mettre à jour le suivi" : "Ajouter le suivi"}
      </Button>
    </div>
  );
}
