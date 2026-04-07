// filepath: src/components/affiliate/organisms/AdminAffiliateStatsBar.tsx

import { AffiliateStatCard } from "../molecules/AffiliateStatCard";
import { formatPrice } from "@/lib/format";
import { Link2, Users, Clock, CheckCircle2 } from "lucide-react";

interface Stats {
  total_links: number;
  active_links: number;
  total_referrals: number;
  total_commissions: number;
  pending_count: number;
  total_pending_amount: number;
  total_paid_amount: number;
  total_earned_amount: number;
}

interface AdminAffiliateStatsBarProps {
  stats: Stats;
  currency?: string;
}

export function AdminAffiliateStatsBar({
  stats,
  currency = "XOF",
}: AdminAffiliateStatsBarProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AffiliateStatCard
        label="Liens actifs"
        value={`${stats.active_links} / ${stats.total_links}`}
        icon={Link2}
        description={`${stats.total_referrals} filleul(s) au total`}
      />
      <AffiliateStatCard
        label="Commissions en attente"
        value={stats.pending_count}
        icon={Clock}
        description={formatPrice(stats.total_pending_amount, currency)}
        highlight={stats.pending_count > 0}
      />
      <AffiliateStatCard
        label="Commissions payées"
        value={formatPrice(stats.total_paid_amount, currency)}
        icon={CheckCircle2}
      />
      <AffiliateStatCard
        label="Total généré"
        value={formatPrice(stats.total_earned_amount, currency)}
        icon={Users}
        description={`${stats.total_commissions} commission(s)`}
      />
    </div>
  );
}
