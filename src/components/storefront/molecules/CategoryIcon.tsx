// filepath: src/components/storefront/molecules/CategoryIcon.tsx

import Link from "next/link";
import Image from "next/image";

interface CategoryIconProps {
  category: {
    slug: string;
    name: string;
    icon_url?: string;
  };
}

export function CategoryIcon({ category }: CategoryIconProps) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex flex-col items-center gap-2 px-3 py-2 transition-colors"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10">
        {category.icon_url ? (
          <Image
            src={category.icon_url}
            alt={category.name}
            width={28}
            height={28}
            className="object-contain"
          />
        ) : (
          <span className="text-lg">📦</span>
        )}
      </div>
      <span className="text-xs font-medium text-center leading-tight group-hover:text-primary transition-colors">
        {category.name}
      </span>
    </Link>
  );
}
