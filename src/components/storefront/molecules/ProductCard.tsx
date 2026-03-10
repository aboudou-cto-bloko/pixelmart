// filepath: src/components/storefront/molecules/ProductCard.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { PriceTag, DiscountBadge } from "../atoms";
import { StarRating } from "@/components/reviews/atoms/StarRating";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: {
    _id: string;
    slug: string;
    title: string;
    images: string[];
    price: number;
    compare_price?: number;
    avg_rating?: number;
    review_count?: number;
    store_name?: string;
  };
  variant?: "default" | "compact" | "horizontal";
  sponsored?: boolean;
  className?: string;
}

export function ProductCard({
  product,
  variant = "default",
  sponsored = false,
  className,
}: ProductCardProps) {
  const discountPercent =
    product.compare_price && product.compare_price > product.price
      ? Math.round(
          ((product.compare_price - product.price) / product.compare_price) *
            100,
        )
      : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group relative flex flex-col rounded-lg border bg-card transition-all hover:shadow-md",
        variant === "horizontal" && "flex-row",
        className,
      )}
    >
      {/* Sponsored badge */}
      {sponsored && (
        <span className="absolute top-2 right-2 z-10 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
          Sponsorisé
        </span>
      )}

      {/* Image */}
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          variant === "horizontal" ? "w-32 shrink-0" : "aspect-square w-full",
          variant === "default" && "rounded-t-lg",
          variant === "horizontal" && "rounded-l-lg",
        )}
      >
        {discountPercent > 0 && <DiscountBadge percent={discountPercent} />}
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 280px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShoppingCart className="size-8" />
          </div>
        )}

        {/* Quick action */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-2 right-2 size-8 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.preventDefault();
            // TODO: wishlist
          }}
        >
          <Heart className="size-4" />
        </Button>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.store_name && (
          <span className="text-[11px] text-muted-foreground truncate">
            {product.store_name}
          </span>
        )}
        <h3 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        {/* Rating */}
        {(product.avg_rating ?? 0) > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={product.avg_rating ?? 0} size="sm" />
            {product.review_count !== undefined && (
              <span className="text-[11px] text-muted-foreground">
                ({product.review_count})
              </span>
            )}
          </div>
        )}

        <PriceTag
          price={product.price}
          comparePrice={product.compare_price}
          size={variant === "compact" ? "sm" : "md"}
        />
      </div>
    </Link>
  );
}
