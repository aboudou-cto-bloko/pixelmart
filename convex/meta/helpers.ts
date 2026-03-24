// filepath: convex/meta/helpers.ts
// ⚠️ Ce fichier s'exécute dans le runtime Convex (pas Node.js).
// On utilise l'API Web Crypto (crypto.subtle) au lieu du module "crypto" Node.

/**
 * Hash une valeur pour Meta CAPI (SHA-256, lowercase, trimmed).
 */
export async function hashForMeta(
  value: string | undefined,
): Promise<string | undefined> {
  if (!value) return undefined;
  const normalized = value.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Génère un event_id unique pour la déduplication Pixel/CAPI.
 */
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Formate les données utilisateur pour Meta CAPI.
 * Hash automatiquement les PII (email, phone, name).
 */
export async function formatUserData(userData: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
}): Promise<Record<string, string | undefined>> {
  const [em, ph, fn, ln, ct, country] = await Promise.all([
    hashForMeta(userData.email),
    hashForMeta(userData.phone?.replace(/\D/g, "")),
    hashForMeta(userData.firstName),
    hashForMeta(userData.lastName),
    hashForMeta(userData.city),
    hashForMeta(userData.country),
  ]);

  return {
    em,
    ph,
    fn,
    ln,
    ct,
    country,
    client_ip_address: userData.clientIpAddress,
    client_user_agent: userData.clientUserAgent,
    fbc: userData.fbc,
    fbp: userData.fbp,
  };
}

/**
 * Formate les données custom pour Meta CAPI.
 * Convertit les centimes en unités pour la valeur.
 */
export function formatCustomData(data: {
  contentIds?: string[];
  contentType?: "product" | "product_group";
  value?: number; // en centimes
  currency?: string;
  numItems?: number;
  orderId?: string;
}): Record<string, unknown> {
  return {
    content_ids: data.contentIds,
    content_type: data.contentType ?? "product",
    value: data.value !== undefined ? data.value / 100 : undefined, // centimes → FCFA
    currency: data.currency ?? "XOF",
    num_items: data.numItems,
    order_id: data.orderId,
  };
}
