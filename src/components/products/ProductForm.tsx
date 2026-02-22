// filepath: src/components/products/ProductForm.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { ProductImageUpload } from "./ProductImageUpload";
import { VariantEditor, type VariantFormData } from "./VariantEditor";
import { PriceInput } from "./PriceInput";

// ---- Types ----
interface ProductFormProps {
  mode: "create" | "edit";
  productId?: Id<"products">;
}

interface FormState {
  title: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  tags: string;
  images: string[];
  imageUrls: string[];
  price: number | undefined;
  comparePrice: number | undefined;
  costPrice: number | undefined;
  sku: string;
  barcode: string;
  trackInventory: boolean;
  quantity: number;
  lowStockThreshold: number;
  weight: number | undefined;
  isDigital: boolean;
  seoTitle: string;
  seoDescription: string;
  variants: VariantFormData[];
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  shortDescription: "",
  categoryId: "",
  tags: "",
  images: [],
  imageUrls: [],
  price: undefined,
  comparePrice: undefined,
  costPrice: undefined,
  sku: "",
  barcode: "",
  trackInventory: true,
  quantity: 0,
  lowStockThreshold: 5,
  weight: undefined,
  isDigital: false,
  seoTitle: "",
  seoDescription: "",
  variants: [],
};

// ---- Inner form (rendu seulement quand les données sont prêtes) ----
function ProductFormInner({
  mode,
  productId,
  initialState,
}: {
  mode: "create" | "edit";
  productId?: Id<"products">;
  initialState: FormState;
}) {
  const router = useRouter();
  const categories = useQuery(api.categories.queries.listActive);
  const createProduct = useMutation(api.products.mutations.create);
  const updateProduct = useMutation(api.products.mutations.update);

  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Updater typé ----
  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev: FormState) => ({ ...prev, [key]: value }));
  }

  // ---- Submit ----
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const parsedTags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (mode === "create") {
        await createProduct({
          title: form.title,
          description: form.description,
          short_description: form.shortDescription || undefined,
          category_id: form.categoryId as Id<"categories">,
          tags: parsedTags,
          images: form.images,
          price: form.price ?? 0,
          compare_price: form.comparePrice,
          cost_price: form.costPrice,
          sku: form.sku || undefined,
          barcode: form.barcode || undefined,
          track_inventory: form.trackInventory,
          quantity: form.quantity,
          low_stock_threshold: form.lowStockThreshold,
          weight: form.weight,
          is_digital: form.isDigital,
          seo_title: form.seoTitle || undefined,
          seo_description: form.seoDescription || undefined,
        });
        router.push("/vendor/products");
      } else if (productId) {
        await updateProduct({
          id: productId,
          title: form.title,
          description: form.description,
          short_description: form.shortDescription || undefined,
          category_id: form.categoryId as Id<"categories">,
          tags: parsedTags,
          images: form.images,
          price: form.price,
          compare_price: form.comparePrice,
          cost_price: form.costPrice,
          sku: form.sku || undefined,
          barcode: form.barcode || undefined,
          track_inventory: form.trackInventory,
          quantity: form.quantity,
          low_stock_threshold: form.lowStockThreshold,
          weight: form.weight,
          is_digital: form.isDigital,
          seo_title: form.seoTitle || undefined,
          seo_description: form.seoDescription || undefined,
        });
        router.push("/vendor/products");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="media">Médias</TabsTrigger>
          <TabsTrigger value="pricing">Prix & Stock</TabsTrigger>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* TAB: General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations produit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Titre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Robe wax Ankara"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Décrivez votre produit..."
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Description courte</Label>
                <Input
                  id="short_description"
                  value={form.shortDescription}
                  onChange={(e) =>
                    updateField("shortDescription", e.target.value)
                  }
                  placeholder="Résumé en une phrase"
                  maxLength={160}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Catégorie <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(val) => updateField("categoryId", val)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={form.tags}
                    onChange={(e) => updateField("tags", e.target.value)}
                    placeholder="mode, africain, wax"
                  />
                  <p className="text-xs text-muted-foreground">
                    Séparés par des virgules
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t pt-4">
                <Switch
                  checked={form.isDigital}
                  onCheckedChange={(val) => updateField("isDigital", val)}
                />
                <Label>Produit digital (ebook, template...)</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Media */}
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Photos du produit</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImageUpload
                images={form.images}
                imageUrls={form.imageUrls}
                onChange={(imgs) => updateField("images", imgs)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Pricing & Stock */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prix</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <PriceInput
                id="price"
                label="Prix de vente"
                value={form.price}
                onChange={(val) => updateField("price", val)}
                required
              />
              <PriceInput
                id="compare_price"
                label="Prix barré"
                value={form.comparePrice}
                onChange={(val) => updateField("comparePrice", val)}
              />
              <PriceInput
                id="cost_price"
                label="Prix d'achat"
                value={form.costPrice}
                onChange={(val) => updateField("costPrice", val)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.trackInventory}
                  onCheckedChange={(val) => updateField("trackInventory", val)}
                />
                <Label>Suivre le stock</Label>
              </div>

              {form.trackInventory && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantité en stock</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={form.quantity}
                      onChange={(e) =>
                        updateField("quantity", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="low_stock">Seuil d&apos;alerte</Label>
                    <Input
                      id="low_stock"
                      type="number"
                      min="0"
                      value={form.lowStockThreshold}
                      onChange={(e) =>
                        updateField(
                          "lowStockThreshold",
                          parseInt(e.target.value) || 5,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={form.sku}
                      onChange={(e) => updateField("sku", e.target.value)}
                      placeholder="SKU-001"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="weight">Poids (grammes)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  value={form.weight ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateField(
                      "weight",
                      val === "" ? undefined : parseInt(val),
                    );
                  }}
                  placeholder="250"
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Variants */}
        <TabsContent value="variants">
          <Card>
            <CardHeader>
              <CardTitle>Variantes du produit</CardTitle>
            </CardHeader>
            <CardContent>
              <VariantEditor
                variants={form.variants}
                onChange={(val) => updateField("variants", val)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: SEO */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>Optimisation moteurs de recherche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">Titre SEO</Label>
                <Input
                  id="seo_title"
                  value={form.seoTitle}
                  onChange={(e) => updateField("seoTitle", e.target.value)}
                  placeholder={form.title || "Titre du produit"}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  {form.seoTitle.length}/60
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo_description">Meta description</Label>
                <Textarea
                  id="seo_description"
                  value={form.seoDescription}
                  onChange={(e) =>
                    updateField("seoDescription", e.target.value)
                  }
                  placeholder="Description pour les moteurs de recherche..."
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {form.seoDescription.length}/160
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/vendor/products")}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === "create" ? "Créer le brouillon" : "Enregistrer"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ---- Composant public : gère le loading et prépare l'initialState ----
export function ProductForm({ mode, productId }: ProductFormProps) {
  const existingProduct = useQuery(
    api.products.queries.getById,
    mode === "edit" && productId ? { id: productId } : "skip",
  );

  // En mode edit, attendre le chargement du produit
  if (mode === "edit" && !existingProduct) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Construire l'état initial UNE SEULE FOIS avant le premier rendu du form
  const initialState: FormState =
    mode === "edit" && existingProduct
      ? {
          title: existingProduct.title,
          description: existingProduct.description,
          shortDescription: existingProduct.short_description ?? "",
          categoryId: existingProduct.category_id,
          tags: existingProduct.tags.join(", "),
          images: existingProduct.images,
          imageUrls: existingProduct.imageUrls,
          price: existingProduct.price,
          comparePrice: existingProduct.compare_price,
          costPrice: existingProduct.cost_price,
          sku: existingProduct.sku ?? "",
          barcode: existingProduct.barcode ?? "",
          trackInventory: existingProduct.track_inventory,
          quantity: existingProduct.quantity,
          lowStockThreshold: existingProduct.low_stock_threshold,
          weight: existingProduct.weight,
          isDigital: existingProduct.is_digital,
          seoTitle: existingProduct.seo_title ?? "",
          seoDescription: existingProduct.seo_description ?? "",
          variants: [],
        }
      : EMPTY_FORM;

  // key force le remount si on change de produit
  return (
    <ProductFormInner
      key={productId ?? "create"}
      mode={mode}
      productId={productId}
      initialState={initialState}
    />
  );
}
