// filepath: src/components/ui/product-category-badge.tsx

interface ProductCategoryBadgeProps {
  name: string;
  className?: string;
}

export function ProductCategoryBadge({
  name,
  className = "",
}: ProductCategoryBadgeProps) {
  return (
    <span
      className={`inline-block bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-md truncate max-w-full ${className}`}
    >
      {name}
    </span>
  );
}
