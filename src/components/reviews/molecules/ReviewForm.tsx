// filepath: src/components/reviews/molecules/ReviewForm.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StarRating } from "../atoms/StarRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

interface ReviewFormProps {
  productId: Id<"products">;
  orderId: Id<"orders">;
  productTitle: string;
  onSuccess?: () => void;
}

export function ReviewForm({
  productId,
  orderId,
  productTitle,
  onSuccess,
}: ReviewFormProps) {
  const createReview = useMutation(api.reviews.mutations.create);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Veuillez sélectionner une note");
      return;
    }

    setIsSubmitting(true);
    try {
      await createReview({
        product_id: productId,
        order_id: orderId,
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        images: [],
      });
      toast.success(
        "Merci pour votre avis ! Il sera publié après vérification.",
      );
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de l'envoi";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Donner votre avis sur &laquo; {productTitle} &raquo;
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Note */}
          <div className="space-y-2">
            <Label>Votre note *</Label>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRate={setRating}
            />
          </div>

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="reviewTitle">Titre (optionnel)</Label>
            <Input
              id="reviewTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Résumez votre expérience"
              maxLength={100}
            />
          </div>

          {/* Corps */}
          <div className="space-y-2">
            <Label htmlFor="reviewBody">Votre avis (optionnel)</Label>
            <Textarea
              id="reviewBody"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Décrivez votre expérience avec ce produit..."
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {body.length}/2000
            </p>
          </div>

          <Button type="submit" disabled={rating === 0 || isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            Envoyer mon avis
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
