"use client";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { X } from "lucide-react";

type VariantOption = { name: string; value: string };

type Variant = {
  _id: string;
  title: string;
  options: VariantOption[];
  price?: number;
  quantity: number;
  is_available: boolean;
  resolvedImageUrl?: string | null;
};

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
  onClear?: () => void;
  currency?: string;
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
  onClear,
  currency = "XOF",
}: VariantSelectorProps) {
  if (variants.length === 0) return null;

  const optionNames = Array.from(
    new Set(
      variants.flatMap((v) => v.options.map((o) => o.name)).filter(Boolean),
    ),
  );

  const optionGroups = optionNames.map((name) => ({
    name,
    values: Array.from(
      new Set(
        variants
          .flatMap((v) =>
            v.options.filter((o) => o.name === name).map((o) => o.value),
          )
          .filter(Boolean),
      ),
    ),
  }));

  const selectedVariant =
    variants.find((v) => v._id === selectedVariantId) ?? null;
  const selectedValues: Record<string, string> = {};
  if (selectedVariant) {
    for (const opt of selectedVariant.options) {
      selectedValues[opt.name] = opt.value;
    }
  }

  function handleOptionClick(optionName: string, optionValue: string) {
    // Toggle: clicking the already-selected value deselects the variant
    if (selectedValues[optionName] === optionValue) {
      onClear?.();
      return;
    }

    const newSelection = { ...selectedValues, [optionName]: optionValue };

    // 1. Prefer exact match with all currently selected dimensions + new value
    const exactMatch = variants.find(
      (v) =>
        v.is_available &&
        v.quantity > 0 &&
        Object.entries(newSelection).every(([name, val]) =>
          v.options.some((o) => o.name === name && o.value === val),
        ),
    );
    if (exactMatch) {
      onSelect(exactMatch._id);
      return;
    }

    // 2. Fallback: find any stocked variant that has the newly clicked option
    //    (allows switching e.g. from Rouge/S → Bleu when Bleu/S is out of stock
    //    but Bleu/M has stock — auto-selects Bleu/M)
    const fallbackMatch = variants.find(
      (v) =>
        v.is_available &&
        v.quantity > 0 &&
        v.options.some((o) => o.name === optionName && o.value === optionValue),
    );
    if (fallbackMatch) {
      onSelect(fallbackMatch._id);
    }
  }

  function isValueAvailable(optionName: string, optionValue: string): boolean {
    // A button is enabled if ANY stocked variant carries that option value.
    // We intentionally do NOT filter by other selected dimensions here because
    // that would disable buttons even when an alternate combo has stock
    // (e.g. Bleu/S out of stock but Bleu/M in stock → Bleu should still be clickable).
    return variants.some(
      (v) =>
        v.is_available &&
        v.quantity > 0 &&
        v.options.some((o) => o.name === optionName && o.value === optionValue),
    );
  }

  return (
    <div className="space-y-4">
      {/* Clear selection button */}
      {selectedVariantId && onClear && (
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">Variantes disponibles</p>
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3" />
            Déselectionner
          </button>
        </div>
      )}
      {optionGroups.map((group) => (
        <div key={group.name} className="space-y-2">
          <p className="text-sm font-medium">
            {group.name}
            {selectedValues[group.name] && (
              <span className="ml-2 font-normal text-muted-foreground">
                : {selectedValues[group.name]}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.values
              .filter((val) => isValueAvailable(group.name, val))
              .map((val) => {
                const isSelected = selectedValues[group.name] === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleOptionClick(group.name, val)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/60",
                    )}
                  >
                    {val}
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      {selectedVariant && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {selectedVariant.price !== undefined && (
            <span className="font-semibold text-foreground">
              {formatPrice(selectedVariant.price, currency)}
            </span>
          )}
          {selectedVariant.quantity > 0 && selectedVariant.quantity <= 5 && (
            <span className="text-amber-600 font-medium">
              {selectedVariant.quantity} restant
              {selectedVariant.quantity !== 1 ? "s" : ""}
            </span>
          )}
          {!selectedVariant.is_available || selectedVariant.quantity === 0 ? (
            <span className="text-destructive font-medium">
              Rupture de stock
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
