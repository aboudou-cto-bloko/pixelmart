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
 * La valeur est TOUJOURS stockée en centimes (plus petite unité), quelle que
 * soit la devise. L'affichage se fait en unités principales (÷100).
 * - XOF/XAF/GNF/CDF/XPF : affiché sans décimales (ex: 150000 centimes → "1500")
 * - EUR/USD...            : affiché avec 2 décimales  (ex: 1050 centimes → "10.50")
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
  // Devises sans décimales à l'affichage (mais stockées en centimes quand même)
  const noDecimalCurrencies = ["XOF", "XAF", "GNF", "CDF", "XPF"];
  const isNoDecimal = noDecimalCurrencies.includes(currency);

  // Toujours diviser par 100 pour afficher (centimes → unités principales)
  const displayValue =
    value !== undefined ? (value / 100).toFixed(isNoDecimal ? 0 : 2) : "";

  function handleChange(raw: string) {
    if (raw === "") {
      onChange(undefined);
      return;
    }
    const num = parseFloat(raw);
    if (isNaN(num)) return;
    // Toujours multiplier par 100 pour stocker (unités → centimes)
    onChange(Math.round(num * 100));
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
          step={isNoDecimal ? "1" : "0.01"}
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
