// filepath: src/app/(vendor)/vendor/delivery/page.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { ReadyOrdersList } from "@/components/delivery/organisms/ReadyOrdersList";
import { BatchList } from "@/components/delivery/organisms/BatchList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Truck, Send, CheckCircle } from "lucide-react";

export default function VendorDeliveryPage() {
  const stats = useQuery(api.delivery.queries.getDeliveryStats, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Livraisons</h1>
        <p className="text-muted-foreground">
          Gérez vos lots de livraison et suivez leur progression
        </p>
      </div>

      {/* Stats */}
      {stats === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Prêtes à expédier
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.readyForDeliveryCount}
              </p>
              <p className="text-xs text-muted-foreground">commandes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Lots en attente
              </CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.pendingBatches}</p>
              <p className="text-xs text-muted-foreground">à transmettre</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transmis</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.transmittedBatches}</p>
              <p className="text-xs text-muted-foreground">en traitement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Livrés</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.completedBatches}</p>
              <p className="text-xs text-muted-foreground">lots terminés</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="ready" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ready">Commandes prêtes</TabsTrigger>
          <TabsTrigger value="pending">Lots en attente</TabsTrigger>
          <TabsTrigger value="transmitted">Transmis</TabsTrigger>
          <TabsTrigger value="all">Tous les lots</TabsTrigger>
        </TabsList>

        <TabsContent value="ready">
          <ReadyOrdersList />
        </TabsContent>

        <TabsContent value="pending">
          <BatchList status="pending" />
        </TabsContent>

        <TabsContent value="transmitted">
          <BatchList status="transmitted" />
        </TabsContent>

        <TabsContent value="all">
          <BatchList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
