// filepath: src/app/(vendor)/vendor/billing/page.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { VendorBillingTemplate } from "@/components/storage/templates/VendorBillingTemplate";

export default function VendorBillingPage() {
  const invoices = useQuery(api.storage.queries.getInvoices, {});
  const debtData = useQuery(api.storage.queries.getDebt, {});

  const isLoading = invoices === undefined || debtData === undefined;

  return (
    <VendorBillingTemplate
      invoices={invoices ?? []}
      debtRecords={debtData?.debts ?? []}
      totalOutstanding={debtData?.totalOutstanding ?? 0}
      isLoading={isLoading}
    />
  );
}
