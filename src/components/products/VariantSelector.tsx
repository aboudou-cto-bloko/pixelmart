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
    const newSelection = { ...selectedValues, [optionName]: optionValue };
    const match = variants.find((v) =>
      Object.entries(newSelection).every(([name, val]) =>
        v.options.some((o) => o.name === name && o.value === val),
      ),
    );
    if (match) onSelect(match._id);
  }

  function isValueAvailable(optionName: string, optionValue: string): boolean {
    const tentative = { ...selectedValues, [optionName]: optionValue };
    return variants.some(
      (v) =>
        v.is_available &&
        v.quantity > 0 &&
        Object.entries(tentative).every(([name, val]) =>
          v.options.some((o) => o.name === name && o.value === val),
        ),
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
            {group.values.map((val) => {
              const isSelected = selectedValues[group.name] === val;
              const available = isValueAvailable(group.name, val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() =>
                    available && handleOptionClick(group.name, val)
                  }
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : available
                        ? "border-border hover:border-primary/60"
                        : "border-border opacity-40 cursor-not-allowed line-through",
                  )}
                  disabled={!available}
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
