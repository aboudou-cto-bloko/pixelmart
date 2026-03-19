// filepath: src/components/checkout/PaymentModeSelector.tsx

"use client";

import { CreditCard, Banknote, Lock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PaymentMode } from "@/constants/deliveryTypes";

interface PaymentModeSelectorProps {
  value: PaymentMode;
  onChange: (mode: PaymentMode) => void;
  /** Désactiver l'option COD */
  codDisabled?: boolean;
}

const PAYMENT_MODES: {
  value: PaymentMode;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "online",
    label: "Paiement en ligne",
    description: "Payez maintenant par Mobile Money",
    icon: CreditCard,
  },
  {
    value: "cod",
    label: "Paiement à la livraison",
    description: "Payez en espèces au livreur",
    icon: Banknote,
  },
];

export function PaymentModeSelector({
  value,
  onChange,
  codDisabled = false,
}: PaymentModeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Mode de paiement</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as PaymentMode)}
        className="grid gap-3"
      >
        {PAYMENT_MODES.map((mode) => {
          const Icon = mode.icon;
          const isDisabled = mode.value === "cod" && codDisabled;

          return (
            <label
              key={mode.value}
              className={`
                flex items-center gap-4 rounded-lg border p-4 cursor-pointer
                transition-colors
                ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed bg-muted/30"
                    : "hover:bg-accent/50"
                }
                ${
                  value === mode.value && !isDisabled
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }
              `}
            >
              <RadioGroupItem
                value={mode.value}
                disabled={isDisabled}
                className="shrink-0"
              />
              <Icon
                className={`size-5 shrink-0 ${
                  isDisabled ? "text-muted-foreground" : "text-muted-foreground"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isDisabled ? "text-muted-foreground" : ""
                  }`}
                >
                  {mode.label}
                  {isDisabled && (
                    <span className="ml-2 inline-flex items-center text-xs text-muted-foreground">
                      <Lock className="size-3 mr-1" />
                      Bientôt disponible
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {mode.description}
                </p>
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
