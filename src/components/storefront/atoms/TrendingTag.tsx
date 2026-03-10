// filepath: src/components/storefront/atoms/TrendingTag.tsx

import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface TrendingTagProps {
  label: string;
}

export function TrendingTag({ label }: TrendingTagProps) {
  return (
    <Link
      href={`${ROUTES.PRODUCTS}?q=${encodeURIComponent(label)}`}
      className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
    >
      {label}
    </Link>
  );
}
