import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import Image from "next/image";

interface CategoryCardProps {
  name: string;
  slug: string;
  productCount?: number;
  iconUrl?: string | null;
}

export function CategoryCard({
  name,
  slug,
  productCount,
  iconUrl,
}: CategoryCardProps) {
  return (
    <Link href={ROUTES.CATEGORY(slug)}>
      <Card className="group hover:border-primary/50 transition-colors h-full">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-3">
          {/* Icon placeholder — on utilisera l'URL quand dispo */}
          {iconUrl ? (
            <Image
              src={iconUrl}
              alt={name}
              className="size-12 object-contain"
            />
          ) : (
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xl font-bold group-hover:bg-primary/20 transition-colors">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold group-hover:text-primary transition-colors">
              {name}
            </p>
            {productCount !== undefined && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {productCount} produit{productCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
