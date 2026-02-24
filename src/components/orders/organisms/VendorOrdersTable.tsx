// filepath: src/components/orders/organisms/VendorOrdersTable.tsx

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "../atoms/OrderStatusBadge";
import { formatPrice } from "@/lib/utils";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

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

interface VendorOrdersTableProps {
  orders: OrderRow[];
  onViewOrder: (id: string) => void;
  isLoading?: boolean;
  currency?: string;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function VendorOrdersTable({
  orders,
  onViewOrder,
  isLoading,
}: VendorOrdersTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm font-medium">Aucune commande</p>
        <p className="text-xs text-muted-foreground">
          Les nouvelles commandes apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Commande</TableHead>
          <TableHead className="hidden sm:table-cell">Client</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="hidden md:table-cell">Articles</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="hidden sm:table-cell">Date</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow
            key={order._id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onViewOrder(order._id)}
          >
            <TableCell className="font-mono text-xs font-medium">
              {order.order_number}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <div className="min-w-0">
                <p className="text-sm truncate">{order.customer_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {order.customer_email}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>
            <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
              {order.items.length} article{order.items.length > 1 ? "s" : ""}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums text-sm">
              {formatPrice(order.total_amount, order.currency)}
            </TableCell>
            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
              {formatDate(order._creationTime)}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewOrder(order._id);
                }}
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">Voir</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
