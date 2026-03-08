"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PriceInputProps {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (valueInUnit: number | undefined) => void; // valeur dans l'unité de base (francs pour XOF, euros pour EUR, etc.)
  currency?: string;
  required?: boolean;
  error?: string;
}

/**
 * Input prix.
 * Pour les devises avec centimes (EUR, USD...), la valeur est stockée en centimes.
 * Pour les devises sans centimes (XOF, XAF...), la valeur est stockée en unité (francs).
 * L'affichage et la saisie se font dans l'unité courante (francs ou euros).
 * La conversion est interne.
 */
export function PriceInput({
  id,
  label,
  value,
  onChange,
  currency = "XOF",
  required = false,
  error,
}: PriceInputProps) {
  // Liste des devises sans sous-unité (à adapter selon vos besoins)
  const noSubunitCurrencies = ["XOF", "XAF", "XPF"];
  const hasSubunit = !noSubunitCurrencies.includes(currency);

  // Valeur affichée : pour les devises avec sous-unité, on convertit les centimes en unités
  const displayValue =
    value !== undefined
      ? hasSubunit
        ? (value / 100).toFixed(2)
        : value.toString()
      : "";

  function handleChange(raw: string) {
    if (raw === "") {
      onChange(undefined);
      return;
    }
    const num = parseFloat(raw);
    if (isNaN(num)) return;
    // Pour les devises avec sous-unité, on convertit en centimes
    const newValue = hasSubunit ? Math.round(num * 100) : num;
    onChange(newValue);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          min="0"
          step={hasSubunit ? "0.01" : "1"}
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="0"
          className="pr-14"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {currency}
        </span>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
