// filepath: src/components/returns/ReturnReasonBadge.tsx
"use client";

import { Badge } from "@/components/ui/badge";

export type ReasonCategory =
  | "defective"
  | "wrong_item"
  | "not_as_described"
  | "changed_mind"
  | "damaged_in_transit"
  | "other";

const REASON_LABELS: Record<ReasonCategory, string> = {
  defective: "Défectueux",
  wrong_item: "Mauvais article",
  not_as_described: "Non conforme",
  changed_mind: "Changement d'avis",
  damaged_in_transit: "Endommagé (transport)",
  other: "Autre",
};

interface ReturnReasonBadgeProps {
  category: ReasonCategory;
}

export function ReturnReasonBadge({ category }: ReturnReasonBadgeProps) {
  return (
    <Badge variant="secondary" className="text-xs font-normal">
      {REASON_LABELS[category] ?? category}
    </Badge>
  );
}
