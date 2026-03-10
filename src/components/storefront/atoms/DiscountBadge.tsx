// filepath: src/components/storefront/atoms/DiscountBadge.tsx

interface DiscountBadgeProps {
  percent: number;
}

export function DiscountBadge({ percent }: DiscountBadgeProps) {
  if (percent <= 0) return null;

  return (
    <span className="absolute top-2 left-2 z-10 rounded bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
      -{percent}%
    </span>
  );
}
