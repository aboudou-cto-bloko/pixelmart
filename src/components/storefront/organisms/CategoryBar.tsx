"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { CategoryIcon } from "../molecules/CategoryIcon";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";

export function CategoryBar() {
  const categories = useQuery(api.categories.queries.listActive);

  if (!categories) return null;

  const rootCategories = categories.filter((c) => !c.parent_id);

  return (
    <section className="border-b">
      <div className="container flex items-center justify-between py-4 gap-2 overflow-x-hidden">
        <h2 className="text-sm sm:text-base font-semibold shrink-0 mr-2 sm:mr-4">
          Catégories Populaires
        </h2>

        {/* Le ScrollArea occupe l'espace restant et gère le défilement interne */}
        <ScrollArea className="flex-1 min-w-0">
          <div className="flex gap-1">
            {rootCategories.map((cat) => (
              <CategoryIcon key={cat._id} category={cat} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <Link
          href="/products"
          className="text-xs sm:text-sm text-primary font-medium shrink-0 ml-2 sm:ml-4 hover:underline whitespace-nowrap"
        >
          Voir tout
        </Link>
      </div>
    </section>
  );
}
