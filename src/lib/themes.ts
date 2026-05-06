// filepath: src/lib/themes.ts

// Re-export des thèmes pour usage frontend
// Les thèmes sont définis côté convex pour la validation serveur,
// on duplique les constantes CSS ici pour l'injection client

export const THEME_PRESETS = {
  // ── Thèmes existants (contraste corrigé) ─────────────────────────────────

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
      accent: "#71717A",
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
      muted: "#EDE9FE",
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

  // ── Nouveaux thèmes ───────────────────────────────────────────────────────

  sahel: {
    id: "sahel",
    name: "Sahel",
    description: "Or chaud et terre africaine, chaleur du soleil",
    preview: {
      primary: "#92400E",
      secondary: "#78350F",
      accent: "#D97706",
      background: "#FFFDF5",
      foreground: "#1C1200",
      muted: "#FEF3C7",
    },
    dark: {
      primary: "#FCD34D",
      secondary: "#F59E0B",
      accent: "#FBBF24",
      background: "#1C1107",
      foreground: "#FEF3C7",
      muted: "#2D1C00",
    },
    borderRadius: "0.5rem",
  },

  cote: {
    id: "cote",
    name: "Côte",
    description: "Bleus côtiers et teintes océan, fraîcheur atlantique",
    preview: {
      primary: "#0E7490",
      secondary: "#155E75",
      accent: "#06B6D4",
      background: "#F0F9FF",
      foreground: "#0C4A6E",
      muted: "#E0F2FE",
    },
    dark: {
      primary: "#22D3EE",
      secondary: "#06B6D4",
      accent: "#67E8F9",
      background: "#082F3E",
      foreground: "#ECFEFF",
      muted: "#0E4158",
    },
    borderRadius: "0.625rem",
  },

  rose: {
    id: "rose",
    name: "Rose",
    description: "Élégance féminine, boutique mode et beauté",
    preview: {
      primary: "#BE185D",
      secondary: "#9D174D",
      accent: "#EC4899",
      background: "#FFF5F9",
      foreground: "#500724",
      muted: "#FCE7F3",
    },
    dark: {
      primary: "#F472B6",
      secondary: "#EC4899",
      accent: "#F9A8D4",
      background: "#1A0212",
      foreground: "#FCE7F3",
      muted: "#2D0520",
    },
    borderRadius: "0.75rem",
  },

  nuit: {
    id: "nuit",
    name: "Nuit",
    description: "Bleu nuit profond, luxueux et sobre",
    preview: {
      primary: "#1E40AF",
      secondary: "#1D4ED8",
      accent: "#3B82F6",
      background: "#F8FAFF",
      foreground: "#0F1B4C",
      muted: "#EEF2FF",
    },
    dark: {
      primary: "#93C5FD",
      secondary: "#60A5FA",
      accent: "#BFDBFE",
      background: "#020B1C",
      foreground: "#EFF6FF",
      muted: "#0C1E3D",
    },
    borderRadius: "0.375rem",
  },

  terre: {
    id: "terre",
    name: "Terre",
    description: "Ocre et brique rouge, inspiration artisanat local",
    preview: {
      primary: "#9B1C1C",
      secondary: "#7F1D1D",
      accent: "#EF4444",
      background: "#FFF5F4",
      foreground: "#3B0A0A",
      muted: "#FEE2E2",
    },
    dark: {
      primary: "#FCA5A5",
      secondary: "#EF4444",
      accent: "#FCD34D",
      background: "#1C0505",
      foreground: "#FEE2E2",
      muted: "#2C0808",
    },
    borderRadius: "0.5rem",
  },
} as const;

export type ThemePresetId = keyof typeof THEME_PRESETS;
