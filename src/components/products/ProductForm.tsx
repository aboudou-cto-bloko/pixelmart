"use client";

import { useState, useEffect } from "react";
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

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: Id<"products">;
}

export function ProductForm({ mode, productId }: ProductFormProps) {
  const router = useRouter();
  const categories = useQuery(api.categories.queries.listActive);

  // Mutations
  const createProduct = useMutation(api.products.mutations.create);
  const updateProduct = useMutation(api.products.mutations.update);

  // Load existing product for edit mode
  const existingProduct = useQuery(
    api.products.queries.getById,
    productId ? { id: productId } : "skip",
  );

  // ---- Form State ----
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [comparePrice, setComparePrice] = useState<number | undefined>(
    undefined,
  );
  const [costPrice, setCostPrice] = useState<number | undefined>(undefined);
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [trackInventory, setTrackInventory] = useState(true);
  const [quantity, setQuantity] = useState(0);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [isDigital, setIsDigital] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [variants, setVariants] = useState<VariantFormData[]>([]);

  // ---- Hydrate form for edit mode ----
  useEffect(() => {
    if (mode === "edit" && existingProduct) {
      setTitle(existingProduct.title);
      setDescription(existingProduct.description);
      setShortDescription(existingProduct.short_description ?? "");
      setCategoryId(existingProduct.category_id);
      setTags(existingProduct.tags.join(", "));
      setImages(existingProduct.images);
      setImageUrls(existingProduct.imageUrls);
      setPrice(existingProduct.price);
      setComparePrice(existingProduct.compare_price);
      setCostPrice(existingProduct.cost_price);
      setSku(existingProduct.sku ?? "");
      setBarcode(existingProduct.barcode ?? "");
      setTrackInventory(existingProduct.track_inventory);
      setQuantity(existingProduct.quantity);
      setLowStockThreshold(existingProduct.low_stock_threshold);
      setWeight(existingProduct.weight);
      setIsDigital(existingProduct.is_digital);
      setSeoTitle(existingProduct.seo_title ?? "");
      setSeoDescription(existingProduct.seo_description ?? "");
    }
  }, [mode, existingProduct]);

  // ---- Submit ----
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (mode === "create") {
        const { productId: newId, slug } = await createProduct({
          title,
          description,
          short_description: shortDescription || undefined,
          category_id: categoryId as Id<"categories">,
          tags: parsedTags,
          images,
          price: price ?? 0,
          compare_price: comparePrice,
          cost_price: costPrice,
          sku: sku || undefined,
          barcode: barcode || undefined,
          track_inventory: trackInventory,
          quantity,
          low_stock_threshold: lowStockThreshold,
          weight,
          is_digital: isDigital,
          seo_title: seoTitle || undefined,
          seo_description: seoDescription || undefined,
        });

        router.push("/vendor/products");
      } else if (productId) {
        await updateProduct({
          id: productId,
          title,
          description,
          short_description: shortDescription || undefined,
          category_id: categoryId as Id<"categories">,
          tags: parsedTags,
          images,
          price,
          compare_price: comparePrice,
          cost_price: costPrice,
          sku: sku || undefined,
          barcode: barcode || undefined,
          track_inventory: trackInventory,
          quantity,
          low_stock_threshold: lowStockThreshold,
          weight,
          is_digital: isDigital,
          seo_title: seoTitle || undefined,
          seo_description: seoDescription || undefined,
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

  if (mode === "edit" && !existingProduct) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre produit..."
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Description courte</Label>
                <Input
                  id="short_description"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Résumé en une phrase"
                  maxLength={160}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Catégorie <span className="text-destructive">*</span>
                  </Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
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
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="mode, africain, wax"
                  />
                  <p className="text-xs text-muted-foreground">
                    Séparés par des virgules
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t pt-4">
                <Switch checked={isDigital} onCheckedChange={setIsDigital} />
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
                images={images}
                imageUrls={imageUrls}
                onChange={setImages}
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
                value={price}
                onChange={setPrice}
                required
              />
              <PriceInput
                id="compare_price"
                label="Prix barré"
                value={comparePrice}
                onChange={setComparePrice}
              />
              <PriceInput
                id="cost_price"
                label="Prix d'achat"
                value={costPrice}
                onChange={setCostPrice}
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
                  checked={trackInventory}
                  onCheckedChange={setTrackInventory}
                />
                <Label>Suivre le stock</Label>
              </div>

              {trackInventory && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantité en stock</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="low_stock">Seuil d&apos;alerte</Label>
                    <Input
                      id="low_stock"
                      type="number"
                      min="0"
                      value={lowStockThreshold}
                      onChange={(e) =>
                        setLowStockThreshold(parseInt(e.target.value) || 5)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
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
                  value={weight ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setWeight(val === "" ? undefined : parseInt(val));
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
              <VariantEditor variants={variants} onChange={setVariants} />
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
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title || "Titre du produit"}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  {seoTitle.length}/60
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo_description">Meta description</Label>
                <Textarea
                  id="seo_description"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Description pour les moteurs de recherche..."
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {seoDescription.length}/160
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
