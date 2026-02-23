// filepath: convex/payments/helpers.ts

import type { Doc } from "../_generated/dataModel";

/**
 * Moneroo attend les montants dans l'unité majeure de la devise.
 * XOF n'a pas de sous-unité : 5000 XOF → envoyer 5000.
 * EUR a des centimes : 2900 centimes → envoyer 29.00 (mais Moneroo attend un entier).
 *
 * Notre DB stocke tout en centimes (1/100).
 * Conversion : moneroo_amount = Math.round(db_centimes / 100)
 */
export function centimesToMonerooAmount(centimes: number): number {
  return Math.round(centimes / 100);
}

/**
 * Inverse : montant Moneroo → centimes DB.
 */
export function monerooAmountToCentimes(amount: number): number {
  return amount * 100;
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
