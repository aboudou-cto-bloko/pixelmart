// filepath: src/components/payouts/organisms/PayoutHistoryList.tsx

"use client";

import { ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PayoutHistoryItem } from "../molecules/PayoutHistoryItem";
import type { Doc } from "../../../../convex/_generated/dataModel";

interface PayoutHistoryListProps {
  payouts: Doc<"payouts">[];
  isLoading: boolean;
}

export function PayoutHistoryList({
  payouts,
  isLoading,
}: PayoutHistoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ArrowUpRight className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium">Aucun retrait</p>
        <p className="text-xs text-muted-foreground">
          Vos demandes de retrait apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payouts.map((payout) => (
        <PayoutHistoryItem
          key={payout._id}
          amount={payout.amount}
          fee={payout.fee}
          currency={payout.currency}
          status={payout.status}
          payoutMethod={payout.payout_method}
          requestedAt={payout.requested_at}
          processedAt={payout.processed_at}
          reference={payout.reference}
          notes={payout.notes}
        />
      ))}
    </div>
  );
}
