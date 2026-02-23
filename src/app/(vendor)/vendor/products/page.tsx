// filepath: src/app/(vendor)/vendor/products/page.tsx

"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { ProductListTemplate } from "@/components/products/templates/ProductListTemplate";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { toast } from "sonner";

type StatusFilter = "draft" | "active" | "archived" | "out_of_stock" | "all";

export default function VendorProductsPage() {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // Queries
  const filterArg =
    statusFilter === "all"
      ? {}
      : {
          status: statusFilter as
            | "draft"
            | "active"
            | "archived"
            | "out_of_stock",
        };
  const products = useQuery(api.products.queries.listByStore, filterArg);
  const categories = useQuery(api.categories.queries.list);

  // Mutations
  const duplicateProduct = useMutation(api.products.mutations.duplicate);
  const updateStatus = useMutation(api.products.mutations.updateStatus);
  const removeProduct = useMutation(api.products.mutations.remove);
  const bulkUpdateStatus = useMutation(api.products.mutations.bulkUpdateStatus);
  const bulkDeleteProducts = useMutation(api.products.mutations.bulkDelete);

  // Bulk selection
  const { selectedIds, toggle, toggleAll, clear } = useBulkSelection();
  const allIds = useMemo(() => products?.map((p) => p._id) ?? [], [products]);

  // Category map pour l'import CSV (slug → id)
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    if (categories) {
      for (const cat of categories) {
        map.set(cat.slug, cat._id);
      }
    }
    return map;
  }, [categories]);

  const isLoading = products === undefined;

  // Handlers
  const handleDuplicate = useCallback(
    async (id: string) => {
      try {
        await duplicateProduct({ id: id as Id<"products"> });
        toast.success("Produit dupliqué", {
          description: "La copie a été créée en brouillon.",
        });
      } catch (err) {
        toast.error("Impossible de dupliquer", {
          description: err instanceof Error ? err.message : "Erreur inconnue",
        });
      }
    },
    [duplicateProduct],
  );

  const handleStatusChange = useCallback(
    async (id: string, status: "draft" | "active" | "archived") => {
      try {
        await updateStatus({ id: id as Id<"products">, status });
        toast.success("Statut mis à jour");
      } catch (err) {
        toast.error("Erreur de transition", {
          description: err instanceof Error ? err.message : "Erreur inconnue",
        });
      }
    },
    [updateStatus],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await removeProduct({ id: id as Id<"products"> });
        toast.success("Produit supprimé");
      } catch (err) {
        toast.error("Impossible de supprimer", {
          description: err instanceof Error ? err.message : "Erreur inconnue",
        });
      }
    },
    [removeProduct],
  );

  const handleBulkStatusChange = useCallback(
    async (status: "draft" | "active" | "archived") => {
      setIsBulkLoading(true);
      try {
        const ids = Array.from(selectedIds) as Id<"products">[];
        const result = await bulkUpdateStatus({ ids, status });
        clear();
        const msg = `${result.successCount} produit${result.successCount > 1 ? "s" : ""} mis à jour`;
        const failMsg =
          result.failCount > 0 ? ` — ${result.failCount} échec(s)` : "";
        toast.success("Mise à jour groupée", {
          description: msg + failMsg,
        });
      } catch (err) {
        toast.error("Erreur bulk", {
          description: err instanceof Error ? err.message : "Erreur inconnue",
        });
      } finally {
        setIsBulkLoading(false);
      }
    },
    [selectedIds, bulkUpdateStatus, clear],
  );

  const handleBulkDelete = useCallback(async () => {
    setIsBulkLoading(true);
    try {
      const ids = Array.from(selectedIds) as Id<"products">[];
      const result = await bulkDeleteProducts({ ids });
      clear();
      toast.success("Suppression groupée", {
        description: `${result.deletedCount} produit${result.deletedCount > 1 ? "s" : ""} supprimé${result.deletedCount > 1 ? "s" : ""}`,
      });
    } catch (err) {
      toast.error("Erreur suppression", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      });
    } finally {
      setIsBulkLoading(false);
    }
  }, [selectedIds, bulkDeleteProducts, clear]);

  return (
    <ProductListTemplate
      products={products ?? []}
      isLoading={isLoading}
      selectedIds={selectedIds}
      onToggleSelect={toggle}
      onToggleSelectAll={() => toggleAll(allIds)}
      onClearSelection={clear}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      onNavigateCreate={() => router.push("/vendor/products/new")}
      onNavigateEdit={(id) => router.push(`/vendor/products/${id}/edit`)}
      onDuplicate={handleDuplicate}
      onStatusChange={handleStatusChange}
      onDelete={handleDelete}
      onBulkStatusChange={handleBulkStatusChange}
      onBulkDelete={handleBulkDelete}
      categoryMap={categoryMap}
      isBulkLoading={isBulkLoading}
    />
  );
}
