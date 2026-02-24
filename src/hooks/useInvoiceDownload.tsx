// filepath: src/hooks/useInvoiceDownload.ts

"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { pdf } from "@react-pdf/renderer";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { InvoicePdf } from "@/components/finances/organisms/InvoicePdf";
import { toast } from "sonner";

/**
 * Hook pour télécharger une facture PDF.
 * Utilise @react-pdf/renderer côté client.
 *
 * Usage :
 * ```tsx
 * const { download, isGenerating } = useInvoiceDownload(orderId);
 * <Button onClick={download} disabled={isGenerating}>PDF</Button>
 * ```
 */
export function useInvoiceDownload(orderId: Id<"orders"> | undefined) {
  const [isGenerating, setIsGenerating] = useState(false);

  const invoiceData = useQuery(
    api.finance.queries.getInvoiceData,
    orderId ? { orderId } : "skip",
  );

  const download = useCallback(async () => {
    if (!invoiceData) {
      toast.error("Données de facture non disponibles");
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await pdf(<InvoicePdf data={invoiceData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoiceData.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Facture téléchargée");
    } catch (err) {
      toast.error("Erreur de génération", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [invoiceData]);

  return { download, isGenerating, isReady: !!invoiceData };
}
