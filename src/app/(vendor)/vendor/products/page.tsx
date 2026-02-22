"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/products/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Archive,
  Trash2,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";

type StatusFilter = "all" | "draft" | "active" | "archived" | "out_of_stock";

export default function VendorProductsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<Id<"products"> | null>(null);

  const statusArg =
    statusFilter === "all"
      ? undefined
      : (statusFilter as "draft" | "active" | "archived" | "out_of_stock");

  const products = useQuery(api.products.queries.listByStore, {
    status: statusArg,
  });

  const updateStatus = useMutation(api.products.mutations.updateStatus);
  const removeProduct = useMutation(api.products.mutations.remove);

  async function handleDelete() {
    if (!deleteTarget) return;
    await removeProduct({ id: deleteTarget });
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produits</h1>
          <p className="text-sm text-muted-foreground">
            Gérez votre catalogue de produits
          </p>
        </div>
        <Button asChild>
          <Link href="/vendor/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val as StatusFilter)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="draft">Brouillons</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="archived">Archivés</SelectItem>
            <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
          </SelectContent>
        </Select>

        {products && (
          <span className="text-sm text-muted-foreground">
            {products.length} produit{products.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      {!products ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-muted-foreground">Aucun produit trouvé</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/vendor/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Créer votre premier produit
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16" />
                <TableHead>Produit</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    {product.thumbnailUrl ? (
                      <Image
                        src={product.thumbnailUrl}
                        alt={product.title}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={product.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {(product.price / 100).toLocaleString("fr-FR")} F
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.track_inventory ? product.quantity : "∞"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/vendor/products/${product._id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        {product.status === "draft" && (
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatus({
                                id: product._id,
                                status: "active",
                              })
                            }
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Publier
                          </DropdownMenuItem>
                        )}
                        {product.status === "active" && (
                          <DropdownMenuItem
                            onClick={() =>
                              updateStatus({
                                id: product._id,
                                status: "archived",
                              })
                            }
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archiver
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(product._id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit, ses variantes et ses
              images seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
