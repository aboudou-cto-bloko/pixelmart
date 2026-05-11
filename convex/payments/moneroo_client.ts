// filepath: convex/payments/moneroo_client.ts
// Utilitaires HTTP Moneroo partagés entre les actions de paiement.
// Importable depuis n'importe quelle action Convex (runtime fetch disponible).

export const MONEROO_API_URL = "https://api.moneroo.io/v1";
export const MONEROO_TIMEOUT_MS = 10_000;

export interface MonerooInitResponse {
  message: string;
  data: {
    id: string;
    checkout_url: string;
  };
}

export function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), MONEROO_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id),
  );
}

export function handleMonerooFetchError(err: unknown, context: string): never {
  if ((err as Error).name === "AbortError") {
    throw new Error(
      `Délai d'attente dépassé lors de la connexion à Moneroo (${context}, timeout ${MONEROO_TIMEOUT_MS / 1000}s)`,
    );
  }
  throw err as Error;
}

/** Moneroo peut renvoyer la devise comme string "XOF" ou objet {code:"XOF",...} */
export function parseCurrencyCode(value: unknown, fallback = "XOF"): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (value !== null && typeof value === "object" && "code" in value) {
    const code = (value as { code: unknown }).code;
    if (typeof code === "string" && code.length > 0) return code;
  }
  return fallback;
}

export function buildAuthHeaders(secretKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secretKey}`,
    Accept: "application/json",
  };
}
