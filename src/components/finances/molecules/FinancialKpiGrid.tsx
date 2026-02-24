// filepath: src/components/finance/molecules/FinancialKpiGrid.tsx

"use client";

import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Percent,
} from "lucide-react";
import { BalanceCard } from "../atoms/BalanceCard";

interface FinancialKpiGridProps {
  balance: number;
  pendingBalance: number;
  revenue30d: number;
  commissions30d: number;
  revenueTrend: number;
  currency: string;
  commissionRate: number;
}

export function FinancialKpiGrid({
  balance,
  pendingBalance,
  revenue30d,
  commissions30d,
  revenueTrend,
  currency,
  commissionRate,
}: FinancialKpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <BalanceCard
        title="Solde disponible"
        amount={balance}
        currency={currency}
        icon={Wallet}
        subtitle="Retrait possible"
      />
      <BalanceCard
        title="En attente"
        amount={pendingBalance}
        currency={currency}
        icon={Clock}
        subtitle="Libéré sous 48h"
      />
      <BalanceCard
        title="Revenus (30j)"
        amount={revenue30d}
        currency={currency}
        icon={ArrowUpRight}
        trend={revenueTrend}
      />
      <BalanceCard
        title="Commissions (30j)"
        amount={commissions30d}
        currency={currency}
        icon={Percent}
        subtitle={`Taux : ${(commissionRate / 100).toFixed(0)}%`}
      />
    </div>
  );
}
