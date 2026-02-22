import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  draft: { label: "Brouillon", variant: "secondary" as const },
  active: { label: "Actif", variant: "default" as const },
  archived: { label: "Archivé", variant: "outline" as const },
  out_of_stock: { label: "Rupture", variant: "destructive" as const },
} as const;

type ProductStatus = keyof typeof STATUS_CONFIG;

export function StatusBadge({ status }: { status: ProductStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
