// filepath: src/components/storefront/atoms/PriceTag.tsx

import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PriceTagProps {
  price: number; // centimes
  comparePrice?: number; // centimes
  currency?: string;
  size?: "sm" | "md" | "lg";
}

export function PriceTag({
  price,
  comparePrice,
  currency = "XOF",
  size = "md",
}: PriceTagProps) {
  const hasDiscount = comparePrice && comparePrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  }[size];

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className={cn("font-bold", textSize)}>
        {formatPrice(price, currency)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-xs text-muted-foreground line-through">
            {formatPrice(comparePrice, currency)}
          </span>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            -{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
