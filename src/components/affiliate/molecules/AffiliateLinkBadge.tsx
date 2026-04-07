// filepath: src/components/affiliate/molecules/AffiliateLinkBadge.tsx

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface AffiliateLinkBadgeProps {
  is_active: boolean;
}

export function AffiliateLinkBadge({ is_active }: AffiliateLinkBadgeProps) {
  return is_active ? (
    <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
      <CheckCircle2 className="h-3 w-3" />
      Actif
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <XCircle className="h-3 w-3" />
      Inactif
    </Badge>
  );
}
