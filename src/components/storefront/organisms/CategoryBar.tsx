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
      <div className="container py-4 flex items-center justify-between gap-2 overflow-x-hidden">
        {/* Le ScrollArea occupe l'espace restant et gère le défilement interne */}
        <ScrollArea className="flex-1 min-w-0">
          <div className="flex gap-1">
            {rootCategories.map((cat) => (
              <CategoryIcon key={cat._id} category={cat} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
