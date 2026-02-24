// filepath: src/components/orders/templates/VendorOrdersTemplate.tsx

"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorOrdersTable } from "../organisms/VendorOrdersTable";

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

type StatusFilter = OrderStatus | "all";

interface OrderRow {
  _id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  _creationTime: number;
  items: Array<{ title: string; quantity: number }>;
}

interface VendorOrdersTemplateProps {
  orders: OrderRow[];
  isLoading: boolean;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  onViewOrder: (id: string) => void;
  statusCounts?: Record<string, number>;
}

const STATUS_TABS: Array<{ value: StatusFilter; label: string; key: string }> =
  [
    { value: "all", label: "Toutes", key: "all" },
    { value: "paid", label: "À traiter", key: "paid" },
    { value: "processing", label: "En cours", key: "processing" },
    { value: "shipped", label: "Expédiées", key: "shipped" },
    { value: "delivered", label: "Livrées", key: "delivered" },
    { value: "cancelled", label: "Annulées", key: "cancelled" },
  ];

export function VendorOrdersTemplate({
  orders,
  isLoading,
  statusFilter,
  onStatusFilterChange,
  onViewOrder,
  statusCounts,
}: VendorOrdersTemplateProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Commandes
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez les commandes de votre boutique
        </p>
      </div>

      {/* Status filter tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}
      >
        <TabsList className="h-9 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.value}
              className="text-xs sm:text-sm"
            >
              {tab.label}
              {statusCounts &&
                statusCounts[tab.key] !== undefined &&
                statusCounts[tab.key] > 0 && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({statusCounts[tab.key]})
                  </span>
                )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      <VendorOrdersTable
        orders={orders}
        onViewOrder={onViewOrder}
        isLoading={isLoading}
      />
    </div>
  );
}
