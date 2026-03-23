// filepath: src/components/products/ProductCard.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ProductCategoryBadge } from "@/components/ui/product-category-badge";
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
  category_name?: string | null;
  store_name?: string | null;
}

interface ProductCardProps {
  product: ProductCardData;
  currency?: string;
  showCategory?: boolean;
}

export function ProductCard({
  product,
  currency = "XOF",
  showCategory = false,
}: ProductCardProps) {
  const {
    title,
    slug,
    price,
    compare_price,
    images,
    is_digital,
    quantity,
    category_name,
    store_name,
  } = product;
  const hasDiscount = compare_price !== undefined && compare_price > price;
  const isOutOfStock = quantity !== undefined && quantity <= 0;

  const discountPercent = hasDiscount
    ? Math.round(((compare_price - price) / compare_price) * 100)
    : 0;

  return (
    <Link href={ROUTES.PRODUCT(slug)} className="block">
      <div className="group bg-card rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-primary transition-all duration-300 cursor-pointer hover:-translate-y-1 active:scale-[0.98]">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {images[0] ? (
            <Image
              src={images[0]}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Pas d&apos;image
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <Badge className="text-xs bg-red-500 text-white font-medium rounded">
                -{discountPercent}%
              </Badge>
            )}
            {is_digital && (
              <Badge variant="secondary" className="text-xs font-medium">
                Digital
              </Badge>
            )}
            {isOutOfStock && (
              <Badge
                variant="outline"
                className="text-xs bg-background/80 font-medium"
              >
                Rupture
              </Badge>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          {showCategory && category_name ? (
            <ProductCategoryBadge name={category_name} className="mb-2" />
          ) : (
            store_name && (
              <p className="text-xs text-muted-foreground mb-1 truncate">
                {store_name}
              </p>
            )
          )}
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
            {title}
          </h3>
          <div className="space-y-0.5 pt-2">
            <span className="text-base font-bold text-primary">
              {formatPrice(price, currency)}
            </span>
            {hasDiscount && (
              <span className="block text-xs text-muted-foreground line-through">
                {formatPrice(compare_price, currency)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
