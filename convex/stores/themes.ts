// filepath: convex/stores/themes.ts

export const STORE_THEMES = {
  default: {
    id: "default",
    name: "Classique",
    description: "Design épuré, professionnel et polyvalent",
    colors: {
      primary: "#2563EB" as string,
      primaryForeground: "#FFFFFF" as string,
      secondary: "#1E40AF" as string,
      accent: "#3B82F6" as string,
      background: "#FFFFFF" as string,
      foreground: "#0F172A" as string,
      muted: "#F1F5F9" as string,
      mutedForeground: "#64748B" as string,
      border: "#E2E8F0" as string,
    },
    darkColors: {
      primary: "#3B82F6" as string,
      primaryForeground: "#FFFFFF" as string,
      secondary: "#2563EB" as string,
      accent: "#60A5FA" as string,
      background: "#0F172A" as string,
      foreground: "#F1F5F9" as string,
      muted: "#1E293B" as string,
      mutedForeground: "#94A3B8" as string,
      border: "#334155" as string,
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
      primaryForeground: "#FFFFFF" as string,
      secondary: "#27272A" as string,
      accent: "#A1A1AA" as string,
      background: "#FAFAFA" as string,
      foreground: "#09090B" as string,
      muted: "#F4F4F5" as string,
      mutedForeground: "#71717A" as string,
      border: "#E4E4E7" as string,
    },
    darkColors: {
      primary: "#E4E4E7" as string,
      primaryForeground: "#09090B" as string,
      secondary: "#A1A1AA" as string,
      accent: "#71717A" as string,
      background: "#09090B" as string,
      foreground: "#FAFAFA" as string,
      muted: "#18181B" as string,
      mutedForeground: "#A1A1AA" as string,
      border: "#27272A" as string,
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
      primaryForeground: "#FFFFFF" as string,
      secondary: "#C2410C" as string,
      accent: "#FB923C" as string,
      background: "#FFFBEB" as string,
      foreground: "#1C1917" as string,
      muted: "#FEF3C7" as string,
      mutedForeground: "#78716C" as string,
      border: "#FDE68A" as string,
    },
    darkColors: {
      primary: "#FB923C" as string,
      primaryForeground: "#1C1917" as string,
      secondary: "#EA580C" as string,
      accent: "#FCD34D" as string,
      background: "#1C1917" as string,
      foreground: "#FEF3C7" as string,
      muted: "#292524" as string,
      mutedForeground: "#A8A29E" as string,
      border: "#44403C" as string,
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    borderRadius: "0.75rem",
    cardStyle: "shadow" as const,
  },
  royal: {
    id: "royal",
    name: "Royal",
    description: "Prestige violet et or, boutique premium",
    colors: {
      primary: "#7C3AED" as string,
      primaryForeground: "#FFFFFF" as string,
      secondary: "#5B21B6" as string,
      accent: "#A78BFA" as string,
      background: "#FDFCFF" as string,
      foreground: "#1E1B2E" as string,
      muted: "#F3F0FF" as string,
      mutedForeground: "#6D6A85" as string,
      border: "#DDD6FE" as string,
    },
    darkColors: {
      primary: "#A78BFA" as string,
      primaryForeground: "#1E1B2E" as string,
      secondary: "#7C3AED" as string,
      accent: "#C4B5FD" as string,
      background: "#1E1B2E" as string,
      foreground: "#F3F0FF" as string,
      muted: "#2E2740" as string,
      mutedForeground: "#9D93BE" as string,
      border: "#3D3561" as string,
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    borderRadius: "0.625rem",
    cardStyle: "shadow" as const,
  },
  nature: {
    id: "nature",
    name: "Naturel",
    description: "Tons verts, chaleur de la terre et de la nature",
    colors: {
      primary: "#16A34A" as string,
      primaryForeground: "#FFFFFF" as string,
      secondary: "#15803D" as string,
      accent: "#4ADE80" as string,
      background: "#F0FDF4" as string,
      foreground: "#14532D" as string,
      muted: "#DCFCE7" as string,
      mutedForeground: "#6B7E74" as string,
      border: "#BBF7D0" as string,
    },
    darkColors: {
      primary: "#4ADE80" as string,
      primaryForeground: "#052E16" as string,
      secondary: "#16A34A" as string,
      accent: "#86EFAC" as string,
      background: "#052E16" as string,
      foreground: "#DCFCE7" as string,
      muted: "#14532D" as string,
      mutedForeground: "#86EFAC" as string,
      border: "#166534" as string,
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    borderRadius: "0.625rem",
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
  darkMode = false,
): Record<string, string> {
  const colors = darkMode ? { ...theme.darkColors } : { ...theme.colors };
  if (primaryOverride && !darkMode) {
    colors.primary = primaryOverride;
  }

  return {
    // Shop-specific variables (used directly in components)
    "--shop-primary": colors.primary,
    "--shop-primary-foreground": colors.primaryForeground,
    "--shop-secondary": colors.secondary,
    "--shop-accent": colors.accent,
    "--shop-background": colors.background,
    "--shop-foreground": colors.foreground,
    "--shop-muted": colors.muted,
    "--shop-muted-foreground": colors.mutedForeground,
    "--shop-border": colors.border,
    "--shop-radius": theme.borderRadius,
    "--shop-font-heading": theme.fonts.heading,
    "--shop-font-body": theme.fonts.body,
  };
}
