// filepath: src/components/ui/mobile-category-accordion.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";

interface CategoryNode {
  _id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
}

interface MobileCategoryAccordionProps {
  categories: CategoryNode[];
  onClose?: () => void;
}

export function MobileCategoryAccordion({
  categories,
  onClose,
}: MobileCategoryAccordionProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <nav className="space-y-1">
      {categories.map((cat) => {
        const hasChildren = cat.children && cat.children.length > 0;
        const isExpanded = expandedCategories.has(cat._id);

        return (
          <div key={cat._id}>
            <div className="flex items-center">
              <Link
                href={ROUTES.CATEGORY(cat.slug)}
                onClick={onClose}
                className="flex-1 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                {cat.name}
              </Link>
              {hasChildren && (
                <button
                  onClick={() => toggleCategory(cat._id)}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  aria-label={isExpanded ? "Fermer" : "Ouvrir"}
                >
                  <ChevronRight
                    className={`size-4 transition-transform duration-200 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>
              )}
            </div>
            {hasChildren && isExpanded && (
              <div className="ml-4 space-y-1 mt-1 border-l-2 border-muted pl-2">
                {cat.children!.map((child) => (
                  <Link
                    key={child._id}
                    href={ROUTES.CATEGORY(child.slug)}
                    onClick={onClose}
                    className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
