// filepath: src/components/products/SellerUpsell.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ProductCard } from "./ProductCard";
import { ShopProductCard } from "@/components/vendor-shop/atoms/ShopProductCard";
import { Store } from "lucide-react";
import Link from "next/link";
import { ROUTES, SHOP_ROUTES } from "@/constants/routes";

interface BaseProps {
  storeId: Id<"stores">;
  excludeProductId: Id<"products">;
  storeName: string;
}

interface MarketplaceProps extends BaseProps {
  mode: "marketplace";
  storeSlug: string;
}

interface ShopProps extends BaseProps {
  mode: "shop";
  storeSlug: string;
  currency?: string;
}

type Props = MarketplaceProps | ShopProps;

export function SellerUpsell(props: Props) {
  const { storeId, excludeProductId, storeName, storeSlug, mode } = props;
  const currency = mode === "shop" ? (props.currency ?? "XOF") : "XOF";

  const products = useQuery(api.products.queries.listOthersByStore, {
    storeId,
    excludeProductId,
  });

  // Loading skeleton
  if (products === undefined) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) return null;

  const storeHref =
    mode === "shop" ? SHOP_ROUTES.PRODUCTS(storeSlug) : ROUTES.STORE(storeSlug);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">
            Autres produits de <span className="text-primary">{storeName}</span>
          </h2>
        </div>
        <Link
          href={storeHref}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Voir tout →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {mode === "marketplace"
          ? products.map((product) => (
              <ProductCard
                key={product._id}
                product={{
                  _id: product._id,
                  title: product.title,
                  slug: product.slug,
                  price: product.price,
                  compare_price: product.compare_price,
                  images: product.images,
                  is_digital: product.is_digital,
                  quantity: product.quantity,
                  weight: product.weight,
                  store_name: storeName,
                  store_id: storeId,
                  store_slug: storeSlug,
                }}
                currency={currency}
                showAddToCart
              />
            ))
          : products.map((product) => (
              <ShopProductCard
                key={product._id}
                product={{
                  _id: product._id,
                  title: product.title,
                  slug: product.slug,
                  price: product.price,
                  compare_price: product.compare_price,
                  images: product.images,
                  is_digital: product.is_digital,
                  quantity: product.quantity,
                  weight: product.weight,
                }}
                storeSlug={storeSlug}
                storeId={storeId}
                storeName={storeName}
                currency={currency}
                showAddToCart
              />
            ))}
      </div>
    </div>
  );
}
