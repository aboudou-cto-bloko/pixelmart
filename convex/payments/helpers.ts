// filepath: convex/payments/helpers.ts

import type { Doc } from "../_generated/dataModel";

// Devises sans sous-unité : 1 "centimes" DB = 1 unité majeure (ex. 5000 centimes = 5000 FCFA)
const NO_SUBUNIT_CURRENCIES = ["XOF", "XAF", "GNF", "CDF"];

/**
 * Convertit les centimes DB vers le montant attendu par Moneroo.
 * - XOF/XAF/GNF/CDF : aucune conversion (1 centimes = 1 FCFA)
 * - Autres devises  : division par 100 (2900 centimes EUR → 29)
 */
export function centimesToMonerooAmount(
  centimes: number,
  currency: string,
): number {
  return NO_SUBUNIT_CURRENCIES.includes(currency)
    ? centimes
    : Math.round(centimes / 100);
}

/**
 * Convertit le montant Moneroo vers les centimes DB.
 * - XOF/XAF/GNF/CDF : aucune conversion
 * - Autres devises  : multiplication par 100
 */
export function monerooAmountToCentimes(
  amount: number,
  currency: string,
): number {
  return NO_SUBUNIT_CURRENCIES.includes(currency) ? amount : amount * 100;
}

/**
 * Moneroo payment statuses → nos statuts internes.
 */
export type MonerooPaymentStatus =
  | "initiated"
  | "pending"
  | "success"
  | "failed"
  | "cancelled";

export function mapMonerooStatusToPaymentStatus(
  status: MonerooPaymentStatus,
): Doc<"orders">["payment_status"] {
  switch (status) {
    case "success":
      return "paid";
    case "failed":
    case "cancelled":
      return "failed";
    case "initiated":
    case "pending":
    default:
      return "pending";
  }
}

/**
 * Vérifie la signature webhook Moneroo (HMAC-SHA256).
 */
export async function verifyMonerooSignature(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );

  const computedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Comparaison timing-safe (longueur constante)
  if (computedSignature.length !== signature.length) return false;

  let mismatch = 0;
  for (let i = 0; i < computedSignature.length; i++) {
    mismatch |= computedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
  }

  return mismatch === 0;
}
