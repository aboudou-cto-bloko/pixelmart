// filepath: src/components/payouts/molecules/PayoutBalanceCard.tsx

"use client";

import { Wallet, ArrowUpRight, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PayoutBalanceCardProps {
  balance: number;
  currency: string;
  canRequestPayout: boolean;
  validationError?: string;
  isLoading?: boolean;
  onRequestPayout: () => void;
}

function formatAmount(centimes: number, currency: string): string {
  const value = centimes / 100;
  if (currency === "XOF") {
    return `${value.toLocaleString("fr-FR")} FCFA`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(value);
}

export function PayoutBalanceCard({
  balance,
  currency,
  canRequestPayout,
  validationError,
  isLoading,
  onRequestPayout,
}: PayoutBalanceCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Solde */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <Wallet className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Solde disponible</p>
              <p className="text-2xl font-bold tracking-tight">
                {formatAmount(balance, currency)}
              </p>
            </div>
          </div>

          {/* CTA + Warning */}
          <div className="flex flex-col items-end gap-1.5">
            <Button
              onClick={onRequestPayout}
              disabled={!canRequestPayout}
              className="gap-2"
            >
              <ArrowUpRight className="h-4 w-4" />
              Demander un retrait
            </Button>

            {validationError && !canRequestPayout && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
