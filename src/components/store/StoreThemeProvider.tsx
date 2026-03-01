// filepath: src/components/store/StoreThemeProvider.tsx

"use client";

import { useMemo, type ReactNode } from "react";
import { THEME_PRESETS, type ThemePresetId } from "@/lib/themes";

interface StoreThemeProviderProps {
  themeId: string;
  primaryColor?: string;
  children: ReactNode;
}

export function StoreThemeProvider({
  themeId,
  primaryColor,
  children,
}: StoreThemeProviderProps) {
  const cssVariables = useMemo(() => {
    const preset =
      THEME_PRESETS[themeId as ThemePresetId] ?? THEME_PRESETS.default;
    const vars: Record<string, string> = {
      "--store-primary": primaryColor || preset.preview.primary,
      "--store-secondary": preset.preview.secondary,
      "--store-accent": preset.preview.accent,
      "--store-background": preset.preview.background,
      "--store-foreground": preset.preview.foreground,
      "--store-muted": preset.preview.muted,
      "--store-radius": preset.borderRadius,
    };
    return vars;
  }, [themeId, primaryColor]);

  return <div style={cssVariables as React.CSSProperties}>{children}</div>;
}
