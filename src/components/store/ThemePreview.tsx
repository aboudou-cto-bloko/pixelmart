// filepath: src/components/store/ThemePreview.tsx

"use client";

import { THEME_PRESETS, type ThemePresetId } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ThemePreviewProps {
  themeId: ThemePresetId;
  isSelected: boolean;
  onSelect: (id: ThemePresetId) => void;
}

export function ThemePreview({
  themeId,
  isSelected,
  onSelect,
}: ThemePreviewProps) {
  const theme = THEME_PRESETS[themeId];

  return (
    <button
      type="button"
      onClick={() => onSelect(themeId)}
      className={cn(
        "relative w-full rounded-lg border-2 p-4 text-left transition-all",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-muted hover:border-muted-foreground/30",
      )}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 rounded-full bg-primary p-1">
          <Check className="size-3 text-primary-foreground" />
        </div>
      )}

      {/* Aperçu miniature */}
      <div
        className="mb-3 overflow-hidden rounded"
        style={{
          backgroundColor: theme.preview.background,
          borderRadius: theme.borderRadius,
        }}
      >
        {/* Mini header */}
        <div
          className="h-8 flex items-center px-3"
          style={{ backgroundColor: theme.preview.primary }}
        >
          <div className="h-2 w-12 rounded-full bg-white/60" />
        </div>

        {/* Mini content */}
        <div className="p-3 space-y-2">
          <div
            className="h-2 w-3/4 rounded"
            style={{ backgroundColor: theme.preview.foreground + "30" }}
          />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 flex-1 rounded"
                style={{ backgroundColor: theme.preview.muted }}
              />
            ))}
          </div>
          <div
            className="h-6 w-20 rounded"
            style={{
              backgroundColor: theme.preview.primary,
              borderRadius: theme.borderRadius,
            }}
          />
        </div>
      </div>

      <p className="font-semibold text-sm">{theme.name}</p>
      <p className="text-xs text-muted-foreground">{theme.description}</p>
    </button>
  );
}
