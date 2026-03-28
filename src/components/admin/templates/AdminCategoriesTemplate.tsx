// filepath: src/components/admin/templates/AdminCategoriesTemplate.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Tag, Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// ─── Types ────────────────────────────────────────────────────

type Category = {
  _id: Id<"categories">;
  name: string;
  slug: string;
  parent_id?: Id<"categories">;
  is_active: boolean;
  sort_order: number;
};

interface Props {
  categories: Category[];
}

// ─── Slug Helper ─────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Category Form Dialog ─────────────────────────────────────

function CategoryFormDialog({
  open,
  onClose,
  category,
  roots,
}: {
  open: boolean;
  onClose: () => void;
  category: Category | null; // null = create mode
  roots: Category[];
}) {
  const create = useMutation(api.admin.mutations.createCategory);
  const update = useMutation(api.admin.mutations.updateCategory);

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [parentId, setParentId] = useState<string>(
    category?.parent_id ?? "none",
  );
  const [sortOrder, setSortOrder] = useState(
    String(category?.sort_order ?? 0),
  );
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = category !== null;

  // Auto-fill slug when creating
  const handleNameChange = (v: string) => {
    setName(v);
    if (!isEdit) setSlug(toSlug(v));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (isEdit) {
        await update({
          id: category._id,
          name: name.trim(),
          slug: slug.trim(),
          sort_order: Number(sortOrder),
          is_active: isActive,
        });
      } else {
        await create({
          name: name.trim(),
          slug: slug.trim(),
          parent_id:
            parentId !== "none"
              ? (parentId as Id<"categories">)
              : undefined,
          sort_order: Number(sortOrder),
          is_active: isActive,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifier les informations de cette catégorie."
              : "Créer une nouvelle catégorie ou sous-catégorie."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nom</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: Électronique"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="electronique"
              className="font-mono text-sm"
            />
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Catégorie parent</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucun (catégorie racine)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun (racine)</SelectItem>
                  {roots.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="cat-order">Ordre d&apos;affichage</Label>
            <Input
              id="cat-order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="cat-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="cat-active">Active</Label>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !slug.trim()}
          >
            {loading ? "Enregistrement…" : isEdit ? "Modifier" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────

function DeleteCategoryDialog({
  category,
  onClose,
}: {
  category: Category | null;
  onClose: () => void;
}) {
  const remove = useMutation(api.admin.mutations.deleteCategory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!category) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await remove({ id: category._id });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={!!category} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer la catégorie</AlertDialogTitle>
          <AlertDialogDescription>
            Supprimer{" "}
            <span className="font-semibold">{category.name}</span> ? Cette
            action est irréversible. Impossible de supprimer une catégorie
            qui contient des produits ou des sous-catégories.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive px-6">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Suppression…" : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Category Row ─────────────────────────────────────────────

function CategoryRow({
  cat,
  isChild,
  onEdit,
  onDelete,
}: {
  cat: Category;
  isChild: boolean;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-2.5 px-3 rounded-md hover:bg-muted/50 group ${isChild ? "ml-6 border-l-2 border-muted pl-4" : ""}`}
    >
      {isChild && (
        <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
      )}
      <span className="flex-1 text-sm font-medium">{cat.name}</span>
      <span className="text-xs text-muted-foreground font-mono hidden sm:block">
        {cat.slug}
      </span>
      <span className="text-xs text-muted-foreground w-8 text-center hidden sm:block">
        {cat.sort_order}
      </span>
      <Badge
        className={
          cat.is_active
            ? "bg-green-100 text-green-700 border-green-300 text-xs"
            : "bg-gray-100 text-gray-500 border-gray-300 text-xs"
        }
      >
        {cat.is_active ? "active" : "inactive"}
      </Badge>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onEdit(cat)}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(cat)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Template ────────────────────────────────────────────

export function AdminCategoriesTemplate({ categories }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const roots = categories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const childrenOf = (id: Id<"categories">) =>
    categories
      .filter((c) => c.parent_id === id)
      .sort((a, b) => a.sort_order - b.sort_order);

  const handleEdit = (cat: Category) => {
    setEditTarget(cat);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Catégories
          </h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} catégorie{categories.length !== 1 ? "s" : ""}{" "}
            — max 2 niveaux de profondeur
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Nouvelle catégorie
        </Button>
      </div>

      {/* Empty state */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <Tag className="size-12 opacity-25" />
          <p className="text-sm">Aucune catégorie</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFormOpen(true)}
          >
            Créer la première
          </Button>
        </div>
      ) : (
        <div className="rounded-md border divide-y">
          {/* Header */}
          <div className="flex items-center gap-3 py-2 px-3 bg-muted/30 text-xs text-muted-foreground font-medium">
            <span className="flex-1">Nom</span>
            <span className="hidden sm:block w-32">Slug</span>
            <span className="hidden sm:block w-8 text-center">Ordre</span>
            <span className="w-16 text-center">Statut</span>
            <span className="w-16" />
          </div>

          {roots.map((root) => (
            <div key={root._id}>
              <div className="px-1 py-0.5">
                <CategoryRow
                  cat={root}
                  isChild={false}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                />
              </div>
              {childrenOf(root._id).map((child) => (
                <div key={child._id} className="px-1 py-0.5">
                  <CategoryRow
                    cat={child}
                    isChild
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <CategoryFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        category={editTarget}
        roots={roots}
      />
      <DeleteCategoryDialog
        category={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
