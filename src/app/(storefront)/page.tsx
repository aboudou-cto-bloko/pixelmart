"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "convex/react";
import { ArrowRight, Sparkles, ShieldCheck, Truck } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryCard } from "@/components/store/CategoryCard";
import { formatPrice } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

// ─── Hero ────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="size-3 mr-1" />
            Marketplace #1 au Bénin
          </Badge>
          <h1 className="mb-6">
            Achetez et vendez en toute{" "}
            <span className="text-primary">confiance</span>
          </h1>
          <p className="lead text-muted-foreground mb-8">
            Des milliers de produits de vendeurs vérifiés. Paiement sécurisé par
            Mobile Money et carte bancaire.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href={ROUTES.PRODUCTS}>
                Explorer le catalogue
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={ROUTES.ONBOARDING_VENDOR}>Devenir vendeur</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Value Props ─────────────────────────────────────────────
function ValueProps() {
  const props = [
    {
      icon: ShieldCheck,
      title: "Paiement sécurisé",
      description: "Mobile Money — transactions protégées",
    },
    {
      icon: Truck,
      title: "Livraison suivie",
      description: "Suivi en temps réel de vos commandes",
    },
    {
      icon: Sparkles,
      title: "Vendeurs vérifiés",
      description: "Chaque boutique est vérifiée par notre équipe",
    },
  ] as const;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {props.map((prop) => (
          <div key={prop.title} className="flex items-start gap-4 border p-4">
            <div className="bg-primary/10 p-2.5">
              <prop.icon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{prop.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {prop.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Categories ──────────────────────────────────────────────
function CategoriesSection() {
  const categories = useQuery(api.categories.queries.listActive);

  if (categories === undefined) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6">Catégories</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  const rootCategories = categories.filter((c) => !c.parent_id);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2>Catégories</h2>
        <Link
          href={ROUTES.PRODUCTS}
          className="text-sm font-medium text-primary hover:underline"
        >
          Tout voir
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {rootCategories.map((cat) => (
          <CategoryCard
            key={cat._id}
            name={cat.name}
            slug={cat.slug}
            iconUrl={cat.icon_url}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Product Card (inline, sera extrait en molecule à la Livraison 2) ─
interface ProductCardInlineProps {
  title: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  isDigital: boolean;
}

function ProductCardInline({
  title,
  slug,
  price,
  comparePrice,
  images,
  isDigital,
}: ProductCardInlineProps) {
  const hasDiscount = comparePrice && comparePrice > price;

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
          {isDigital && (
            <Badge
              variant="secondary"
              className="absolute top-2 left-2 text-xs"
            >
              Digital
            </Badge>
          )}
          {hasDiscount && (
            <Badge className="absolute top-2 right-2 text-xs bg-destructive text-white">
              -{Math.round(((comparePrice - price) / comparePrice) * 100)}%
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
              {formatPrice(price, "XOF")}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(comparePrice, "XOF")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Latest Products ─────────────────────────────────────────
function LatestProductsSection() {
  const products = useQuery(api.products.queries.listLatest, { limit: 8 });

  if (products === undefined) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6">Nouveautés</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2>Nouveautés</h2>
        <Link
          href={`${ROUTES.PRODUCTS}?sort=newest`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Tout voir
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCardInline
            key={product._id}
            title={product.title}
            slug={product.slug}
            price={product.price}
            comparePrice={product.compare_price}
            images={product.images}
            isDigital={product.is_digital}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Featured Stores ─────────────────────────────────────────
function FeaturedStoresSection() {
  const stores = useQuery(api.stores.queries.listActive, {
    limit: 6,
    verifiedOnly: true,
  });

  if (stores === undefined) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 bg-muted/30">
        <h2 className="mb-6">Boutiques populaires</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (stores.length === 0) return null;

  return (
    <section className="bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2>Boutiques populaires</h2>
          <Link
            href={ROUTES.STORES}
            className="text-sm font-medium text-primary hover:underline"
          >
            Toutes les boutiques
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {stores.map((store) => (
            <Link key={store._id} href={ROUTES.STORE(store.slug)}>
              <Card className="group hover:border-primary/50 transition-colors h-full">
                <CardContent className="flex flex-col items-center justify-center p-4 text-center gap-2">
                  {store.logo_url ? (
                    <Image
                      src={store.logo_url}
                      alt={store.name}
                      width={48}
                      height={48}
                      className="size-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="size-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                      {store.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p className="text-xs font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                    {store.name}
                  </p>
                  {store.is_verified && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      <ShieldCheck className="size-2.5 mr-0.5" />
                      Vérifié
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValueProps />
      <CategoriesSection />
      <LatestProductsSection />
      <FeaturedStoresSection />
    </>
  );
}
