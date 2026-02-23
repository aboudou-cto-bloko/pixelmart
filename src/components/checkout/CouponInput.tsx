// filepath: src/components/checkout/CouponInput.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Tag, X, Loader2, Check } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Id } from "../../../convex/_generated/dataModel";

interface CouponInputProps {
  storeId: Id<"stores">;
  subtotal: number;
  appliedCode: string | null;
  onApply: (code: string, discount: number) => void;
  onRemove: () => void;
}

export function CouponInput({
  storeId,
  subtotal,
  appliedCode,
  onApply,
  onRemove,
}: CouponInputProps) {
  const [inputCode, setInputCode] = useState("");
  const [codeToValidate, setCodeToValidate] = useState<string | null>(null);

  // Query réactive — ne se lance que quand codeToValidate est set
  const validation = useQuery(
    api.coupons.queries.validate,
    codeToValidate ? { code: codeToValidate, storeId, subtotal } : "skip",
  );

  function handleValidate() {
    const trimmed = inputCode.trim().toUpperCase();
    if (trimmed.length === 0) return;
    setCodeToValidate(trimmed);
  }

  // Quand la validation arrive, appliquer automatiquement
  if (validation && codeToValidate) {
    if (validation.valid && !appliedCode) {
      onApply(validation.code, validation.discount);
      setCodeToValidate(null);
      setInputCode("");
    }
  }

  // Coupon déjà appliqué
  if (appliedCode) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
          <Tag className="size-3" />
          {appliedCode}
          <Check className="size-3 text-green-500" />
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive"
          onClick={() => {
            onRemove();
            setCodeToValidate(null);
          }}
        >
          <X className="size-3.5" />
          <span className="sr-only">Retirer le code promo</span>
        </Button>
      </div>
    );
  }

  const isValidating = codeToValidate !== null && validation === undefined;
  const hasError = codeToValidate !== null && validation && !validation.valid;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={inputCode}
            onChange={(e) => {
              setInputCode(e.target.value.toUpperCase());
              // Reset validation quand l'input change
              if (codeToValidate) setCodeToValidate(null);
            }}
            placeholder="Code promo"
            className="pl-9 h-9 text-sm uppercase"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleValidate();
              }
            }}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 shrink-0"
          onClick={handleValidate}
          disabled={inputCode.trim().length === 0 || isValidating}
        >
          {isValidating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            "Appliquer"
          )}
        </Button>
      </div>
      {hasError && (
        <p className="text-xs text-destructive">{validation.error}</p>
      )}
    </div>
  );
}
