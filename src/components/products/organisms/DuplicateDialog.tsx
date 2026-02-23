// filepath: src/components/products/organisms/DuplicateDialog.tsx

"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DuplicateDialogProps {
  open: boolean;
  productTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DuplicateDialog({
  open,
  productTitle,
  onConfirm,
  onCancel,
  isLoading,
}: DuplicateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Dupliquer le produit ?</AlertDialogTitle>
          <AlertDialogDescription>
            Une copie de{" "}
            <span className="font-medium text-foreground">{productTitle}</span>{" "}
            sera créée en brouillon avec toutes ses variantes. Les images seront
            partagées, le SKU et le SEO seront vidés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Duplication…" : "Dupliquer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
