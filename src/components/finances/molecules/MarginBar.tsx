// filepath: src/components/finance/molecules/MarginBar.tsx

"use client";

import { cn } from "@/lib/utils";

interface MarginBarProps {
  title: string;
  revenue: number;
  cost: number;
  commission: number;
  net: number;
  marginPercent: number;
  currency: string;
  quantity: number;
}

function fmt(centimes: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "XOF" ? 0 : 2,
    maximumFractionDigits: currency === "XOF" ? 0 : 2,
  }).format(centimes / 100);
}

export function MarginBar({
  title,
  revenue,
  cost,
  commission,
  net,
  marginPercent,
  currency,
  quantity,
}: MarginBarProps) {
  // Largeur de la barre proportionnelle
  const maxWidth = revenue > 0 ? 100 : 0;
  const costWidth = revenue > 0 ? (cost / revenue) * 100 : 0;
  const commissionWidth = revenue > 0 ? (commission / revenue) * 100 : 0;
  const netWidth = Math.max(0, maxWidth - costWidth - commissionWidth);

  return (
    <div className="space-y-2 py-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground">
            {quantity} vendu{quantity > 1 ? "s" : ""}
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-sm font-medium tabular-nums">
            {fmt(net, currency)}
          </p>
          <p
            className={cn(
              "text-xs font-medium",
              marginPercent >= 30
                ? "text-emerald-500"
                : marginPercent >= 10
                  ? "text-yellow-500"
                  : "text-red-500",
            )}
          >
            {marginPercent}% marge
          </p>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        {costWidth > 0 && (
          <div
            className="bg-red-400 h-full"
            style={{ width: `${costWidth}%` }}
            title={`Coût : ${fmt(cost, currency)}`}
          />
        )}
        {commissionWidth > 0 && (
          <div
            className="bg-yellow-400 h-full"
            style={{ width: `${commissionWidth}%` }}
            title={`Commission : ${fmt(commission, currency)}`}
          />
        )}
        {netWidth > 0 && (
          <div
            className="bg-emerald-500 h-full"
            style={{ width: `${netWidth}%` }}
            title={`Net : ${fmt(net, currency)}`}
          />
        )}
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Revenu : {fmt(revenue, currency)}</span>
        <div className="flex gap-3">
          {cost > 0 && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Coût
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />{" "}
            Commission
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Net
          </span>
        </div>
      </div>
    </div>
  );
}
