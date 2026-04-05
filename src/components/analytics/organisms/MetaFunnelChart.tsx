// filepath: src/components/analytics/organisms/MetaFunnelChart.tsx

"use client";

import {
  Eye,
  MousePointerClick,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FunnelStep {
  name:
    | "PageView"
    | "ViewContent"
    | "AddToCart"
    | "InitiateCheckout"
    | "Purchase";
  count: number;
  conversionRate: number;
}

interface MetaFunnelData {
  hasPixel: boolean;
  pixelId: string | null;
  funnel: FunnelStep[];
}

interface MetaFunnelChartProps {
  data: MetaFunnelData | null | undefined;
  isLoading?: boolean;
}

const STEP_CONFIG: Record<
  FunnelStep["name"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  PageView: {
    label: "Pages vues",
    icon: <Eye className="size-4" />,
    color: "bg-blue-500",
  },
  ViewContent: {
    label: "Produits consultés",
    icon: <MousePointerClick className="size-4" />,
    color: "bg-violet-500",
  },
  AddToCart: {
    label: "Ajouts au panier",
    icon: <ShoppingBag className="size-4" />,
    color: "bg-orange-500",
  },
  InitiateCheckout: {
    label: "Checkouts initiés",
    icon: <ShoppingCart className="size-4" />,
    color: "bg-amber-500",
  },
  Purchase: {
    label: "Achats confirmés",
    icon: <CreditCard className="size-4" />,
    color: "bg-green-500",
  },
};

export function MetaFunnelChart({ data, isLoading }: MetaFunnelChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data?.hasPixel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Funnel Meta Pixel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <p className="text-sm font-medium">Aucun Pixel configuré</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Connectez votre Meta Pixel dans{" "}
              <strong>Paramètres → Meta Pixel</strong> pour visualiser votre
              funnel Facebook/Instagram.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.funnel.map((s) => s.count), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">
            Funnel Meta Pixel
          </CardTitle>
          {data.pixelId && (
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
              Pixel {data.pixelId}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Événements envoyés à Facebook — données du pixel actif uniquement
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.funnel.map((step, i) => {
          const config = STEP_CONFIG[step.name];
          const widthPct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
          return (
            <div key={step.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {config.icon}
                  <span className="font-medium text-foreground">
                    {config.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {i > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {step.conversionRate}% de conv.
                    </span>
                  )}
                  <span className="font-semibold tabular-nums">
                    {step.count.toLocaleString("fr-FR")}
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${config.color}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
