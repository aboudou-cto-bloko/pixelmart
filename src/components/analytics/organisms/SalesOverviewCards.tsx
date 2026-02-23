// filepath: src/components/analytics/organisms/SalesOverviewCards.tsx

"use client";

import { DollarSign, ShoppingCart, Receipt, XCircle } from "lucide-react";
import { StatCard, StatCardSkeleton } from "../molecules/StatCard";

interface SalesOverviewData {
  revenue: { value: number; previous: number; change: number };
  orders: { value: number; previous: number; change: number };
  averageOrderValue: { value: number; previous: number; change: number };
  refunds: { count: number; amount: number };
  cancellations: number;
}

interface SalesOverviewCardsProps {
  data: SalesOverviewData | null | undefined;
  currency?: string;
  isLoading?: boolean;
}

export function SalesOverviewCards({
  data,
  currency = "XOF",
  isLoading,
}: SalesOverviewCardsProps) {
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Chiffre d'affaires"
        value={data.revenue.value}
        change={data.revenue.change}
        type="currency"
        currency={currency}
        icon={DollarSign}
      />
      <StatCard
        label="Commandes"
        value={data.orders.value}
        change={data.orders.change}
        icon={ShoppingCart}
      />
      <StatCard
        label="Panier moyen"
        value={data.averageOrderValue.value}
        change={data.averageOrderValue.change}
        type="currency"
        currency={currency}
        icon={Receipt}
      />
      <StatCard
        label="Annulations"
        value={data.cancellations}
        change={0}
        icon={XCircle}
      />
    </div>
  );
}
