// filepath: src/app/(vendor)/vendor/finance/invoices/page.tsx

"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { pdf } from "@react-pdf/renderer";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { InvoiceListTemplate } from "@/components/finances/templates/InvoiceListTemplate";

export default function VendorInvoicesPage() {
  const [generatingId, setGeneratingId] = useState<string | undefined>();

  const invoices = useQuery(api.finance.queries.listInvoiceableOrders, {});

  const handleGeneratePdf = useCallback(async (orderId: string) => {
    setGeneratingId(orderId);
    try {
      // 1. Fetch les données de facture depuis Convex
      // On utilise une approche différente : les données sont déjà dans la liste,
      // mais on a besoin des données complètes via getInvoiceData.
      // Comme useQuery est un hook, on utilise fetch direct via convexClient.
      // Alternative : on pré-charge via useQuery conditionnel.

      // Workaround: appel fetch vers le backend Convex
      // En réalité, on va utiliser un composant intermédiaire.
      // Pour la V1, on utilise les données disponibles inline.

      toast.error(
        "Utilisez le bouton depuis la page détail commande pour le moment",
      );
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : "Erreur inconnue",
      });
    } finally {
      setGeneratingId(undefined);
    }
  }, []);

  return (
    <InvoiceListTemplate
      invoices={invoices ?? undefined}
      isLoading={invoices === undefined}
      onGeneratePdf={handleGeneratePdf}
      isGenerating={generatingId}
    />
  );
}
