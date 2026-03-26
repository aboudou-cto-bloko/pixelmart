// filepath: src/app/(vendor)/vendor/coupons/page.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { VendorCouponsTemplate } from "@/components/coupons/templates/VendorCouponsTemplate";

export default function VendorCouponsPage() {
  const coupons = useQuery(api.coupons.queries.listByStore, {});

  return (
    <VendorCouponsTemplate
      coupons={coupons ?? []}
      isLoading={coupons === undefined}
    />
  );
}
