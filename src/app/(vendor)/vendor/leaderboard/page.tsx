"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trophy,
  Star,
  ShoppingBag,
  TrendingUp,
  Crown,
  Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TIER_LABELS: Record<string, string> = {
  free: "Gratuit",
  pro: "Pro",
  business: "Business",
};

const TIER_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  free: "secondary",
  pro: "default",
  business: "default",
};

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="size-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="size-5 text-slate-400" />;
  if (rank === 3) return <Medal className="size-5 text-amber-600" />;
  return (
    <span className="text-sm font-semibold text-muted-foreground w-5 text-center">
      {rank}
    </span>
  );
}

export default function VendorLeaderboardPage() {
  const leaderboard = useQuery(api.stores.queries.getVendorLeaderboard);
  const myStore = useQuery(api.stores.queries.getMyStore);

  if (!leaderboard) {
    return (
      <div className="max-w-3xl mx-auto py-6 space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="size-6 text-yellow-500" />
          Classement vendeurs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Classement par chiffre d&apos;affaires (commandes payées). Mis à jour
          en temps réel.
        </p>
      </div>

      {leaderboard.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trophy className="size-10 mx-auto mb-3 opacity-30" />
            Aucune vente enregistrée pour le moment.
          </CardContent>
        </Card>
      )}

      {/* Podium — top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[top3[1], top3[0], top3[2]].map((store, i) => {
            if (!store) return <div key={i} />;
            const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
            const isMe = myStore && store._id === myStore._id;
            return (
              <Card
                key={store._id}
                className={cn(
                  "text-center transition-colors",
                  rank === 1 &&
                    "border-yellow-400/50 bg-yellow-50/50 dark:bg-yellow-900/10",
                  isMe && "ring-2 ring-primary",
                )}
              >
                <CardContent className="pt-4 pb-3 px-2 space-y-1">
                  <div className="flex justify-center">
                    <RankIcon rank={rank} />
                  </div>
                  <p className="font-semibold text-sm leading-tight line-clamp-2">
                    {store.name}
                  </p>
                  {store.is_verified && (
                    <span className="text-[10px] text-blue-600 font-medium">
                      Vérifié
                    </span>
                  )}
                  <p className="text-xs font-bold text-primary">
                    {formatPrice(store.revenue, "XOF")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {store.order_count} commandes
                  </p>
                  {isMe && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      Vous
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full ranking table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            Classement complet
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {leaderboard.map((store, index) => {
              const rank = index + 1;
              const isMe = myStore && store._id === myStore._id;
              return (
                <div
                  key={store._id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors",
                    isMe && "bg-primary/5",
                  )}
                >
                  <div className="flex items-center justify-center w-6 shrink-0">
                    <RankIcon rank={rank} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">
                        {store.name}
                      </span>
                      {store.is_verified && (
                        <span className="text-[10px] text-blue-600 font-medium shrink-0">
                          ✓
                        </span>
                      )}
                      <Badge
                        variant={
                          TIER_VARIANT[store.subscription_tier] ?? "secondary"
                        }
                        className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                      >
                        {TIER_LABELS[store.subscription_tier] ??
                          store.subscription_tier}
                      </Badge>
                      {isMe && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                        >
                          Vous
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="size-3" />
                        {store.order_count} commandes
                      </span>
                      {store.avg_rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="size-3 fill-yellow-400 text-yellow-400" />
                          {store.avg_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">
                      {formatPrice(store.revenue, "XOF")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      CA total
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
