// filepath: src/components/analytics/molecules/PeriodSelector.tsx

"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Period = "7d" | "30d" | "90d" | "12m";

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "12m", label: "12 mois" },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as Period)}>
      <TabsList className="h-9">
        {PERIOD_OPTIONS.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            className="text-xs sm:text-sm"
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
