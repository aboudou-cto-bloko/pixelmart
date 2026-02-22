"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PriceInputProps {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (centimes: number | undefined) => void;
  currency?: string;
  required?: boolean;
  error?: string;
}

/**
 * Input prix en montant lisible.
 * Stocke en centimes, affiche en unités.
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
  const displayValue =
    value !== undefined
      ? (value / 100).toFixed(currency === "XOF" ? 0 : 2)
      : "";

  function handleChange(raw: string) {
    if (raw === "") {
      onChange(undefined);
      return;
    }
    const num = parseFloat(raw);
    if (isNaN(num)) return;
    // Convertir en centimes
    onChange(Math.round(num * (currency === "XOF" ? 1 : 100)));
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
          step={currency === "XOF" ? "1" : "0.01"}
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
