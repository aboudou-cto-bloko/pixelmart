"use client";

// filepath: src/components/vendor-shop/atoms/ShopProductCard.tsx

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { SHOP_ROUTES } from "@/constants/routes";
import { useShopCart } from "../providers";

export interface ShopProductCardData {
  _id: string;
  title: string;
  slug: string;
  price: number;
  compare_price?: number;
  images: string[];
  is_digital: boolean;
  quantity?: number;
}

interface ShopProductCardProps {
  product: ShopProductCardData;
  storeSlug: string;
  currency?: string;
  showAddToCart?: boolean;
}

export function ShopProductCard({
  product,
  storeSlug,
  currency = "XOF",
  showAddToCart = false,
}: ShopProductCardProps) {
  const router = useRouter();
  const { addItem } = useShopCart();

  const { title, slug, price, compare_price, images, is_digital, quantity } =
    product;
  const hasDiscount = compare_price !== undefined && compare_price > price;
  const isOutOfStock = !is_digital && quantity !== undefined && quantity <= 0;
  const discountPercent = hasDiscount
    ? Math.round(((compare_price! - price) / compare_price!) * 100)
    : 0;

  const productHref = SHOP_ROUTES.PRODUCT(storeSlug, slug);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product._id,
      title: product.title,
      slug: product.slug,
      image: images[0] ?? "",
      price: product.price,
      comparePrice: compare_price,
      quantity: 1,
      maxQuantity: quantity ?? 99,
      isDigital: is_digital,
    });
    router.push(SHOP_ROUTES.CART(storeSlug));
  }

  return (
    <Link href={productHref} className="block">
      <div className="group bg-card rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-[var(--shop-primary,#6366f1)] transition-all duration-300 cursor-pointer hover:-translate-y-1 active:scale-[0.98]">
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
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-[var(--shop-primary,#6366f1)] transition-colors mb-1">
            {title}
          </h3>
          <div className="space-y-0.5 pt-2">
            <span
              className="text-base font-bold"
              style={{ color: "var(--shop-primary, #6366f1)" }}
            >
              {formatPrice(price, currency)}
            </span>
            {hasDiscount && (
              <span className="block text-xs text-muted-foreground line-through">
                {formatPrice(compare_price!, currency)}
              </span>
            )}
          </div>
          {showAddToCart && !isOutOfStock && (
            <Button
              size="sm"
              className="w-full mt-3"
              onClick={handleAddToCart}
              style={{ backgroundColor: "var(--shop-primary, #6366f1)" }}
            >
              Commander
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}
