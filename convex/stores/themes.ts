// filepath: convex/stores/themes.ts

export const STORE_THEMES = {
  default: {
    id: "default",
    name: "Classique",
    description: "Design épuré, professionnel et polyvalent",
    colors: {
      primary: "#2563EB" as string,
      secondary: "#1E40AF" as string,
      accent: "#3B82F6" as string,
      background: "#FFFFFF" as string,
      foreground: "#0F172A" as string,
      muted: "#F1F5F9" as string,
      mutedForeground: "#64748B" as string,
      border: "#E2E8F0" as string,
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    borderRadius: "0.5rem",
    cardStyle: "shadow" as const,
  },
  modern: {
    id: "modern",
    name: "Minimal",
    description: "Lignes fines, espaces généreux, typographie forte",
    colors: {
      primary: "#18181B" as string,
      secondary: "#27272A" as string,
      accent: "#A1A1AA" as string,
      background: "#FAFAFA" as string,
      foreground: "#09090B" as string,
      muted: "#F4F4F5" as string,
      mutedForeground: "#71717A" as string,
      border: "#E4E4E7" as string,
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    borderRadius: "0.25rem",
    cardStyle: "border" as const,
  },
  classic: {
    id: "classic",
    name: "Vibrant",
    description: "Couleurs vives, contrastes forts, énergie africaine",
    colors: {
      primary: "#EA580C" as string,
      secondary: "#C2410C" as string,
      accent: "#FB923C" as string,
      background: "#FFFBEB" as string,
      foreground: "#1C1917" as string,
      muted: "#FEF3C7" as string,
      mutedForeground: "#78716C" as string,
      border: "#FDE68A" as string,
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    borderRadius: "0.75rem",
    cardStyle: "shadow" as const,
  },
} as const;

export type ThemeId = keyof typeof STORE_THEMES;
export type StoreTheme = (typeof STORE_THEMES)[ThemeId];

export function getThemeById(id: string): StoreTheme {
  if (id in STORE_THEMES) {
    return STORE_THEMES[id as ThemeId];
  }
  return STORE_THEMES.default;
}

export function buildCssVariables(
  theme: StoreTheme,
  primaryOverride?: string,
): Record<string, string> {
  const colors = { ...theme.colors };
  if (primaryOverride) {
    colors.primary = primaryOverride;
  }

  return {
    "--store-primary": colors.primary,
    "--store-secondary": colors.secondary,
    "--store-accent": colors.accent,
    "--store-background": colors.background,
    "--store-foreground": colors.foreground,
    "--store-muted": colors.muted,
    "--store-muted-foreground": colors.mutedForeground,
    "--store-border": colors.border,
    "--store-radius": theme.borderRadius,
    "--store-font-heading": theme.fonts.heading,
    "--store-font-body": theme.fonts.body,
  };
}
