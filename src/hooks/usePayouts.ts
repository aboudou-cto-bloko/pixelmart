// filepath: src/hooks/usePayouts.ts

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function usePayouts(limit?: number) {
  const payouts = useQuery(api.payouts.queries.list, {
    limit: limit ?? 20,
  });

  const eligibility = useQuery(api.payouts.queries.getPayoutEligibility);

  const requestPayoutMutation = useMutation(
    api.payouts.mutations.requestPayout,
  );

  const requestPayout = async (args: {
    amount: number;
    payoutMethod: "bank_transfer" | "mobile_money" | "paypal";
    payoutDetails: {
      provider: string;
      account_name?: string;
      account_number?: string;
      bank_code?: string;
      phone_number?: string;
    };
  }) => {
    return requestPayoutMutation(args);
  };

  return {
    payouts: payouts ?? [],
    isLoading: payouts === undefined,
    eligibility: eligibility ?? null,
    isEligibilityLoading: eligibility === undefined,
    requestPayout,
  };
}
