// filepath: src/components/storefront/molecules/CategoryIcon.tsx

import Link from "next/link";

interface CategoryIconProps {
  category: {
    slug: string;
    name: string;
  };
  showSeparator?: boolean;
}

export function CategoryIcon({
  category,
  showSeparator = true,
}: CategoryIconProps) {
  return (
    <>
      <Link
        href={`/categories/${category.slug}`}
        className="mx-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap shrink-0"
      >
        {category.name}
      </Link>
    </>
  );
}
