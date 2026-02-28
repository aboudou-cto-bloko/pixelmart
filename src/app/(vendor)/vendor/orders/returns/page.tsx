// filepath: src/app/(vendor)/orders/returns/page.tsx
"use client";

import { VendorReturnTable } from "@/components/returns/VendorReturnTable";
import { RotateCcw } from "lucide-react";

export default function VendorReturnsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <RotateCcw className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Gestion des retours</h1>
          <p className="text-sm text-muted-foreground">
            Examinez, approuvez et traitez les demandes de retour de vos
            clients.
          </p>
        </div>
      </div>

      <VendorReturnTable />
    </div>
  );
}
