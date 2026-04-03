"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PriceInput } from "./PriceInput";
import { Plus, Trash2, ArrowLeftRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export interface VariantFormData {
  id?: string; // undefined = new, string = existing
  title: string;
  options: { name: string; value: string }[];
  price: number | undefined;
  sku: string;
  quantity: number;
  is_available: boolean;
}

interface VariantEditorProps {
  variants: VariantFormData[];
  onChange: (variants: VariantFormData[]) => void;
  onRemoveExisting?: (id: string) => void;
  currency?: string;
  /** ID du produit en base (mode édition uniquement) */
  productId?: Id<"products">;
  /** Stock actuel du produit (pour affichage + transfert) */
  productStock?: number;
  /** Callback pour rafraîchir le stock produit après transfert */
  onProductStockChange?: (newStock: number) => void;
}

const EMPTY_VARIANT: VariantFormData = {
  title: "",
  options: [{ name: "", value: "" }],
  price: undefined,
  sku: "",
  quantity: 0,
  is_available: true,
};

export function VariantEditor({
  variants,
  onChange,
  onRemoveExisting,
  currency = "XOF",
  productId,
  productStock,
  onProductStockChange,
}: VariantEditorProps) {
  const transferFromProduct = useMutation(
    api.variants.mutations.transferFromProduct,
  );
  const transferToProduct = useMutation(
    api.variants.mutations.transferToProduct,
  );
  const [transferQtys, setTransferQtys] = useState<Record<number, string>>({});
  const [transferLoading, setTransferLoading] = useState<
    Record<number, boolean>
  >({});

  async function handleTransferToVariant(
    variantIndex: number,
    variantDbId: string,
  ) {
    const qty = parseInt(transferQtys[variantIndex] || "0");
    if (!qty || qty <= 0) return;
    setTransferLoading((p) => ({ ...p, [variantIndex]: true }));
    try {
      const result = await transferFromProduct({
        variantId: variantDbId as Id<"product_variants">,
        quantity: qty,
      });
      onProductStockChange?.(result.productQuantity);
      // Met à jour la quantité de la variante dans le form
      updateVariant(variantIndex, { quantity: result.variantQuantity });
      setTransferQtys((p) => ({ ...p, [variantIndex]: "" }));
      toast.success(
        `${qty} unité${qty > 1 ? "s" : ""} transférée${qty > 1 ? "s" : ""} vers la variante`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de transfert");
    } finally {
      setTransferLoading((p) => ({ ...p, [variantIndex]: false }));
    }
  }

  async function handleTransferToProduct(
    variantIndex: number,
    variantDbId: string,
  ) {
    const qty = parseInt(transferQtys[variantIndex] || "0");
    if (!qty || qty <= 0) return;
    setTransferLoading((p) => ({ ...p, [variantIndex]: true }));
    try {
      const result = await transferToProduct({
        variantId: variantDbId as Id<"product_variants">,
        quantity: qty,
      });
      onProductStockChange?.(result.productQuantity);
      updateVariant(variantIndex, { quantity: result.variantQuantity });
      setTransferQtys((p) => ({ ...p, [variantIndex]: "" }));
      toast.success(
        `${qty} unité${qty > 1 ? "s" : ""} transférée${qty > 1 ? "s" : ""} vers le stock produit`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de transfert");
    } finally {
      setTransferLoading((p) => ({ ...p, [variantIndex]: false }));
    }
  }

  function addVariant() {
    onChange([
      ...variants,
      { ...EMPTY_VARIANT, options: [{ name: "", value: "" }] },
    ]);
  }

  function removeVariant(index: number) {
    const variant = variants[index];
    if (variant.id && onRemoveExisting) {
      onRemoveExisting(variant.id);
    }
    onChange(variants.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, partial: Partial<VariantFormData>) {
    const updated = variants.map((v, i) =>
      i === index ? { ...v, ...partial } : v,
    );
    onChange(updated);
  }

  function addOption(variantIndex: number) {
    const variant = variants[variantIndex];
    updateVariant(variantIndex, {
      options: [...variant.options, { name: "", value: "" }],
    });
  }

  function updateOption(
    variantIndex: number,
    optionIndex: number,
    field: "name" | "value",
    value: string,
  ) {
    const variant = variants[variantIndex];
    const options = variant.options.map((opt, i) =>
      i === optionIndex ? { ...opt, [field]: value } : opt,
    );

    // Auto-générer le titre
    const title = options
      .filter((o) => o.value)
      .map((o) => o.value)
      .join(" / ");

    updateVariant(variantIndex, { options, title });
  }

  function removeOption(variantIndex: number, optionIndex: number) {
    const variant = variants[variantIndex];
    if (variant.options.length <= 1) return;
    const options = variant.options.filter((_, i) => i !== optionIndex);
    const title = options
      .filter((o) => o.value)
      .map((o) => o.value)
      .join(" / ");
    updateVariant(variantIndex, { options, title });
  }

  return (
    <div className="space-y-4">
      {/* Bandeau stock produit (mode édition) */}
      {productId !== undefined && productStock !== undefined && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
          <ArrowLeftRight className="size-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            Stock produit standard :
          </span>
          <span className="font-semibold">
            {productStock} unité{productStock !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Variantes</p>
          <p className="text-xs text-muted-foreground">
            Taille, couleur, matériau...
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addVariant}>
          <Plus className="mr-2 h-3 w-3" />
          Ajouter
        </Button>
      </div>

      {variants.map((variant, vIndex) => (
        <Card key={vIndex}>
          <CardContent className="space-y-4 pt-4">
            {/* Options */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Options</Label>
              {variant.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex gap-2">
                  <Input
                    placeholder="Nom (ex: Couleur)"
                    value={opt.name}
                    onChange={(e) =>
                      updateOption(vIndex, oIndex, "name", e.target.value)
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="Valeur (ex: Rouge)"
                    value={opt.value}
                    onChange={(e) =>
                      updateOption(vIndex, oIndex, "value", e.target.value)
                    }
                    className="flex-1"
                  />
                  {variant.options.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(vIndex, oIndex)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addOption(vIndex)}
                className="text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                Ajouter une option
              </Button>
            </div>

            {/* Title auto-generated */}
            <div className="text-xs text-muted-foreground">
              Titre :{" "}
              <span className="font-medium text-foreground">
                {variant.title || "—"}
              </span>
            </div>

            {/* Price, SKU, Stock, Available */}
            <div className="grid gap-3 sm:grid-cols-3">
              <PriceInput
                id={`variant-price-${vIndex}`}
                label="Prix (override)"
                value={variant.price}
                onChange={(price) => updateVariant(vIndex, { price })}
                currency={currency}
              />
              <div className="space-y-2">
                <Label htmlFor={`variant-sku-${vIndex}`}>SKU</Label>
                <Input
                  id={`variant-sku-${vIndex}`}
                  value={variant.sku}
                  onChange={(e) =>
                    updateVariant(vIndex, { sku: e.target.value })
                  }
                  placeholder="SKU-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`variant-qty-${vIndex}`}>Stock</Label>
                <Input
                  id={`variant-qty-${vIndex}`}
                  type="number"
                  min="0"
                  value={variant.quantity}
                  onChange={(e) =>
                    updateVariant(vIndex, {
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            {/* Toggle + Delete */}
            <div className="flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={variant.is_available}
                  onCheckedChange={(checked) =>
                    updateVariant(vIndex, { is_available: checked })
                  }
                />
                <Label className="text-sm">Disponible</Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeVariant(vIndex)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Supprimer
              </Button>
            </div>

            {/* Transfert de stock — uniquement pour les variantes déjà en DB */}
            {productId && variant.id && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <ArrowLeftRight className="size-3" />
                  Transfert de stock
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qté"
                    value={transferQtys[vIndex] || ""}
                    onChange={(e) =>
                      setTransferQtys((p) => ({
                        ...p,
                        [vIndex]: e.target.value,
                      }))
                    }
                    className="w-20 h-8 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={transferLoading[vIndex] || !transferQtys[vIndex]}
                    onClick={() => handleTransferToVariant(vIndex, variant.id!)}
                    title="Transférer du stock produit vers cette variante"
                  >
                    Produit → Variante
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={transferLoading[vIndex] || !transferQtys[vIndex]}
                    onClick={() => handleTransferToProduct(vIndex, variant.id!)}
                    title="Transférer du stock de cette variante vers le produit"
                  >
                    Variante → Produit
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {variants.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Pas de variantes — le produit sera vendu tel quel.
          </p>
        </div>
      )}
    </div>
  );
}
