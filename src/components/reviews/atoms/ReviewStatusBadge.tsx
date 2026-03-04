// filepath: src/components/reviews/atoms/ReviewStatusBadge.tsx

import { Badge } from "@/components/ui/badge";

interface ReviewStatusBadgeProps {
  isPublished: boolean;
  flagged: boolean;
}

export function ReviewStatusBadge({
  isPublished,
  flagged,
}: ReviewStatusBadgeProps) {
  if (flagged) {
    return <Badge variant="destructive">Signalé</Badge>;
  }
  if (isPublished) {
    return <Badge variant="default">Publié</Badge>;
  }
  return <Badge variant="secondary">En attente</Badge>;
}
