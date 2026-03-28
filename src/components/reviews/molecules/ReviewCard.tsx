// filepath: src/components/reviews/molecules/ReviewCard.tsx

"use client";

import { StarRating } from "../atoms/StarRating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Flag, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";

interface ReviewCardProps {
  review: {
    _id: string;
    _creationTime: number;
    rating: number;
    title?: string;
    body?: string;
    images: string[];
    is_verified: boolean;
    customer_name: string;
    customer_avatar?: string;
    vendor_reply?: string;
    replied_at?: number;
  };
  onFlag?: (reviewId: string) => void;
  showFlagButton?: boolean;
}

export function ReviewCard({
  review,
  onFlag,
  showFlagButton = true,
}: ReviewCardProps) {
  const timeAgo = formatDistanceToNow(new Date(review._creationTime), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div className="space-y-3 border-b pb-4 last:border-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={review.customer_avatar} />
            <AvatarFallback>
              {review.customer_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {review.customer_name}
              </span>
              {review.is_verified && (
                <span className="text-xs text-emerald-600 font-medium">
                  ✓ Achat vérifié
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
        </div>

        {showFlagButton && onFlag && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onFlag(review._id)}
            title="Signaler cet avis"
          >
            <Flag className="size-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Content */}
      {review.title && <p className="font-semibold text-sm">{review.title}</p>}
      {review.body && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {review.body}
        </p>
      )}

      {/* Images */}
      {review.images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {review.images.map((url, i) => (
            <Image
              key={i}
              src={url}
              alt={`Photo avis ${i + 1}`}
              width={64}
              height={64}
              className="size-16 rounded-md object-cover border"
            />
          ))}
        </div>
      )}

      {/* Vendor reply */}
      {review.vendor_reply && (
        <div className="ml-6 bg-muted/50 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Réponse du vendeur</span>
          </div>
          <p className="text-sm text-muted-foreground">{review.vendor_reply}</p>
        </div>
      )}
    </div>
  );
}
