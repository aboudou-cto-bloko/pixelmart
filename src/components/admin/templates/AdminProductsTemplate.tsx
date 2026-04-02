// filepath: src/components/admin/templates/AdminProductsTemplate.tsx

"use client";

import { useState, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { formatPrice, formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, Package, Ban, RotateCcw, Search } from "lucide-react";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────

type ProductItem = {
  _id: Id<"products">;
  title: string;
  slug: string;
  status: string;
  price: number;
  currency: string;
  quantity: number;
  image_url: string | null;
  store_id: Id<"stores">;
  store_name: string;
  store_owner_id?: Id<"users">;
  _creationTime: number;
  updated_at: number;
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  draft: "Brouillon",
  archived: "Archivé",
  out_of_stock: "Rupture",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  draft: "secondary",
  archived: "destructive",
  out_of_stock: "outline",
};

// ─── Component ───────────────────────────────────────────────

interface AdminProductsTemplateProps {
  products: ProductItem[];
}

export function AdminProductsTemplate({
  products,
}: AdminProductsTemplateProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [suspendTarget, setSuspendTarget] = useState<ProductItem | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<ProductItem | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const suspendProduct = useMutation(api.admin.mutations.suspendProduct);
  const restoreProduct = useMutation(api.admin.mutations.restoreProduct);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.store_name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  async function handleSuspend() {
    if (!suspendTarget || !reason.trim()) return;
    setLoading(true);
    try {
      await suspendProduct({
        productId: suspendTarget._id,
        reason: reason.trim(),
      });
      setSuspendTarget(null);
      setReason("");
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    if (!restoreTarget) return;
    setLoading(true);
    try {
      await restoreProduct({ productId: restoreTarget._id });
      setRestoreTarget(null);
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(
    () => ({
      active: products.filter((p) => p.status === "active").length,
      archived: products.filter((p) => p.status === "archived").length,
      draft: products.filter((p) => p.status === "draft").length,
    }),
    [products],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modération produits</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Surveillez et modérez les produits publiés sur la marketplace.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">
              {counts.active}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Brouillons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{counts.draft}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Archivés / Suspendus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-destructive">
              {counts.archived}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre ou boutique…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="archived">Archivé</SelectItem>
            <SelectItem value="out_of_stock">Rupture</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Boutique</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      <Package className="size-8 mx-auto mb-2 opacity-40" />
                      Aucun produit trouvé
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell>
                      {product.image_url ? (
                        <div className="relative size-10 rounded-md overflow-hidden bg-muted shrink-0">
                          <Image
                            src={product.image_url}
                            alt={product.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="size-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Package className="size-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm line-clamp-2">
                        {product.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {product.store_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(product.price, product.currency)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {product.quantity}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANTS[product.status] ?? "secondary"}
                      >
                        {STATUS_LABELS[product.status] ?? product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(product._creationTime)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {product.status !== "archived" && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setSuspendTarget(product)}
                            >
                              <Ban className="size-4 mr-2" />
                              Retirer de la marketplace
                            </DropdownMenuItem>
                          )}
                          {product.status === "archived" && (
                            <DropdownMenuItem
                              onClick={() => setRestoreTarget(product)}
                            >
                              <RotateCcw className="size-4 mr-2" />
                              Remettre en ligne
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Suspend dialog */}
      <Dialog
        open={!!suspendTarget}
        onOpenChange={(o) => !o && setSuspendTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer ce produit ?</DialogTitle>
            <DialogDescription>
              Le produit <strong>{suspendTarget?.title}</strong> sera archivé et
              retiré de la marketplace. Le vendeur recevra une notification avec
              le motif.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Motif (obligatoire)</label>
            <Textarea
              placeholder="Ex : non-conformité aux conditions d'utilisation, image trompeuse…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || loading}
              onClick={handleSuspend}
            >
              {loading ? "En cours…" : "Retirer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore dialog */}
      <Dialog
        open={!!restoreTarget}
        onOpenChange={(o) => !o && setRestoreTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remettre en ligne ?</DialogTitle>
            <DialogDescription>
              Le produit <strong>{restoreTarget?.title}</strong> sera remis à
              l'état actif et visible sur la marketplace. Le vendeur sera
              notifié.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreTarget(null)}>
              Annuler
            </Button>
            <Button disabled={loading} onClick={handleRestore}>
              {loading ? "En cours…" : "Remettre en ligne"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
