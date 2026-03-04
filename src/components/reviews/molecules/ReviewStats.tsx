// filepath: src/components/reviews/molecules/ReviewStats.tsx

"use client";

import { StarRating } from "../atoms/StarRating";
import { Progress } from "@/components/ui/progress";

interface ReviewStatsProps {
  stats: {
    average: number;
    total: number;
    distribution: Record<number, number>;
  };
}

export function ReviewStats({ stats }: ReviewStatsProps) {
  if (stats.total === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">Aucun avis pour le moment</p>
        <p className="text-xs mt-1">
          Soyez le premier à partager votre expérience
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {/* Score global */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-4xl font-bold">{stats.average}</span>
        <StarRating rating={stats.average} size="md" />
        <span className="text-sm text-muted-foreground">
          {stats.total} avis
        </span>
      </div>

      {/* Distribution */}
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.distribution[star] || 0;
          const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-3 text-right text-muted-foreground">
                {star}
              </span>
              <StarRating rating={1} maxStars={1} size="sm" />
              <Progress value={percentage} className="h-2 flex-1" />
              <span className="w-8 text-right text-xs text-muted-foreground">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
