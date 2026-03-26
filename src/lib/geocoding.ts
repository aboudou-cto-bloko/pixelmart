// filepath: src/lib/geocoding.ts

/**
 * Geocoding utilities using OpenStreetMap Nominatim API.
 * Free, no API key required, 1 request/second rate limit.
 *
 * @see https://nominatim.org/release-docs/latest/api/Search/
 */

// ─── Types ───────────────────────────────────────────────────

export interface GeocodingResult {
  placeId: string;
  displayName: string;
  lat: number;
  lon: number;
  city?: string;
  country?: string;
  countryCode?: string;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

// Types pour la réponse Nominatim
interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  country?: string;
  country_code?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: NominatimAddress;
}

// ─── Nominatim API ───────────────────────────────────────────

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "PixelMart/1.0 (contact@pixelmart.com)";

/**
 * Search for addresses using Nominatim.
 *
 * @param query - Search query (address, city, etc.)
 * @param countryCode - Optional ISO country code to restrict results (e.g., "bj" for Benin)
 * @returns Array of geocoding results
 */
export async function searchAddress(
  query: string,
  countryCode?: string,
): Promise<GeocodingResult[]> {
  if (!query || query.length < 3) return [];

  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: "5",
  });

  if (countryCode) {
    params.set("countrycodes", countryCode.toLowerCase());
  }

  try {
    const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("Nominatim error:", response.status);
      return [];
    }

    const data = (await response.json()) as NominatimResult[];

    return data.map((item) => ({
      placeId: item.place_id.toString(),
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      city: item.address?.city || item.address?.town || item.address?.village,
      country: item.address?.country,
      countryCode: item.address?.country_code?.toUpperCase(),
    }));
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
}

/**
 * Reverse geocoding: coordinates → address.
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    format: "json",
    addressdetails: "1",
  });

  try {
    const response = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as NominatimResult;

    return {
      placeId: data.place_id.toString(),
      displayName: data.display_name,
      lat: parseFloat(data.lat),
      lon: parseFloat(data.lon),
      city: data.address?.city || data.address?.town || data.address?.village,
      country: data.address?.country,
      countryCode: data.address?.country_code?.toUpperCase(),
    };
  } catch {
    return null;
  }
}

// ─── Distance Calculation ────────────────────────────────────

/**
 * Calculate the distance between two points using the Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(to.lat - from.lat);
  const dLon = toRadians(to.lon - from.lon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// ─── Default Collection Points (Cotonou) ─────────────────────

/**
 * Points de collecte par défaut à Cotonou.
 * Les vendeurs peuvent configurer leur propre point de collecte.
 */
export const DEFAULT_COLLECTION_POINTS: Record<string, Coordinates> = {
  // Point de collecte Pixel-Mart
  cotonou_center: { lat: 6.4105682373046875, lon: 2.328976631164551 },
  // Akpakpa
  akpakpa: { lat: 6.355, lon: 2.435 },
  // Cadjèhoun
  cadjehoun: { lat: 6.373, lon: 2.395 },
  // Godomey
  godomey: { lat: 6.38, lon: 2.345 },
};

/**
 * Point de collecte par défaut Pixel-Mart.
 */
export const DEFAULT_COLLECTION_POINT =
  DEFAULT_COLLECTION_POINTS.cotonou_center;

/**
 * Calculate delivery distance from default collection point.
 */
export function calculateDeliveryDistance(
  deliveryAddress: Coordinates,
  collectionPoint: Coordinates = DEFAULT_COLLECTION_POINT,
): number {
  return calculateDistance(collectionPoint, deliveryAddress);
}
