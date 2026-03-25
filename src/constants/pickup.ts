// filepath: src/constants/pickup.ts

import type { Coordinates } from "@/lib/geocoding";

// ─── Pixel-Mart default warehouse (SOBEBRA, Cotonou) ─────────────────────────

export const PIXELMART_WAREHOUSE: Coordinates & { label: string } = {
  lat: 6.3592,
  lon: 2.4364,
  label: "SOBEBRA, Zone Industrielle, Cotonou, Bénin",
};

// ─── Zoom level for the map picker ───────────────────────────────────────────

export const MAP_DEFAULT_ZOOM = 13;
export const MAP_COTONOU_CENTER: Coordinates = { lat: 6.3654, lon: 2.4183 };
