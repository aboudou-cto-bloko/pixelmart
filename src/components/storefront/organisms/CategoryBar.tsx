// filepath: src/components/storefront/organisms/CategoryBar.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { CategoryIcon } from "../molecules/CategoryIcon";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";

export function CategoryBar() {
  const categories = useQuery(api.categories.queries.listActive);

  if (!categories) return null;

  // Seulement les catégories racines
  const rootCategories = categories.filter((c) => !c.parent_id);

  return (
    <section className="border-b">
      <div className="container flex items-center justify-between py-4">
        <h2 className="text-base font-semibold shrink-0 mr-4">
          Catégories Populaires
        </h2>
        <ScrollArea className="flex-1">
          <div className="flex gap-1">
            {rootCategories.map((cat) => (
              <CategoryIcon key={cat._id} category={cat} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <Link
          href="/categories"
          className="text-sm text-primary font-medium shrink-0 ml-4 hover:underline"
        >
          Voir tout
        </Link>
      </div>
    </section>
  );
}
