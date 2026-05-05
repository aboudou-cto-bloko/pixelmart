// filepath: src/components/checkout/PaymentModeSelector.tsx

"use client";

import { CreditCard, Banknote, Lock, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { COD_MAX_PENDING_ORDERS, COD_MAX_FAILURES } from "@/constants/cod";
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
              <Icon className="size-5 shrink-0 text-muted-foreground" />
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

      {/* Conditions COD — affichées uniquement quand COD sélectionné */}
      {value === "cod" && !codDisabled && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-3 py-2.5">
          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-medium">Conditions du paiement à la livraison</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-400">
              <li>
                Votre téléphone est requis — le vendeur peut vous appeler pour
                confirmer.
              </li>
              <li>
                Maximum {COD_MAX_PENDING_ORDERS} commandes COD en cours
                simultanément.
              </li>
              <li>
                En cas d&apos;absence ou de refus à la livraison, votre accès au
                paiement à la livraison sera restreint après {COD_MAX_FAILURES}{" "}
                incidents.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
