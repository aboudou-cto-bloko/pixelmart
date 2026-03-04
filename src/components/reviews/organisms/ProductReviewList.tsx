// filepath: src/components/reviews/organisms/ProductReviewList.tsx

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ReviewCard } from "../molecules/ReviewCard";
import { ReviewStats } from "../molecules/ReviewStats";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Id } from "../../../../convex/_generated/dataModel";

interface ProductReviewListProps {
  productId: Id<"products">;
}

export function ProductReviewList({ productId }: ProductReviewListProps) {
  const reviews = useQuery(api.reviews.queries.listByProduct, {
    product_id: productId,
  });
  const stats = useQuery(api.reviews.queries.getProductStats, {
    product_id: productId,
  });
  const flagReview = useMutation(api.reviews.mutations.flag);

  if (!reviews || !stats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  async function handleFlag(reviewId: string) {
    try {
      await flagReview({ review_id: reviewId as Id<"reviews"> });
      toast.success("Avis signalé. Merci pour votre vigilance.");
    } catch {
      toast.error("Erreur lors du signalement");
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Avis clients</h2>
      <ReviewStats stats={stats} />
      <Separator />
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review._id} review={review} onFlag={handleFlag} />
        ))}
      </div>
    </div>
  );
}
