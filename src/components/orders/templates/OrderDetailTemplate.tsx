// filepath: src/components/orders/templates/OrderDetailTemplate.tsx

"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderDetailPanel } from "../organisms/OrderDetailPanel";
import type { Id } from "../../../../convex/_generated/dataModel";

interface OrderDetailTemplateProps {
  order: Parameters<typeof OrderDetailPanel>[0]["order"];
  onBack: () => void;
}

export function OrderDetailTemplate({
  order,
  onBack,
}: OrderDetailTemplateProps) {
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Retour aux commandes
      </Button>

      <OrderDetailPanel order={order} />
    </div>
  );
}
