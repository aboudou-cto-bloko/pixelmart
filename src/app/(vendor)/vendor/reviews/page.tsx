// filepath: src/app/(vendor)/vendor/reviews/page.tsx

"use client";

import { VendorReviewsTable } from "@/components/reviews";
import { Star } from "lucide-react";

export default function VendorReviewsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Star className="size-6" />
          Avis clients
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Consultez et répondez aux avis laissés sur vos produits
        </p>
      </div>

      <VendorReviewsTable />
    </div>
  );
}
