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
    borderRadius: "0.75rem",
  },
} as const;

export type ThemePresetId = keyof typeof THEME_PRESETS;
