// filepath: src/components/products/templates/ProductListTemplate.tsx

"use client";

import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductListTable } from "../organisms/ProductListTable";
import { BulkActionBar } from "../molecules/BulkActionBar";
import { DuplicateDialog } from "../organisms/DuplicateDialog";
import { CsvImportDialog } from "../organisms/CsvImportDialog";
import type { Id } from "../../../../convex/_generated/dataModel";

type ProductStatus = "draft" | "active" | "archived" | "out_of_stock";
type StatusFilter = ProductStatus | "all";

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

interface ProductListTemplateProps {
  products: ProductRow[];
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  onNavigateCreate: () => void;
  onNavigateEdit: (id: string) => void;
  onDuplicate: (id: string) => Promise<void>;
  onStatusChange: (
    id: string,
    status: "draft" | "active" | "archived",
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBulkStatusChange: (
    status: "draft" | "active" | "archived",
  ) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  categoryMap: Map<string, string>;
  currency?: string;
  isBulkLoading?: boolean;
}

export function ProductListTemplate({
  products,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onClearSelection,
  statusFilter,
  onStatusFilterChange,
  onNavigateCreate,
  onNavigateEdit,
  onDuplicate,
  onStatusChange,
  onDelete,
  onBulkStatusChange,
  onBulkDelete,
  categoryMap,
  currency = "XOF",
  isBulkLoading,
}: ProductListTemplateProps) {
  const [duplicateTarget, setDuplicateTarget] = useState<ProductRow | null>(
    null,
  );
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const handleDuplicate = async (id: string) => {
    const product = products.find((p) => p._id === id);
    if (product) setDuplicateTarget(product);
  };

  const confirmDuplicate = async () => {
    if (!duplicateTarget) return;
    setIsDuplicating(true);
    try {
      await onDuplicate(duplicateTarget._id);
    } finally {
      setIsDuplicating(false);
      setDuplicateTarget(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer ce produit définitivement ?")) {
      await onDelete(id);
    }
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Supprimer ${selectedIds.size} produit${selectedIds.size > 1 ? "s" : ""} définitivement ?`,
      )
    ) {
      await onBulkDelete();
    }
  };

  const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: "Tous" },
    { value: "active", label: "Actifs" },
    { value: "draft", label: "Brouillons" },
    { value: "archived", label: "Archivés" },
    { value: "out_of_stock", label: "Rupture" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Produits
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez votre catalogue de produits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImport(true)}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Importer CSV
          </Button>
          <Button size="sm" onClick={onNavigateCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Status filter tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}
      >
        <TabsList className="h-9">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-xs sm:text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      <ProductListTable
        products={products}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={onToggleSelectAll}
        onEdit={onNavigateEdit}
        onDuplicate={handleDuplicate}
        onStatusChange={(id, status) => onStatusChange(id, status)}
        onDelete={handleDelete}
        currency={currency}
        isLoading={isLoading}
      />

      {/* Bulk Action Bar (flottante en bas) */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalCount={products.length}
        onActivate={() => onBulkStatusChange("active")}
        onDraft={() => onBulkStatusChange("draft")}
        onArchive={() => onBulkStatusChange("archived")}
        onDelete={handleBulkDelete}
        onClearSelection={onClearSelection}
        isLoading={isBulkLoading}
      />

      {/* Dialogs */}
      <DuplicateDialog
        open={!!duplicateTarget}
        productTitle={duplicateTarget?.title ?? ""}
        onConfirm={confirmDuplicate}
        onCancel={() => setDuplicateTarget(null)}
        isLoading={isDuplicating}
      />

      <CsvImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        categoryMap={categoryMap}
      />
    </div>
  );
}
