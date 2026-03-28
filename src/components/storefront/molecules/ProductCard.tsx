// filepath: src/components/storefront/molecules/ProductCard.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { PriceTag, DiscountBadge } from "../atoms";
import { StarRating } from "@/components/reviews/atoms/StarRating";
import { Heart, ShoppingCart, ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";

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
    store_name?: string | null;
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const images = product.images.filter(Boolean);
  const hasImages = images.length > 0;

  const openLightbox = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setLightboxIndex(0);
      setLightboxOpen(true);
    },
    [],
  );

  const prev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setLightboxIndex((i) => (i - 1 + images.length) % images.length);
    },
    [images.length],
  );

  const next = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setLightboxIndex((i) => (i + 1) % images.length);
    },
    [images.length],
  );

  const discountPercent =
    product.compare_price && product.compare_price > product.price
      ? Math.round(
          ((product.compare_price - product.price) / product.compare_price) *
            100,
        )
      : 0;

  return (
    <>
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
          {hasImages ? (
            <Image
              src={images[0]}
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

          {/* Quick actions — visible on hover */}
          <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            {hasImages && variant !== "horizontal" && (
              <Button
                variant="secondary"
                size="icon"
                className="size-8"
                onClick={openLightbox}
                aria-label="Voir l'image en grand"
              >
                <ZoomIn className="size-4" />
              </Button>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="size-8"
              onClick={(e) => {
                e.preventDefault();
                // TODO: wishlist
              }}
            >
              <Heart className="size-4" />
            </Button>
          </div>
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
          <div className="flex flex-col pt-2 gap-1.5">
            <PriceTag
              price={product.price}
              comparePrice={product.compare_price}
              size={variant === "compact" ? "sm" : "md"}
            />
          </div>
        </div>
      </Link>

      {/* Lightbox */}
      {hasImages && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-3xl p-0 bg-black/95 border-0 overflow-hidden">
            {/* Close */}
            <button
              className="absolute top-3 right-3 z-50 flex size-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={() => setLightboxOpen(false)}
              aria-label="Fermer"
            >
              <X className="size-4" />
            </button>

            {/* Image principale */}
            <div className="relative aspect-square w-full sm:aspect-[4/3]">
              <Image
                src={images[lightboxIndex]}
                alt={`${product.title} — ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>

            {/* Navigation multi-images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-50 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-12 top-1/2 -translate-y-1/2 z-50 flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="size-5" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(i);
                      }}
                      className={cn(
                        "size-1.5 rounded-full transition-all",
                        i === lightboxIndex
                          ? "bg-white scale-125"
                          : "bg-white/40 hover:bg-white/70",
                      )}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Compteur */}
                <div className="absolute bottom-3 right-14 text-xs text-white/60">
                  {lightboxIndex + 1} / {images.length}
                </div>
              </>
            )}

            {/* Titre produit */}
            <div className="px-4 py-3 border-t border-white/10">
              <p className="text-sm text-white/80 line-clamp-1">{product.title}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
