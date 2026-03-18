// filepath: src/components/checkout/PaymentModeSelector.tsx

"use client";

import { PAYMENT_MODES, type PaymentMode } from "@/constants/deliveryTypes";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  CreditCard,
  Banknote,
} as const;

interface PaymentModeSelectorProps {
  value: PaymentMode;
  onChange: (mode: PaymentMode) => void;
  disabled?: boolean;
  /** Si le vendeur n'accepte pas le COD */
  codDisabled?: boolean;
}

export function PaymentModeSelector({
  value,
  onChange,
  disabled = false,
  codDisabled = false,
}: PaymentModeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Mode de paiement</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as PaymentMode)}
        disabled={disabled}
        className="grid gap-3 sm:grid-cols-2"
      >
        {(
          Object.entries(PAYMENT_MODES) as [
            PaymentMode,
            (typeof PAYMENT_MODES)[PaymentMode],
          ][]
        ).map(([key, config]) => {
          const Icon = ICONS[config.icon as keyof typeof ICONS];
          const isSelected = value === key;
          const isDisabled = disabled || (key === "cod" && codDisabled);

          return (
            <Label
              key={key}
              htmlFor={`payment-mode-${key}`}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                isDisabled && "opacity-50 cursor-not-allowed",
              )}
            >
              <RadioGroupItem
                value={key}
                id={`payment-mode-${key}`}
                disabled={isDisabled}
                className="sr-only"
              />
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{config.label}</p>
                <p className="text-xs text-muted-foreground">
                  {config.description}
                </p>
              </div>
            </Label>
          );
        })}
      </RadioGroup>
      {codDisabled && (
        <p className="text-xs text-muted-foreground">
          Le paiement à la livraison n'est pas disponible pour cette boutique.
        </p>
      )}
    </div>
  );
}
