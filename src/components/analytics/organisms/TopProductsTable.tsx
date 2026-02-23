// filepath: src/components/analytics/organisms/TopProductsTable.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../atoms/EmptyState";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

interface TopProduct {
  productId: string;
  title: string;
  image: string | null;
  slug: string | null;
  revenue: number;
  quantity: number;
  orders: number;
}

interface TopProductsTableProps {
  data: TopProduct[] | null | undefined;
  currency?: string;
  isLoading?: boolean;
}

export function TopProductsTable({
  data,
  currency = "XOF",
  isLoading,
}: TopProductsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Top produits</CardTitle>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <EmptyState
            title="Aucune vente"
            description="Vos produits les plus vendus apparaîtront ici."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Qté</TableHead>
                <TableHead className="text-right hidden sm:table-cell">
                  Commandes
                </TableHead>
                <TableHead className="text-right">Revenus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((product, index) => (
                <TableRow key={product.productId}>
                  <TableCell className="font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <div className="relative h-8 w-8 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-md bg-muted" />
                      )}
                      <span className="text-sm font-medium line-clamp-1">
                        {product.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.quantity}
                  </TableCell>
                  <TableCell className="text-right tabular-nums hidden sm:table-cell">
                    {product.orders}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatPrice(product.revenue, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
