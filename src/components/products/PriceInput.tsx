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
 * La valeur est TOUJOURS stockée en centimes (plus petite unité).
 *
 * IMPORTANT — règle XOF/XAF/GNF/CDF :
 *   Pour ces devises, 1 centime = 1 unité d'affichage (pas de subdivision).
 *   → L'utilisateur saisit la valeur FCFA directement, aucune conversion ×/÷ 100.
 *   Exemple : 2 000 FCFA = 2000 centimes (stocké et affiché tel quel).
 *
 * Pour EUR/USD... :
 *   L'utilisateur saisit en unités (€), stocké ×100 en centimes.
 *   Exemple : 10.50 EUR → 1050 centimes.
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
  // Pour XOF et équivalents, centimes = valeur affichée (pas de ÷100)
  const noSubunitCurrencies = ["XOF", "XAF", "GNF", "CDF", "XPF"];
  const isNoSubunit = noSubunitCurrencies.includes(currency);

  // XOF : afficher tel quel (pas de ÷100) ; EUR : ÷100 avec 2 décimales
  const displayValue =
    value !== undefined
      ? isNoSubunit
        ? String(value)
        : (value / 100).toFixed(2)
      : "";

  function handleChange(raw: string) {
    if (raw === "") {
      onChange(undefined);
      return;
    }
    const num = parseFloat(raw);
    if (isNaN(num)) return;
    // XOF : stocker directement (pas de ×100) ; EUR : ×100
    onChange(isNoSubunit ? Math.round(num) : Math.round(num * 100));
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
          step={isNoSubunit ? "1" : "0.01"}
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
