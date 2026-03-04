// filepath: src/app/(vendor)/vendor/reviews/loading.tsx

import { Skeleton } from "@/components/ui/skeleton";

export default function VendorReviewsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
