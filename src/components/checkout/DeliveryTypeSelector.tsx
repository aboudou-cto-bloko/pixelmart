// filepath: src/components/checkout/DeliveryTypeSelector.tsx

"use client";

import { DELIVERY_TYPES, type DeliveryType } from "@/constants/deliveryTypes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Package, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  Package,
  Zap,
  AlertTriangle,
} as const;

interface DeliveryTypeSelectorProps {
  value: DeliveryType;
  onChange: (type: DeliveryType) => void;
  disabled?: boolean;
}

export function DeliveryTypeSelector({
  value,
  onChange,
  disabled = false,
}: DeliveryTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Type de livraison</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as DeliveryType)}
        disabled={disabled}
        className="grid gap-3"
      >
        {(
          Object.entries(DELIVERY_TYPES) as [
            DeliveryType,
            (typeof DELIVERY_TYPES)[DeliveryType],
          ][]
        ).map(([key, config]) => {
          const Icon = ICONS[config.icon as keyof typeof ICONS];
          const isSelected = value === key;

          return (
            <Label
              key={key}
              htmlFor={`delivery-type-${key}`}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              <RadioGroupItem
                value={key}
                id={`delivery-type-${key}`}
                className="sr-only"
              />
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{config.label}</p>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
