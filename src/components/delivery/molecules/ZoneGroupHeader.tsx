// filepath: src/components/delivery/molecules/ZoneGroupHeader.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckSquare, Square } from "lucide-react";

interface ZoneGroupHeaderProps {
  zoneName: string;
  orderCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function ZoneGroupHeader({
  zoneName,
  orderCount,
  selectedCount,
  onSelectAll,
  onDeselectAll,
}: ZoneGroupHeaderProps) {
  const allSelected = selectedCount === orderCount;

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-medium">{zoneName}</h3>
          <p className="text-xs text-muted-foreground">
            {orderCount} commande{orderCount > 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <Badge variant="secondary">
            {selectedCount} sélectionnée{selectedCount > 1 ? "s" : ""}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={allSelected ? onDeselectAll : onSelectAll}
        >
          {allSelected ? (
            <>
              <Square className="h-4 w-4 mr-1" />
              Désélectionner
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4 mr-1" />
              Tout sélectionner
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
