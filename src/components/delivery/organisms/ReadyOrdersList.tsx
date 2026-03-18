// filepath: src/components/delivery/organisms/ReadyOrdersList.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { ReadyOrderCard } from "../molecules/ReadyOrderCard";
import { ZoneGroupHeader } from "../molecules/ZoneGroupHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Package, Truck, Loader2 } from "lucide-react";

// Type d'une commande prête, enrichie par la query listReadyForDelivery
type ReadyOrder = Doc<"orders"> & {
  customer_name: string;
  customer_phone: string;
  zone_name: string;
};

export function ReadyOrdersList() {
  const orders = useQuery(api.delivery.queries.listReadyForDelivery, {}) as
    | ReadyOrder[]
    | undefined;
  const createBatch = useMutation(api.delivery.mutations.createBatch);

  const [selectedOrders, setSelectedOrders] = useState<Set<Id<"orders">>>(
    new Set(),
  );
  const [isCreating, setIsCreating] = useState(false);

  // Grouper les commandes par zone
  const groupedOrders = useMemo(() => {
    if (!orders) return new Map<string, ReadyOrder[]>();

    const groups = new Map<string, ReadyOrder[]>();
    for (const order of orders) {
      const zoneKey = order.zone_name;
      const existing = groups.get(zoneKey) ?? [];
      existing.push(order);
      groups.set(zoneKey, existing);
    }
    return groups;
  }, [orders]);

  const handleSelect = (orderId: Id<"orders">, selected: boolean) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (selected) next.add(orderId);
      else next.delete(orderId);
      return next;
    });
  };

  const handleSelectZone = (zoneName: string, select: boolean) => {
    const zoneOrders = groupedOrders.get(zoneName) ?? [];
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      for (const order of zoneOrders) {
        if (select) next.add(order._id);
        else next.delete(order._id);
      }
      return next;
    });
  };

  const handleCreateBatch = async (groupingType: "zone" | "manual") => {
    if (selectedOrders.size === 0) {
      toast.error("Sélectionnez au moins une commande");
      return;
    }
    setIsCreating(true);
    try {
      const result = await createBatch({
        orderIds: Array.from(selectedOrders),
        groupingType,
      });
      toast.success(
        `Lot ${result.batchNumber} créé avec ${result.orderCount} commande(s)`,
      );
      setSelectedOrders(new Set());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création",
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (orders === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg">Aucune commande prête</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mt-1">
            Les commandes en préparation avec paiement confirmé ou en mode
            "paiement à la livraison" apparaîtront ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      {selectedOrders.size > 0 && (
        <Card className="sticky top-4 z-10 border-primary">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">
                {selectedOrders.size} commande
                {selectedOrders.size > 1 ? "s" : ""} sélectionnée
                {selectedOrders.size > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                Créez un lot pour lancer la livraison
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedOrders(new Set())}
              >
                Annuler
              </Button>
              <Button
                onClick={() => handleCreateBatch("manual")}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4 mr-2" />
                )}
                Créer le lot
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped orders */}
      {Array.from(groupedOrders.entries()).map(([zoneName, zoneOrders]) => {
        const selectedInZone = zoneOrders.filter((o) =>
          selectedOrders.has(o._id),
        ).length;
        return (
          <div key={zoneName} className="space-y-3">
            <ZoneGroupHeader
              zoneName={zoneName}
              orderCount={zoneOrders.length}
              selectedCount={selectedInZone}
              onSelectAll={() => handleSelectZone(zoneName, true)}
              onDeselectAll={() => handleSelectZone(zoneName, false)}
            />
            <div className="space-y-3 pl-4">
              {zoneOrders.map((order) => (
                <ReadyOrderCard
                  key={order._id}
                  order={order}
                  selected={selectedOrders.has(order._id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
