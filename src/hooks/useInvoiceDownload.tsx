// filepath: src/hooks/useInvoiceDownload.ts

"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { pdf } from "@react-pdf/renderer";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { InvoicePdf } from "@/components/finances/organisms/InvoicePdf";
import type { VendorInvoiceInfo } from "@/components/finances/molecules/InvoiceVendorInfoForm";
import { toast } from "sonner";

/**
 * Hook pour télécharger une facture PDF.
 *
 * Les infos vendeur (email, téléphone, adresse, ville) sont
 * passées en paramètre car elles n'existent pas dans le schema stores.
 */
export function useInvoiceDownload(orderId: Id<"orders"> | undefined) {
  const [isGenerating, setIsGenerating] = useState(false);

  const invoiceData = useQuery(
    api.finance.queries.getInvoiceData,
    orderId ? { orderId } : "skip",
  );

  const download = useCallback(
    async (vendorInfo: VendorInvoiceInfo) => {
      if (!invoiceData) {
        toast.error("Données de facture non disponibles");
        return;
      }

      setIsGenerating(true);
      try {
        // Fusionner les données backend + infos vendeur UI
        const fullData = {
          ...invoiceData,
          store: {
            ...invoiceData.store,
            contactEmail: vendorInfo.contactEmail,
            contactPhone: vendorInfo.contactPhone,
            address: vendorInfo.address,
            city: vendorInfo.city,
          },
        };

        const blob = await pdf(<InvoicePdf data={fullData} />).toBlob();
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
    },
    [invoiceData],
  );

  return { download, isGenerating, isReady: !!invoiceData };
}
