// filepath: src/components/delivery/organisms/BatchPDFDownloadButton.tsx

"use client";

import { useDeliveryBatchPDF } from "@/hooks/useDeliveryBatchPDF";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BatchPDFDownloadButtonProps {
  batchId: Id<"delivery_batches">;
}

export function BatchPDFDownloadButton({
  batchId,
}: BatchPDFDownloadButtonProps) {
  const { download, isGenerating, error, isReady } = useDeliveryBatchPDF({
    batchId,
  });

  const handleDownload = async () => {
    try {
      await download();
      toast.success("PDF téléchargé");
    } catch {
      toast.error("Erreur lors du téléchargement");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isGenerating || !isReady}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      <span className="sr-only">Télécharger PDF</span>
    </Button>
  );
}
