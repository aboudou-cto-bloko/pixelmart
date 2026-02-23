// filepath: src/components/products/organisms/ProductListTable.tsx

"use client";

import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductStatusBadge } from "../atoms/ProductStatusBadge";
import { ProductRowActions } from "../molecules/ProductRowActions";
import { formatPrice } from "@/lib/utils";

type ProductStatus = "draft" | "active" | "archived" | "out_of_stock";

interface ProductRow {
  _id: string;
  title: string;
  slug: string;
  status: ProductStatus;
  price: number;
  quantity: number;
  thumbnailUrl: string | null;
  _creationTime: number;
}

interface ProductListTableProps {
  products: ProductRow[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onStatusChange: (id: string, status: "draft" | "active" | "archived") => void;
  onDelete: (id: string) => void;
  currency?: string;
  isLoading?: boolean;
}

export function ProductListTable({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDuplicate,
  onStatusChange,
  onDelete,
  currency = "XOF",
  isLoading,
}: ProductListTableProps) {
  const allSelected =
    products.length > 0 && selectedIds.size === products.length;
  const someSelected =
    selectedIds.size > 0 && selectedIds.size < products.length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm font-medium">Aucun produit</p>
        <p className="text-xs text-muted-foreground">
          Créez votre premier produit ou importez un fichier CSV.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={allSelected}
              ref={(el) => {
                if (el) {
                  (el as unknown as HTMLInputElement).indeterminate =
                    someSelected;
                }
              }}
              onCheckedChange={onToggleSelectAll}
              aria-label="Tout sélectionner"
            />
          </TableHead>
          <TableHead>Produit</TableHead>
          <TableHead className="hidden sm:table-cell">Statut</TableHead>
          <TableHead className="text-right hidden md:table-cell">
            Stock
          </TableHead>
          <TableHead className="text-right">Prix</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow
            key={product._id}
            className={selectedIds.has(product._id) ? "bg-muted/50" : undefined}
          >
            <TableCell>
              <Checkbox
                checked={selectedIds.has(product._id)}
                onCheckedChange={() => onToggleSelect(product._id)}
                aria-label={`Sélectionner ${product.title}`}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                {product.thumbnailUrl ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted shrink-0">
                    <Image
                      src={product.thumbnailUrl}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-md bg-muted shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium line-clamp-1">
                    {product.title}
                  </p>
                  <ProductStatusBadge
                    status={product.status}
                    className="sm:hidden mt-1"
                  />
                </div>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <ProductStatusBadge status={product.status} />
            </TableCell>
            <TableCell className="text-right tabular-nums hidden md:table-cell">
              {product.quantity}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatPrice(product.price, currency)}
            </TableCell>
            <TableCell>
              <ProductRowActions
                productId={product._id}
                productSlug={product.slug}
                status={product.status}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
