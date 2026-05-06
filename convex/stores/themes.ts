// filepath: convex/stores/themes.ts

export const STORE_THEMES = {
  // ── Existing themes (contrast-fixed) ─────────────────────────────────────

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
      mutedForeground: "#475569" as string,
      border: "#CBD5E1" as string,
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
      accent: "#71717A" as string,
      background: "#FAFAFA" as string,
      foreground: "#09090B" as string,
      muted: "#F4F4F5" as string,
      mutedForeground: "#52525B" as string,
      border: "#D4D4D8" as string,
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
      border: "#3F3F46" as string,
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
      mutedForeground: "#78350F" as string,
      border: "#FCD34D" as string, // fix: amber-300 au lieu d'amber-200
    },
    darkColors: {
      primary: "#FB923C" as string,
      primaryForeground: "#1C1917" as string,
      secondary: "#EA580C" as string,
      accent: "#FCD34D" as string,
      background: "#1C1917" as string,
      foreground: "#FEF3C7" as string,
      muted: "#292524" as string,
      mutedForeground: "#D6C9A8" as string,
      border: "#78716C" as string, // fix: stone-500 pour visibilité sur stone-800
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
      muted: "#EDE9FE" as string,
      mutedForeground: "#5B4E9E" as string,
      border: "#C4B5FD" as string, // fix: violet-300 au lieu de violet-200
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
      border: "#5B21B6" as string, // fix: violet-800 pour visibilité sur fond sombre
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
      mutedForeground: "#166534" as string,
      border: "#86EFAC" as string, // fix: green-300 au lieu de green-200
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

  // ── Nouveaux thèmes ───────────────────────────────────────────────────────

  sahel: {
    id: "sahel",
    name: "Sahel",
    description: "Or chaud et terre africaine, chaleur du soleil",
    colors: {
      primary: "#92400E" as string, // amber-800
      primaryForeground: "#FFFBEB" as string,
      secondary: "#78350F" as string,
      accent: "#D97706" as string,
      background: "#FFFDF5" as string,
      foreground: "#1C1200" as string,
      muted: "#FEF3C7" as string,
      mutedForeground: "#6B4A00" as string,
      border: "#FDE68A" as string,
    },
    darkColors: {
      primary: "#FCD34D" as string, // amber-300
      primaryForeground: "#1C1200" as string,
      secondary: "#F59E0B" as string,
      accent: "#FBBF24" as string,
      background: "#1C1107" as string,
      foreground: "#FEF3C7" as string,
      muted: "#2D1C00" as string,
      mutedForeground: "#FCD34D" as string,
      border: "#78350F" as string,
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    borderRadius: "0.5rem",
    cardStyle: "shadow" as const,
  },

  cote: {
    id: "cote",
    name: "Côte",
    description: "Bleus côtiers et teintes océan, fraîcheur atlantique",
    colors: {
      primary: "#0E7490" as string, // cyan-700
      primaryForeground: "#FFFFFF" as string,
      secondary: "#155E75" as string,
      accent: "#06B6D4" as string,
      background: "#F0F9FF" as string,
      foreground: "#0C4A6E" as string,
      muted: "#E0F2FE" as string,
      mutedForeground: "#0369A1" as string,
      border: "#7DD3FC" as string,
    },
    darkColors: {
      primary: "#22D3EE" as string, // cyan-400
      primaryForeground: "#083344" as string,
      secondary: "#06B6D4" as string,
      accent: "#67E8F9" as string,
      background: "#082F3E" as string,
      foreground: "#ECFEFF" as string,
      muted: "#0E4158" as string,
      mutedForeground: "#67E8F9" as string,
      border: "#155E75" as string,
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    borderRadius: "0.625rem",
    cardStyle: "shadow" as const,
  },

  rose: {
    id: "rose",
    name: "Rose",
    description: "Élégance féminine, boutique mode et beauté",
    colors: {
      primary: "#BE185D" as string, // pink-700
      primaryForeground: "#FFFFFF" as string,
      secondary: "#9D174D" as string,
      accent: "#EC4899" as string,
      background: "#FFF5F9" as string,
      foreground: "#500724" as string,
      muted: "#FCE7F3" as string,
      mutedForeground: "#9D174D" as string,
      border: "#F9A8D4" as string,
    },
    darkColors: {
      primary: "#F472B6" as string, // pink-400
      primaryForeground: "#500724" as string,
      secondary: "#EC4899" as string,
      accent: "#F9A8D4" as string,
      background: "#1A0212" as string,
      foreground: "#FCE7F3" as string,
      muted: "#2D0520" as string,
      mutedForeground: "#F9A8D4" as string,
      border: "#831843" as string,
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    borderRadius: "0.75rem",
    cardStyle: "shadow" as const,
  },

  nuit: {
    id: "nuit",
    name: "Nuit",
    description: "Bleu nuit profond, luxueux et sobre",
    colors: {
      primary: "#1E40AF" as string, // blue-800
      primaryForeground: "#FFFFFF" as string,
      secondary: "#1D4ED8" as string,
      accent: "#3B82F6" as string,
      background: "#F8FAFF" as string,
      foreground: "#0F1B4C" as string,
      muted: "#EEF2FF" as string,
      mutedForeground: "#3730A3" as string,
      border: "#A5B4FC" as string,
    },
    darkColors: {
      primary: "#93C5FD" as string, // blue-300
      primaryForeground: "#0F1B4C" as string,
      secondary: "#60A5FA" as string,
      accent: "#BFDBFE" as string,
      background: "#020B1C" as string,
      foreground: "#EFF6FF" as string,
      muted: "#0C1E3D" as string,
      mutedForeground: "#93C5FD" as string,
      border: "#1E3A6E" as string,
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    borderRadius: "0.375rem",
    cardStyle: "border" as const,
  },

  terre: {
    id: "terre",
    name: "Terre",
    description: "Ocre et brique rouge, inspiration artisanat local",
    colors: {
      primary: "#9B1C1C" as string, // red-800
      primaryForeground: "#FFFFFF" as string,
      secondary: "#7F1D1D" as string,
      accent: "#EF4444" as string,
      background: "#FFF5F4" as string,
      foreground: "#3B0A0A" as string,
      muted: "#FEE2E2" as string,
      mutedForeground: "#7F1D1D" as string,
      border: "#FCA5A5" as string,
    },
    darkColors: {
      primary: "#FCA5A5" as string, // red-300
      primaryForeground: "#3B0A0A" as string,
      secondary: "#EF4444" as string,
      accent: "#FCD34D" as string,
      background: "#1C0505" as string,
      foreground: "#FEE2E2" as string,
      muted: "#2C0808" as string,
      mutedForeground: "#FCA5A5" as string,
      border: "#7F1D1D" as string,
    },
    fonts: {
      heading: "'Inter', sans-serif",
      body: "'Inter', sans-serif",
    },
    borderRadius: "0.5rem",
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
