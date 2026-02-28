// filepath: src/components/returns/ReturnRequestForm.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowLeft, Loader2, Package } from "lucide-react";
import { formatPrice } from "@/lib/format";

const REASON_CATEGORIES = [
  { value: "defective", label: "Produit défectueux" },
  { value: "wrong_item", label: "Mauvais article reçu" },
  { value: "not_as_described", label: "Non conforme à la description" },
  { value: "changed_mind", label: "Changement d'avis" },
  { value: "damaged_in_transit", label: "Endommagé pendant le transport" },
  { value: "other", label: "Autre raison" },
] as const;

interface OrderItem {
  product_id: Id<"products">;
  variant_id?: Id<"product_variants">;
  title: string;
  quantity: number;
  unit_price: number;
  image_url?: string;
}

interface ReturnRequestFormProps {
  orderId: Id<"orders">;
  orderNumber: string;
  orderItems: OrderItem[];
  currency: string;
}

export function ReturnRequestForm({
  orderId,
  orderNumber,
  orderItems,
  currency,
}: ReturnRequestFormProps) {
  const router = useRouter();
  const requestReturn = useMutation(api.returns.mutations.requestReturn);

  const [selectedItems, setSelectedItems] = useState<
    Map<
      string,
      {
        productId: Id<"products">;
        variantId?: Id<"product_variants">;
        quantity: number;
      }
    >
  >(new Map());
  const [reasonCategory, setReasonCategory] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clé unique pour chaque item (product_id + variant_id)
  function itemKey(item: OrderItem): string {
    return `${item.product_id}${item.variant_id ? `:${item.variant_id}` : ""}`;
  }

  function toggleItem(item: OrderItem) {
    const key = itemKey(item);
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, {
          productId: item.product_id,
          variantId: item.variant_id,
          quantity: item.quantity, // par défaut: quantité complète
        });
      }
      return next;
    });
  }

  function updateQuantity(item: OrderItem, qty: number) {
    const key = itemKey(item);
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      if (existing) {
        next.set(key, {
          ...existing,
          quantity: Math.max(1, Math.min(qty, item.quantity)),
        });
      }
      return next;
    });
  }

  // Calculer le montant estimé du remboursement
  const estimatedRefund = Array.from(selectedItems.values()).reduce(
    (total, sel) => {
      const item = orderItems.find(
        (oi) =>
          oi.product_id === sel.productId &&
          (sel.variantId ? oi.variant_id === sel.variantId : !oi.variant_id),
      );
      return total + (item ? item.unit_price * sel.quantity : 0);
    },
    0,
  );

  const canSubmit =
    selectedItems.size > 0 &&
    reasonCategory !== "" &&
    reason.trim().length >= 10;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const items = Array.from(selectedItems.values()).map((sel) => ({
        productId: sel.productId,
        variantId: sel.variantId,
        quantity: sel.quantity,
      }));

      await requestReturn({
        orderId,
        items,
        reason: reason.trim(),
        reasonCategory:
          reasonCategory as (typeof REASON_CATEGORIES)[number]["value"],
      });

      router.push("/returns");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Demander un retour</h1>
          <p className="text-sm text-muted-foreground">
            Commande {orderNumber}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Sélection des articles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Articles à retourner</CardTitle>
          <CardDescription>
            Sélectionnez les articles que vous souhaitez retourner et ajustez
            les quantités.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {orderItems.map((item) => {
            const key = itemKey(item);
            const isSelected = selectedItems.has(key);
            const selectedQty =
              selectedItems.get(key)?.quantity ?? item.quantity;

            return (
              <div
                key={key}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                  isSelected
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-muted-foreground/25"
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleItem(item)}
                  className="mt-1"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.unit_price, currency)} ×{" "}
                        {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium shrink-0">
                      {formatPrice(item.unit_price * item.quantity, currency)}
                    </p>
                  </div>

                  {/* Sélecteur de quantité (affiché si sélectionné et qty > 1) */}
                  {isSelected && item.quantity > 1 && (
                    <div className="mt-2 flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">
                        Quantité à retourner :
                      </Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item, selectedQty - 1)}
                          disabled={selectedQty <= 1}
                        >
                          −
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {selectedQty}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item, selectedQty + 1)}
                          disabled={selectedQty >= item.quantity}
                        >
                          +
                        </Button>
                        <span className="text-xs text-muted-foreground ml-1">
                          / {item.quantity}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Raison du retour */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Motif du retour</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason-category">Catégorie</Label>
            <Select value={reasonCategory} onValueChange={setReasonCategory}>
              <SelectTrigger id="reason-category">
                <SelectValue placeholder="Sélectionnez un motif" />
              </SelectTrigger>
              <SelectContent>
                {REASON_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Description détaillée</Label>
            <Textarea
              id="reason"
              placeholder="Décrivez précisément le problème rencontré (minimum 10 caractères)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {reason.trim().length}/10 caractères minimum
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Résumé + Soumission */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>{selectedItems.size} article(s) sélectionné(s)</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                Remboursement estimé
              </p>
              <p className="text-lg font-semibold">
                {formatPrice(estimatedRefund, currency)}
              </p>
            </div>
          </div>

          <Separator className="mb-4" />

          <p className="text-xs text-muted-foreground mb-4">
            En soumettant cette demande, le vendeur sera notifié et examinera
            votre requête. Si approuvée, vous devrez renvoyer les articles au
            vendeur avant le remboursement.
          </p>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Soumettre la demande de retour
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
