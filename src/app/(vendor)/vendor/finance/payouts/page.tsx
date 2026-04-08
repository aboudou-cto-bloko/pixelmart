// filepath: src/app/(vendor)/vendor/finance/payouts/page.tsx

"use client";

import { useState } from "react";
import { usePayouts } from "@/hooks/usePayouts";
import { PayoutBalanceCard } from "@/components/payouts/molecules/PayoutBalanceCard";
import { PayoutRequestDialog } from "@/components/payouts/organisms/PayoutRequestDialog";
import { PayoutHistoryList } from "@/components/payouts/organisms/PayoutHistoryList";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { FlaskConical, Loader2, Unlock } from "lucide-react";
import { toast } from "sonner";

function DemoPayoutsPanel({
  pendingBalance,
  storeId,
  pendingPayoutId,
}: {
  pendingBalance: number;
  storeId: Id<"stores">;
  pendingPayoutId: Id<"payouts"> | undefined;
}) {
  const [loadingRelease, setLoadingRelease] = useState(false);
  const [loadingPayout, setLoadingPayout] = useState(false);
  const simulateRelease = useAction(api.demo.actions.simulateBalanceRelease);
  const simulatePayout = useAction(api.demo.actions.simulatePayout);

  const handleRelease = async () => {
    setLoadingRelease(true);
    try {
      await simulateRelease({ storeId });
      toast.success("Solde débloqué — les fonds sont maintenant disponibles");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoadingRelease(false);
    }
  };

  const handleSimulatePayout = async () => {
    if (!pendingPayoutId) return;
    setLoadingPayout(true);
    try {
      await simulatePayout({ payoutId: pendingPayoutId });
      toast.success("Virement simulé — retrait confirmé");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoadingPayout(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <FlaskConical className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <span className="text-sm text-primary font-medium mr-2">Démo :</span>
      {pendingBalance > 0 && (
        <Button
          variant="outline"
          size="sm"
          disabled={loadingRelease}
          onClick={handleRelease}
          className="border-primary/40 text-primary hover:bg-primary/10 h-7 text-xs"
        >
          {loadingRelease ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Unlock className="h-3 w-3 mr-1" />
          )}
          Débloquer solde en attente
        </Button>
      )}
      {pendingPayoutId && (
        <Button
          variant="outline"
          size="sm"
          disabled={loadingPayout}
          onClick={handleSimulatePayout}
          className="border-primary/40 text-primary hover:bg-primary/10 h-7 text-xs"
        >
          {loadingPayout ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <FlaskConical className="h-3 w-3 mr-1" />
          )}
          Simuler le virement
        </Button>
      )}
      {!pendingBalance && !pendingPayoutId && (
        <span className="text-xs text-muted-foreground">
          Passez une commande pour générer du solde, ou demandez un retrait pour
          le simuler.
        </span>
      )}
    </div>
  );
}

export default function VendorPayoutsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    payouts,
    isLoading,
    eligibility,
    isEligibilityLoading,
    requestPayout,
  } = usePayouts();

  const isDemo = useQuery(api.demo.queries.isCurrentUserDemo);
  const storeInfo = useQuery(api.stores.queries.getMyStore);

  const pendingPayout = payouts?.find((p) => p.status === "pending");

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

      {/* Demo panel */}
      {isDemo && storeInfo && (
        <DemoPayoutsPanel
          pendingBalance={storeInfo.pending_balance}
          storeId={storeInfo._id}
          pendingPayoutId={pendingPayout?._id}
        />
      )}

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
          storeCountry={eligibility.country}
          minAmount={eligibility.minAmount}
          onSubmit={requestPayout}
        />
      )}
    </div>
  );
}
