// filepath: src/app/(vendor)/vendor/orders/[id]/loading.tsx

import { Skeleton } from "@/components/ui/skeleton";

export default function OrderDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-48" />
      <div className="flex justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
