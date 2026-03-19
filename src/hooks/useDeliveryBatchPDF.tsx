// filepath: src/hooks/useDeliveryBatchPDF.ts

"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { pdf } from "@react-pdf/renderer";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  DeliveryBatchPDF,
  type BatchPDFData,
  type OrderForPDF,
} from "@/components/delivery/pdf";

// ─── Types ───────────────────────────────────────────────────

interface UseDeliveryBatchPDFOptions {
  batchId: Id<"delivery_batches">;
}

interface UseDeliveryBatchPDFReturn {
  download: () => Promise<void>;
  isGenerating: boolean;
  error: string | null;
  isReady: boolean;
}

// ─── Hook ────────────────────────────────────────────────────

export function useDeliveryBatchPDF({
  batchId,
}: UseDeliveryBatchPDFOptions): UseDeliveryBatchPDFReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les données du lot
  const batchDetail = useQuery(api.delivery.queries.getBatchDetail, {
    batchId,
  });

  const isReady = batchDetail !== undefined && batchDetail !== null;

  const download = useCallback(async () => {
    if (!batchDetail) {
      setError("Données du lot non disponibles");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Filtrer les ordres null
      const validOrders = batchDetail.orders.filter(
        (order): order is NonNullable<typeof order> => order !== null,
      );

      // Transformer les commandes pour le PDF
      const ordersForPDF: OrderForPDF[] = validOrders.map((order) => ({
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        address_line1: order.shipping_address.line1,
        address_city: order.shipping_address.city,
        payment_mode: (order.payment_mode ?? "online") as "online" | "cod",
        total_amount: order.total_amount,
        delivery_fee: order.delivery_fee ?? 0,
        items_count: order.items.reduce(
          (sum, item) => sum + (item.quantity ?? 0),
          0,
        ),
        notes: order.notes,
      }));

      // Calculer le total à collecter (COD uniquement)
      const totalToCollect = ordersForPDF
        .filter((o) => o.payment_mode === "cod")
        .reduce((sum, o) => sum + o.total_amount, 0);

      // Construire les données pour le PDF
      const pdfData: BatchPDFData = {
        batch_number: batchDetail.batch_number,
        created_at: new Date(batchDetail._creationTime).toISOString(),
        store_name: batchDetail.store_name ?? "Boutique",
        store_phone: "+229 01 ______",
        store_address: "____________________",
        zone_name: batchDetail.zone_name,
        currency: batchDetail.currency,
        total_delivery_fee: batchDetail.total_delivery_fee,
        total_to_collect: totalToCollect,
        orders: ordersForPDF,
      };

      // Générer le PDF
      const blob = await pdf(<DeliveryBatchPDF data={pdfData} />).toBlob();

      // Télécharger
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${batchDetail.batch_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur génération PDF:", err);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la génération",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [batchDetail]);

  return {
    download,
    isGenerating,
    error,
    isReady,
  };
}
