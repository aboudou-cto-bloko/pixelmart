"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PriceInputProps {
  id: string;
  label: string;
  value: number | undefined; // toujours en centimes (plus petite unité)
  onChange: (valueInCents: number | undefined) => void;
  currency?: string;
  required?: boolean;
  error?: string;
}

/**
 * Input prix.
 * La valeur est toujours stockée dans la plus petite unité de la devise :
 * - Devises avec centimes (EUR, USD...) : stocké en centimes (1 € = 100)
 * - Devises sans centimes (XOF, XAF...) : stocké en unités (1 F = 1)
 * L'affichage et la saisie se font dans l'unité courante.
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
  const noSubunitCurrencies = ["XOF", "XAF", "XPF"];
  const hasSubunit = !noSubunitCurrencies.includes(currency);

  // Convertir la valeur stockée (centimes) en valeur affichée (unités)
  const displayValue =
    value !== undefined
      ? hasSubunit
        ? (value / 100).toFixed(2) // ex: 1000 centimes -> 10.00 €
        : value.toString() // ex: 1000 F -> 1000
      : "";

  function handleChange(raw: string) {
    if (raw === "") {
      onChange(undefined);
      return;
    }
    const num = parseFloat(raw);
    if (isNaN(num)) return;
    // Convertir la saisie (unités) en valeur stockée (centimes)
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
