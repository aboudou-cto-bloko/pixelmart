// filepath: src/constants/pickup.ts

import type { Coordinates } from "@/lib/geocoding";

// ─── Pixel-Mart default warehouse ────────────────────────────────────────────

export const PIXELMART_WAREHOUSE: Coordinates & { label: string } = {
  lat: 6.4105682373046875,
  lon: 2.328976631164551,
  label: "Point de collecte Pixel-Mart, Cotonou, Bénin",
};

// ─── Zoom level for the map picker ───────────────────────────────────────────

export const MAP_DEFAULT_ZOOM = 15;
export const MAP_COTONOU_CENTER: Coordinates = {
  lat: 6.4105682373046875,
  lon: 2.328976631164551,
};
