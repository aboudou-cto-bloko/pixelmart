// filepath: src/app/(vendor)/vendor/finance/payouts/page.tsx

"use client";

import { useState } from "react";
import { usePayouts } from "@/hooks/usePayouts";
import { PayoutBalanceCard } from "@/components/payouts/molecules/PayoutBalanceCard";
import { PayoutRequestDialog } from "@/components/payouts/organisms/PayoutRequestDialog";
import { PayoutHistoryList } from "@/components/payouts/organisms/PayoutHistoryList";

export default function VendorPayoutsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    payouts,
    isLoading,
    eligibility,
    isEligibilityLoading,
    requestPayout,
  } = usePayouts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Retraits
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos retraits et suivez leur progression.
        </p>
      </div>

      {/* Balance Card */}
      <PayoutBalanceCard
        balance={eligibility?.balance ?? 0}
        currency={eligibility?.currency ?? "XOF"}
        canRequestPayout={eligibility?.canRequestPayout ?? false}
        validationError={eligibility?.validationError}
        isLoading={isEligibilityLoading}
        onRequestPayout={() => setDialogOpen(true)}
      />

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Historique des retraits</h2>
        <PayoutHistoryList payouts={payouts} isLoading={isLoading} />
      </div>

      {/* Request Dialog */}
      {eligibility && (
        <PayoutRequestDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          balance={eligibility.balance}
          currency={eligibility.currency}
          minAmount={eligibility.minAmount}
          onSubmit={requestPayout}
        />
      )}
    </div>
  );
}
