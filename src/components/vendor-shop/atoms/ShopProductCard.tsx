"use client";

// filepath: src/components/vendor-shop/atoms/ShopProductCard.tsx

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { SHOP_ROUTES } from "@/constants/routes";
import { useShopCart } from "../providers";
import type { Id } from "../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { WishlistButton } from "@/components/atoms/WishlistButton";

export interface ShopProductCardData {
  _id: string;
  title: string;
  slug: string;
  price: number;
  compare_price?: number;
  images: string[];
  is_digital: boolean;
  quantity?: number;
  weight?: number; // grammes
}

interface ShopProductCardProps {
  product: ShopProductCardData;
  storeSlug: string;
  storeId: Id<"stores">;
  storeName: string;
  currency?: string;
  showAddToCart?: boolean;
}

export function ShopProductCard({
  product,
  storeSlug,
  storeId,
  storeName,
  currency = "XOF",
  showAddToCart = false,
}: ShopProductCardProps) {
  const router = useRouter();
  const { addItem } = useShopCart();
  const [isAdding, setIsAdding] = useState(false);

  const { title, slug, price, compare_price, images, is_digital, quantity } =
    product;
  const hasDiscount = compare_price !== undefined && compare_price > price;
  const isOutOfStock = !is_digital && quantity !== undefined && quantity <= 0;
  const discountPercent = hasDiscount
    ? Math.round(((compare_price! - price) / compare_price!) * 100)
    : 0;

  const productHref = SHOP_ROUTES.PRODUCT(storeSlug, slug);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding) return;

    setIsAdding(true);
    try {
      await addItem({
        productId: product._id as Id<"products">,
        title: product.title,
        slug: product.slug,
        image: images[0] ?? "",
        price: product.price,
        comparePrice: compare_price,
        storeId,
        storeName,
        storeSlug,
        weight: product.weight,
        quantity: 1,
        maxQuantity: quantity ?? 99,
        isDigital: is_digital,
      });
      router.push(SHOP_ROUTES.CART(storeSlug));
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Impossible d'ajouter au panier. Veuillez réessayer.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <Link href={productHref} className="block">
      <div
        className="group bg-card rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 active:scale-[0.98]"
        style={{ borderColor: "var(--shop-border, #e5e7eb)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderColor = "var(--shop-primary, #6366f1)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderColor = "var(--shop-border, #e5e7eb)")
        }
      >
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

          {/* Wishlist */}
          <WishlistButton
            productId={product._id}
            className="absolute top-2 right-2 z-10"
          />

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
              disabled={isAdding}
              style={{ backgroundColor: "var(--shop-primary, #6366f1)" }}
            >
              {isAdding ? "Ajout..." : "Commander"}
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}
