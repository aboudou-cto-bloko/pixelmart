// filepath: src/components/products/ProductForm.tsx

"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  productFormSchema,
  validateConvexId,
  sanitizeTags,
  formatValidationError,
  type ProductFormData,
} from "@/lib/validation/product";
import { z } from "zod";

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
import { VendorQAManager } from "@/components/questions";
import { VariantEditor, type VariantFormData } from "./VariantEditor";
import { PriceInput } from "./PriceInput";
import { RichTextEditor } from "./RichTextEditor";

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
  imageRoles: string[];
  price: number | undefined;
  comparePrice: number | undefined;
  costPrice: number | undefined;
  sku: string;
  barcode: string;
  trackInventory: boolean;
  quantity: number;
  lowStockThreshold: number;
  weight: number | undefined;
  color: string;
  material: string;
  dimensions: string;
  isDigital: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  variants: VariantFormData[];
  specs: { id: string; spec_key: string; spec_value: string }[];
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  shortDescription: "",
  categoryId: "",
  tags: "",
  images: [],
  imageUrls: [],
  imageRoles: [],
  price: undefined,
  comparePrice: undefined,
  costPrice: undefined,
  sku: "",
  barcode: "",
  trackInventory: true,
  quantity: 0,
  lowStockThreshold: 5,
  weight: undefined,
  color: "",
  material: "",
  dimensions: "",
  isDigital: false,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  variants: [],
  specs: [{ id: crypto.randomUUID(), spec_key: "", spec_value: "" }],
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
  const createVariant = useMutation(api.variants.mutations.create);
  const createSpecs = useMutation(api.product_specs.mutations.createMany);

  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const lastSubmissionTime = useRef<number>(0);

  // ---- Updater typé ----
  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev: FormState) => ({ ...prev, [key]: value }));
  }

  // ---- Submit ----
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Rate limiting: prevent rapid submissions
    const now = Date.now();
    if (now - lastSubmissionTime.current < 2000) {
      // 2 second cooldown
      setError("Veuillez attendre avant de soumettre à nouveau");
      return;
    }
    lastSubmissionTime.current = now;

    setIsSubmitting(true);

    try {
      // Client-side validation with sanitization
      const validatedData = productFormSchema.parse({
        title: form.title,
        description: form.description,
        shortDescription: form.shortDescription,
        categoryId: form.categoryId,
        tags: form.tags,
        price: form.price ?? 0,
        comparePrice: form.comparePrice,
        costPrice: form.costPrice,
        sku: form.sku,
        barcode: form.barcode,
        quantity: form.quantity,
        lowStockThreshold: form.lowStockThreshold,
        weight: form.weight,
        color: form.color,
        material: form.material,
        dimensions: form.dimensions,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        seoKeywords: form.seoKeywords,
        images: form.images,
      });

      // Validate category ID safely
      const categoryId = validateConvexId(
        validatedData.categoryId,
        "categories",
      ) as Id<"categories">;
      if (mode === "create") {
        const result = await createProduct({
          title: validatedData.title,
          description: validatedData.description,
          short_description: validatedData.shortDescription,
          category_id: categoryId,
          tags: validatedData.tags,
          images: validatedData.images,
          image_roles: form.imageRoles.length > 0 ? form.imageRoles : undefined,
          price: validatedData.price,
          compare_price: validatedData.comparePrice,
          cost_price: validatedData.costPrice,
          sku: validatedData.sku,
          barcode: validatedData.barcode,
          track_inventory: form.trackInventory,
          quantity: validatedData.quantity,
          low_stock_threshold: validatedData.lowStockThreshold,
          weight: validatedData.weight,
          color: validatedData.color,
          material: validatedData.material,
          dimensions: validatedData.dimensions,
          is_digital: form.isDigital,
          seo_title: validatedData.seoTitle,
          seo_description: validatedData.seoDescription,
          seo_keywords: validatedData.seoKeywords,
        });

        // Save variants after product creation
        if (result && form.variants.length > 0) {
          for (const variant of form.variants) {
            if (variant.title && variant.options.length > 0) {
              await createVariant({
                product_id: result.productId as Id<"products">,
                title: variant.title,
                options: variant.options,
                price: variant.price,
                quantity: variant.quantity,
                is_available: variant.is_available,
                sku: variant.sku || undefined,
              });
            }
          }
        }

        // Save specs after product creation
        if (result && form.specs.length > 0) {
          await createSpecs({
            product_id: result.productId as Id<"products">,
            specs: form.specs.map((s) => ({
              spec_key: s.spec_key,
              spec_value: s.spec_value,
            })),
          });
        }

        router.push("/vendor/products");
      } else if (productId) {
        await updateProduct({
          id: productId,
          title: validatedData.title,
          description: validatedData.description,
          short_description: validatedData.shortDescription,
          category_id: categoryId,
          tags: validatedData.tags,
          images: validatedData.images,
          image_roles: form.imageRoles.length > 0 ? form.imageRoles : undefined,
          price: validatedData.price,
          compare_price: validatedData.comparePrice,
          cost_price: validatedData.costPrice,
          sku: validatedData.sku,
          barcode: validatedData.barcode,
          track_inventory: form.trackInventory,
          quantity: validatedData.quantity,
          low_stock_threshold: validatedData.lowStockThreshold,
          weight: validatedData.weight,
          color: validatedData.color,
          material: validatedData.material,
          dimensions: validatedData.dimensions,
          is_digital: form.isDigital,
          seo_title: validatedData.seoTitle,
          seo_description: validatedData.seoDescription,
          seo_keywords: validatedData.seoKeywords,
        });

        // Save specs after product update
        if (form.specs.length > 0) {
          await createSpecs({
            product_id: productId,
            specs: form.specs.map((s) => ({
              spec_key: s.spec_key,
              spec_value: s.spec_value,
            })),
          });
        }

        router.push("/vendor/products");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Handle validation errors
        const newFieldErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          if (field && !newFieldErrors[field]) {
            newFieldErrors[field] = issue.message;
          }
        });
        setFieldErrors(newFieldErrors);
        setError(formatValidationError(err));
      } else if (err instanceof Error) {
        // Generic error for security - don't expose sensitive details
        const message = err.message;
        if (
          message.includes("prix") ||
          message.includes("image") ||
          message.includes("catégorie")
        ) {
          setError(message); // Safe business logic errors
        } else {
          setError(
            "Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.",
          );
        }
      } else {
        setError("Une erreur inattendue est survenue. Veuillez réessayer.");
      }
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
          <TabsTrigger value="specs">Caractéristiques</TabsTrigger>
          <TabsTrigger value="variants">Variantes</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          {mode === "edit" && productId && (
            <TabsTrigger value="qa">Q&R</TabsTrigger>
          )}
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
                  onChange={(e) => {
                    updateField("title", e.target.value);
                    if (fieldErrors.title) {
                      setFieldErrors((prev) => ({ ...prev, title: "" }));
                    }
                  }}
                  placeholder="Robe wax Ankara"
                  required
                  className={fieldErrors.title ? "border-destructive" : ""}
                />
                {fieldErrors.title && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <RichTextEditor
                  value={form.description}
                  onChange={(value) => {
                    updateField("description", value);
                    if (fieldErrors.description) {
                      setFieldErrors((prev) => ({ ...prev, description: "" }));
                    }
                  }}
                  placeholder="Décrivez votre produit..."
                />
                {fieldErrors.description && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.description}
                  </p>
                )}
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
                imageRoles={form.imageRoles}
                onChange={(imgs, roles) => {
                  setForm((prev) => ({
                    ...prev,
                    images: imgs,
                    imageRoles: roles,
                  }));
                }}
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
              <div>
                <PriceInput
                  id="price"
                  label="Prix de vente"
                  value={form.price}
                  onChange={(val) => {
                    updateField("price", val);
                    if (fieldErrors.price) {
                      setFieldErrors((prev) => ({ ...prev, price: "" }));
                    }
                  }}
                  required
                />
                {fieldErrors.price && (
                  <p className="text-sm text-destructive mt-1">
                    {fieldErrors.price}
                  </p>
                )}
              </div>
              <div>
                <PriceInput
                  id="compare_price"
                  label="Prix barré"
                  value={form.comparePrice}
                  onChange={(val) => {
                    updateField("comparePrice", val);
                    if (fieldErrors.comparePrice) {
                      setFieldErrors((prev) => ({ ...prev, comparePrice: "" }));
                    }
                  }}
                />
                {fieldErrors.comparePrice && (
                  <p className="text-sm text-destructive mt-1">
                    {fieldErrors.comparePrice}
                  </p>
                )}
              </div>
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

        {/* TAB: Specs */}
        <TabsContent value="specs">
          <Card>
            <CardHeader>
              <CardTitle>Caractéristiques personnalisées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.specs.map((spec) => (
                <div key={spec.id} className="flex gap-2 items-start">
                  <Input
                    placeholder="Caractéristique (ex: Matériau)"
                    value={spec.spec_key}
                    onChange={(e) => {
                      const newSpecs = form.specs.map((s) =>
                        s.id === spec.id
                          ? { ...s, spec_key: e.target.value }
                          : s,
                      );
                      updateField("specs", newSpecs);
                    }}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Valeur (ex: Coton)"
                    value={spec.spec_value}
                    onChange={(e) => {
                      const newSpecs = form.specs.map((s) =>
                        s.id === spec.id
                          ? { ...s, spec_value: e.target.value }
                          : s,
                      );
                      updateField("specs", newSpecs);
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newSpecs = form.specs.filter(
                        (s) => s.id !== spec.id,
                      );
                      updateField("specs", newSpecs);
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  updateField("specs", [
                    ...form.specs,
                    { id: crypto.randomUUID(), spec_key: "", spec_value: "" },
                  ]);
                }}
              >
                + Ajouter une caractéristique
              </Button>
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
              <div className="space-y-2">
                <Label htmlFor="seo_keywords">Mots-clés (backend)</Label>
                <Input
                  id="seo_keywords"
                  value={form.seoKeywords}
                  onChange={(e) => updateField("seoKeywords", e.target.value)}
                  placeholder="basket sport, chaussures homme, running..."
                  maxLength={255}
                />
                <p className="text-xs text-muted-foreground">
                  Séparés par des virgules · Jamais affichés aux clients ·{" "}
                  {form.seoKeywords.length}/255
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* TAB: Q&A — edit mode only */}
        {mode === "edit" && productId && (
          <TabsContent value="qa">
            <Card>
              <CardHeader>
                <CardTitle>Questions & Réponses</CardTitle>
              </CardHeader>
              <CardContent>
                <VendorQAManager productId={productId as Id<"products">} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
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

  const existingSpecs = useQuery(
    api.product_specs.queries.listByProduct,
    mode === "edit" && productId ? { product_id: productId } : "skip",
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
          imageRoles: existingProduct.image_roles ?? [],
          price: existingProduct.price,
          comparePrice: existingProduct.compare_price,
          costPrice: existingProduct.cost_price,
          sku: existingProduct.sku ?? "",
          barcode: existingProduct.barcode ?? "",
          trackInventory: existingProduct.track_inventory,
          quantity: existingProduct.quantity,
          lowStockThreshold: existingProduct.low_stock_threshold,
          weight: existingProduct.weight,
          color: existingProduct.color ?? "",
          material: existingProduct.material ?? "",
          dimensions: existingProduct.dimensions ?? "",
          isDigital: existingProduct.is_digital,
          seoTitle: existingProduct.seo_title ?? "",
          seoDescription: existingProduct.seo_description ?? "",
          seoKeywords: existingProduct.seo_keywords ?? "",
          variants: [],
          specs:
            existingSpecs?.map((s) => ({
              id: s._id,
              spec_key: s.spec_key,
              spec_value: s.spec_value,
            })) ?? [],
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
