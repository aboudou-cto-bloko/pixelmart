// filepath: src/components/affiliate/molecules/AffiliateStatCard.tsx

import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface AffiliateStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  highlight?: boolean;
}

export function AffiliateStatCard({
  label,
  value,
  icon: Icon,
  description,
  highlight = false,
}: AffiliateStatCardProps) {
  return (
    <Card className={highlight ? "border-primary/40 bg-primary/5" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
              className={`text-2xl font-bold tabular-nums ${highlight ? "text-primary" : ""}`}
            >
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div
            className={`rounded-lg p-2 ${highlight ? "bg-primary/10" : "bg-muted"}`}
          >
            <Icon
              className={`h-4 w-4 ${highlight ? "text-primary" : "text-muted-foreground"}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
