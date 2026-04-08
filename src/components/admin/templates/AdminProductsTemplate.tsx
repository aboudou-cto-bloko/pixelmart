// filepath: src/components/admin/templates/AdminProductsTemplate.tsx

"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { formatPrice, formatDate } from "@/lib/format";
import { RichTextViewer } from "@/components/products/RichTextViewer";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MoreHorizontal,
  Package,
  Ban,
  RotateCcw,
  Search,
  Eye,
  ExternalLink,
  Star,
  Tag,
  Barcode,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

// ─── Product Preview Modal ────────────────────────────────────

function ProductPreviewModal({
  productId,
  open,
  onOpenChange,
  onSuspend,
  onRestore,
}: {
  productId: Id<"products"> | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSuspend: (p: {
    _id: Id<"products">;
    title: string;
    status: string;
  }) => void;
  onRestore: (p: { _id: Id<"products">; title: string }) => void;
}) {
  const product = useQuery(
    api.admin.queries.getAdminProduct,
    productId ? { productId } : "skip",
  );
  const [prevProductId, setPrevProductId] = useState(productId);
  const [imgIndex, setImgIndex] = useState(0);

  if (prevProductId !== productId) {
    setPrevProductId(productId);
    setImgIndex(0);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {product === undefined ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : product === null ? (
          <div className="py-16 text-center text-muted-foreground">
            Produit introuvable
          </div>
        ) : (
          <>
            {/* Images */}
            {product.image_urls.length > 0 ? (
              <div className="relative bg-muted">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={product.image_urls[imgIndex] ?? product.image_urls[0]}
                    alt={product.title}
                    fill
                    sizes="(max-width: 672px) 100vw, 672px"
                    className="object-contain"
                  />
                </div>
                {product.image_urls.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto bg-muted/50">
                    {product.image_urls.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setImgIndex(i)}
                        className={`relative size-14 shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                          i === imgIndex
                            ? "border-primary"
                            : "border-transparent hover:border-muted-foreground/30"
                        }`}
                      >
                        <Image
                          src={url}
                          alt={`Image ${i + 1}`}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center aspect-[4/3] bg-muted">
                <Package className="size-16 text-muted-foreground/30" />
              </div>
            )}

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold leading-snug">
                    {product.title}
                  </h2>
                  <Badge
                    variant={STATUS_VARIANTS[product.status] ?? "secondary"}
                    className="shrink-0"
                  >
                    {STATUS_LABELS[product.status] ?? product.status}
                  </Badge>
                </div>

                {product.short_description && (
                  <p className="text-sm text-muted-foreground">
                    {product.short_description}
                  </p>
                )}

                {/* Price */}
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  {product.compare_price &&
                    product.compare_price > product.price && (
                      <span className="text-sm line-through text-muted-foreground">
                        {formatPrice(product.compare_price, product.currency)}
                      </span>
                    )}
                </div>
              </div>

              <Separator />

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">
                    Boutique
                  </p>
                  <Link
                    href={`/stores/${product.store_slug}`}
                    target="_blank"
                    className="font-medium hover:underline flex items-center gap-1"
                  >
                    {product.store_name}
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </Link>
                </div>
                {product.category_name && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">
                      Catégorie
                    </p>
                    <p className="font-medium">{product.category_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">
                    Stock disponible
                  </p>
                  <p className="font-medium">
                    {product.quantity} unité{product.quantity > 1 ? "s" : ""}
                  </p>
                </div>
                {product.warehouse_qty !== undefined && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">
                      Stock entrepôt
                    </p>
                    <p className="font-medium">
                      {product.warehouse_qty} unité
                      {(product.warehouse_qty ?? 0) > 1 ? "s" : ""}
                    </p>
                  </div>
                )}
                {product.avg_rating !== undefined && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Note</p>
                    <p className="font-medium flex items-center gap-1">
                      <Star className="size-3.5 text-yellow-400 fill-yellow-400" />
                      {product.avg_rating.toFixed(1)}
                      <span className="text-muted-foreground font-normal">
                        ({product.review_count ?? 0} avis)
                      </span>
                    </p>
                  </div>
                )}
                {product.sku && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">SKU</p>
                    <p className="font-mono text-xs font-medium">
                      {product.sku}
                    </p>
                  </div>
                )}
                {product.barcode && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5 flex items-center gap-1">
                      <Barcode className="size-3" />
                      Code-barres
                    </p>
                    <p className="font-mono text-xs font-medium">
                      {product.barcode}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">
                    Ajouté le
                  </p>
                  <p className="font-medium">
                    {formatDate(product._creationTime)}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {product.tags.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-1.5">
                    {product.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs gap-1"
                      >
                        <Tag className="size-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </>
              )}

              {/* Description */}
              {product.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Description
                    </p>
                    <RichTextViewer content={product.description} />
                  </div>
                </>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {product.status === "active" && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/products/${product.slug}`} target="_blank">
                      <ExternalLink className="size-3.5 mr-1.5" />
                      Voir sur la marketplace
                    </Link>
                  </Button>
                )}
                <div className="flex-1" />
                {product.status !== "archived" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onSuspend({
                        _id: product._id,
                        title: product.title,
                        status: product.status,
                      });
                    }}
                  >
                    <Ban className="size-3.5 mr-1.5" />
                    Retirer de la marketplace
                  </Button>
                )}
                {product.status === "archived" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onRestore({
                        _id: product._id,
                        title: product.title,
                      });
                    }}
                  >
                    <RotateCcw className="size-3.5 mr-1.5" />
                    Remettre en ligne
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────

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
  const [previewId, setPreviewId] = useState<Id<"products"> | null>(null);
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
                  <TableRow
                    key={product._id}
                    className="cursor-pointer"
                    onClick={() => setPreviewId(product._id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
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
                          <DropdownMenuItem
                            onClick={() => setPreviewId(product._id)}
                          >
                            <Eye className="size-4 mr-2" />
                            Voir la fiche
                          </DropdownMenuItem>
                          {(product.status !== "archived" ||
                            product.status === "archived") && (
                            <DropdownMenuSeparator />
                          )}
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

      {/* Product preview modal */}
      <ProductPreviewModal
        productId={previewId}
        open={!!previewId}
        onOpenChange={(o) => !o && setPreviewId(null)}
        onSuspend={(p) =>
          setSuspendTarget(products.find((x) => x._id === p._id) ?? null)
        }
        onRestore={(p) =>
          setRestoreTarget(products.find((x) => x._id === p._id) ?? null)
        }
      />

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
              l&apos;état actif et visible sur la marketplace. Le vendeur sera
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
