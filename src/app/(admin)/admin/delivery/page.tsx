// filepath: src/app/(admin)/admin/delivery/page.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminDeliveryTemplate } from "@/components/admin/templates/AdminDeliveryTemplate";
import { AdminDeliveryBatchesTemplate } from "@/components/admin/templates/AdminDeliveryBatchesTemplate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bike, Truck } from "lucide-react";

export default function AdminDeliveryPage() {
  const rates = useQuery(api.admin.queries.listDeliveryRates);
  const batches = useQuery(api.admin.queries.listBatchesAdmin, {});
  const stats = useQuery(api.admin.queries.getDeliveryAdminStats);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Livraison</h1>
        <p className="text-sm text-muted-foreground">
          Gestion des lots de livraison et configuration des tarifs
        </p>
      </div>

      <Tabs defaultValue="batches">
        <TabsList>
          <TabsTrigger value="batches" className="gap-1.5">
            <Truck className="size-3.5" />
            Lots de livraison
            {(stats?.transmitted ?? 0) > 0 && (
              <span className="ml-1 rounded-full bg-blue-600 text-white text-xs w-4 h-4 flex items-center justify-center">
                {stats!.transmitted}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rates" className="gap-1.5">
            <Bike className="size-3.5" />
            Tarifs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="mt-4">
          <AdminDeliveryBatchesTemplate
            batches={batches ?? []}
            stats={
              stats ?? {
                transmitted: 0,
                assigned: 0,
                in_progress: 0,
                completed_today: 0,
                total_fees_all: 0,
              }
            }
          />
        </TabsContent>

        <TabsContent value="rates" className="mt-4">
          <AdminDeliveryTemplate rates={rates ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
