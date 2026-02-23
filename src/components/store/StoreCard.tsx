// filepath: src/components/store/StoreCard.tsx

import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Star, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";

export interface StoreCardData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url: string | null;
  country: string;
  level: string;
  total_orders: number;
  avg_rating: number;
  is_verified: boolean;
}

interface StoreCardProps {
  store: StoreCardData;
}

export function StoreCard({ store }: StoreCardProps) {
  const {
    name,
    slug,
    description,
    logo_url,
    country,
    total_orders,
    avg_rating,
    is_verified,
  } = store;

  return (
    <Link href={ROUTES.STORE(slug)}>
      <Card className="group hover:border-primary/50 transition-colors h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Logo */}
            {logo_url ? (
              <Image
                src={logo_url}
                alt={name}
                width={48}
                height={48}
                className="size-12 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                  {name}
                </p>
                {is_verified && (
                  <ShieldCheck className="size-4 text-primary shrink-0" />
                )}
              </div>

              {description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {description}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {avg_rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="size-3 fill-primary text-primary" />
                    {avg_rating.toFixed(1)}
                  </span>
                )}
                <span>
                  {total_orders} vente{total_orders !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="size-3" />
                  {country}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
