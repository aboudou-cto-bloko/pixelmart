// filepath: src/components/products/ProductCard.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

export interface ProductCardData {
  _id: string;
  title: string;
  slug: string;
  price: number;
  compare_price?: number;
  images: string[];
  is_digital: boolean;
  quantity?: number;
  tags?: string[];
}

interface ProductCardProps {
  product: ProductCardData;
  /** Devise pour le formatage du prix */
  currency?: string;
}

export function ProductCard({ product, currency = "XOF" }: ProductCardProps) {
  const { title, slug, price, compare_price, images, is_digital, quantity } =
    product;
  const hasDiscount = compare_price !== undefined && compare_price > price;
  const isOutOfStock = quantity !== undefined && quantity <= 0;

  return (
    <Link href={ROUTES.PRODUCT(slug)}>
      <Card className="group overflow-hidden hover:border-primary/50 transition-colors h-full">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {images[0] ? (
            <Image
              src={images[0]}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Pas d&apos;image
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {is_digital && (
              <Badge variant="secondary" className="text-xs">
                Digital
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="outline" className="text-xs bg-background/80">
                Rupture
              </Badge>
            )}
          </div>
          {hasDiscount && (
            <Badge className="absolute top-2 right-2 text-xs bg-destructive text-white">
              -{Math.round(((compare_price - price) / compare_price) * 100)}%
            </Badge>
          )}
        </div>

        {/* Info */}
        <CardContent className="p-3">
          <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-primary">
              {formatPrice(price, currency)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(compare_price, currency)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
