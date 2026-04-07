// filepath: src/components/affiliate/organisms/VendorAffiliateStatsBar.tsx

import { AffiliateStatCard } from "../molecules/AffiliateStatCard";
import { formatPrice } from "@/lib/format";
import { Link2, Users, Clock, CheckCircle2 } from "lucide-react";

interface Stats {
  total_links: number;
  active_links: number;
  total_referrals: number;
  pending_amount: number;
  paid_amount: number;
  total_commissions: number;
}

interface VendorAffiliateStatsBarProps {
  stats: Stats;
  currency?: string;
}

export function VendorAffiliateStatsBar({
  stats,
  currency = "XOF",
}: VendorAffiliateStatsBarProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AffiliateStatCard
        label="Filleuls"
        value={stats.total_referrals}
        icon={Users}
        description={`${stats.active_links} lien(s) actif(s)`}
      />
      <AffiliateStatCard
        label="Commissions en attente"
        value={formatPrice(stats.pending_amount, currency)}
        icon={Clock}
        highlight={stats.pending_amount > 0}
      />
      <AffiliateStatCard
        label="Commissions reçues"
        value={formatPrice(stats.paid_amount, currency)}
        icon={CheckCircle2}
      />
      <AffiliateStatCard
        label="Total commissions"
        value={stats.total_commissions}
        icon={Link2}
        description="toutes périodes"
      />
    </div>
  );
}
