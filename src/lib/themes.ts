// filepath: src/lib/themes.ts

// Re-export des thèmes pour usage frontend
// Les thèmes sont définis côté convex pour la validation serveur,
// on duplique les constantes CSS ici pour l'injection client

export const THEME_PRESETS = {
  default: {
    id: "default",
    name: "Classique",
    description: "Design épuré, professionnel et polyvalent",
    preview: {
      primary: "#2563EB",
      secondary: "#1E40AF",
      accent: "#3B82F6",
      background: "#FFFFFF",
      foreground: "#0F172A",
      muted: "#F1F5F9",
    },
    dark: {
      primary: "#3B82F6",
      secondary: "#2563EB",
      accent: "#60A5FA",
      background: "#0F172A",
      foreground: "#F1F5F9",
      muted: "#1E293B",
    },
    borderRadius: "0.5rem",
  },
  modern: {
    id: "modern",
    name: "Minimal",
    description: "Lignes fines, espaces généreux, typographie forte",
    preview: {
      primary: "#18181B",
      secondary: "#27272A",
      accent: "#A1A1AA",
      background: "#FAFAFA",
      foreground: "#09090B",
      muted: "#F4F4F5",
    },
    dark: {
      primary: "#E4E4E7",
      secondary: "#A1A1AA",
      accent: "#71717A",
      background: "#09090B",
      foreground: "#FAFAFA",
      muted: "#18181B",
    },
    borderRadius: "0.25rem",
  },
  classic: {
    id: "classic",
    name: "Vibrant",
    description: "Couleurs vives, contrastes forts, énergie africaine",
    preview: {
      primary: "#EA580C",
      secondary: "#C2410C",
      accent: "#FB923C",
      background: "#FFFBEB",
      foreground: "#1C1917",
      muted: "#FEF3C7",
    },
    dark: {
      primary: "#FB923C",
      secondary: "#EA580C",
      accent: "#FCD34D",
      background: "#1C1917",
      foreground: "#FEF3C7",
      muted: "#292524",
    },
    borderRadius: "0.75rem",
  },
  royal: {
    id: "royal",
    name: "Royal",
    description: "Prestige violet et or, boutique premium",
    preview: {
      primary: "#7C3AED",
      secondary: "#5B21B6",
      accent: "#A78BFA",
      background: "#FDFCFF",
      foreground: "#1E1B2E",
      muted: "#F3F0FF",
    },
    dark: {
      primary: "#A78BFA",
      secondary: "#7C3AED",
      accent: "#C4B5FD",
      background: "#1E1B2E",
      foreground: "#F3F0FF",
      muted: "#2E2740",
    },
    borderRadius: "0.625rem",
  },
  nature: {
    id: "nature",
    name: "Naturel",
    description: "Tons verts, chaleur de la terre et de la nature",
    preview: {
      primary: "#16A34A",
      secondary: "#15803D",
      accent: "#4ADE80",
      background: "#F0FDF4",
      foreground: "#14532D",
      muted: "#DCFCE7",
    },
    dark: {
      primary: "#4ADE80",
      secondary: "#16A34A",
      accent: "#86EFAC",
      background: "#052E16",
      foreground: "#DCFCE7",
      muted: "#14532D",
    },
    borderRadius: "0.625rem",
  },
} as const;

export type ThemePresetId = keyof typeof THEME_PRESETS;
