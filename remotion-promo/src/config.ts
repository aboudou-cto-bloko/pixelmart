// ============================================================
// PIXEL-MART PROMO — Remotion Configuration
// All timing constants, spring configs, and easing curves
// ============================================================

// ── Video specs ──────────────────────────────────────────────
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;
export const DURATION_IN_FRAMES = 1350; // 45 seconds

// ── Safe zones ───────────────────────────────────────────────
export const SAFE_TOP = 80;
export const SAFE_BOTTOM = 120;
export const SAFE_SIDES = 40;

// ── Color palette ─────────────────────────────────────────────
export const COLORS = {
  black: "#0A0A0A",
  orange: "#F97316",
  white: "#FFFFFF",
  green: "#22C55E",
  glass: "rgba(255, 255, 255, 0.07)",
  glassBorder: "rgba(255, 255, 255, 0.15)",
  glassShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
  glassInset: "inset 0 1px 0 rgba(255,255,255,0.1)",
} as const;

// ── Scene frame ranges ────────────────────────────────────────
export const SCENES = {
  intro: { start: 0, end: 60 },
  createStore: { start: 60, end: 180 },
  addProduct: { start: 180, end: 420 },
  order: { start: 420, end: 660 },
  delivery: { start: 660, end: 900 },
  dashboard: { start: 900, end: 1140 },
  outro: { start: 1140, end: 1350 },
} as const;

// ── Beat / tempo reference (95 BPM → 30fps) ──────────────────
export const BEAT = 19;      // 1 beat
export const MEASURE = 76;   // 4 beats
export const HALF = 38;      // 2 beats

// ── Spring configs ────────────────────────────────────────────
export const SPRINGS = {
  logo: { stiffness: 200, damping: 22 },
  form: { stiffness: 260, damping: 18 },
  button: { stiffness: 240, damping: 20 },
  badge: { stiffness: 420, damping: 14 },
  notification: { stiffness: 260, damping: 18 },
  toggle: { stiffness: 340, damping: 18 },
  snappy: { stiffness: 380, damping: 16 },
  card: { stiffness: 300, damping: 20 },
} as const;

// ── Easing bezier curves ──────────────────────────────────────
// For use with Easing.bezier() from remotion
export const BEZIER = {
  enter: [0.2, 0.9, 0.4, 1.1] as [number, number, number, number],
  exit:  [0.4, 0.0, 1.0, 1.0] as [number, number, number, number],
  easeInOut: [0.4, 0.0, 0.2, 1.0] as [number, number, number, number],
} as const;

// ── Timing per element weight ─────────────────────────────────
export const TIMING = {
  badge: 10,        // 8–12 frames
  button: 14,       // 12–16 frames
  form: 20,         // 18–24 frames
  exitFast: 8,      // exits are shorter than entrances
} as const;

// ── Glass card style helper ───────────────────────────────────
export const GLASS_STYLE: React.CSSProperties = {
  background: COLORS.glass,
  border: `1px solid ${COLORS.glassBorder}`,
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  boxShadow: `${COLORS.glassShadow}, ${COLORS.glassInset}`,
  borderRadius: 20,
};
