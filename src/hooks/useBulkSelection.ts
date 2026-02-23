// filepath: src/hooks/useBulkSelection.ts

"use client";

import { useCallback, useState } from "react";

interface UseBulkSelectionReturn {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  toggleAll: (allIds: string[]) => void;
  clear: () => void;
  isAllSelected: (allIds: string[]) => boolean;
  count: number;
}

export function useBulkSelection(): UseBulkSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback((allIds: string[]) => {
    setSelectedIds((prev) => {
      if (prev.size === allIds.length) {
        return new Set();
      }
      return new Set(allIds);
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useCallback(
    (allIds: string[]) =>
      allIds.length > 0 && selectedIds.size === allIds.length,
    [selectedIds],
  );

  return {
    selectedIds,
    toggle,
    toggleAll,
    clear,
    isAllSelected,
    count: selectedIds.size,
  };
}
