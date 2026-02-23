// filepath: src/components/products/molecules/BulkActionBar.tsx

"use client";

import { Archive, CheckCircle, FileX, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulkCounter } from "../atoms/BulkCounter";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onArchive: () => void;
  onActivate: () => void;
  onDraft: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  onArchive,
  onActivate,
  onDraft,
  onDelete,
  onClearSelection,
  isLoading,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3",
        "rounded-lg border bg-background px-4 py-3 shadow-lg",
        className,
      )}
    >
      <BulkCounter count={selectedCount} total={totalCount} />

      <div className="h-5 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onActivate}
          disabled={isLoading}
        >
          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
          Publier
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDraft}
          disabled={isLoading}
        >
          <FileX className="mr-1.5 h-3.5 w-3.5" />
          Brouillon
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onArchive}
          disabled={isLoading}
        >
          <Archive className="mr-1.5 h-3.5 w-3.5" />
          Archiver
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isLoading}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Supprimer
        </Button>
      </div>

      <div className="h-5 w-px bg-border" />

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onClearSelection}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Désélectionner</span>
      </Button>
    </div>
  );
}
