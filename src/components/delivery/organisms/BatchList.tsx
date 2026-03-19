// filepath: src/components/delivery/organisms/BatchList.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { BatchStatusBadge } from "../atoms/BatchStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import {
  Package,
  MoreVertical,
  Send,
  XCircle,
  FileText,
  Eye,
  MapPin,
  Loader2,
  Download,
} from "lucide-react";
import Link from "next/link";
import type { DeliveryBatchStatus } from "@/constants/deliveryTypes";
import { BatchPDFDownloadButton } from "./BatchPDFDownloadButton";

interface BatchListProps {
  status?: DeliveryBatchStatus;
}

export function BatchList({ status }: BatchListProps) {
  const batches = useQuery(api.delivery.queries.listBatches, { status });
  const transmitBatch = useMutation(api.delivery.mutations.transmitBatch);
  const cancelBatch = useMutation(api.delivery.mutations.cancelBatch);

  const handleTransmit = async (batchId: Id<"delivery_batches">) => {
    try {
      await transmitBatch({ batchId });
      toast.success("Lot transmis à l'administration");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la transmission",
      );
    }
  };

  const handleCancel = async (batchId: Id<"delivery_batches">) => {
    try {
      await cancelBatch({ batchId });
      toast.success("Lot annulé");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'annulation",
      );
    }
  };

  if (batches === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg">Aucun lot de livraison</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mt-1">
            Créez un lot en sélectionnant des commandes prêtes pour livraison.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {batches.map((batch) => (
        <Card key={batch._id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              {/* Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium">
                    {batch.batch_number}
                  </span>
                  <BatchStatusBadge status={batch.status} />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {batch.order_count} commande
                    {batch.order_count > 1 ? "s" : ""}
                  </span>
                  {batch.zone_name && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {batch.zone_name}
                    </span>
                  )}
                  <span>{formatRelativeTime(batch._creationTime)}</span>
                </div>
              </div>

              {/* Amount + Actions */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">
                    {formatPrice(batch.total_delivery_fee, batch.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Frais livraison
                  </p>
                </div>

                {/* PDF Download Button */}
                <BatchPDFDownloadButton batchId={batch._id} />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/vendor/delivery/${batch._id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir le détail
                      </Link>
                    </DropdownMenuItem>

                    {batch.status === "pending" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleTransmit(batch._id)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Transmettre à l'admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCancel(batch._id)}
                          className="text-destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Annuler le lot
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
