// filepath: convex/storage/helpers.ts

import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { STORAGE_FEES, STORAGE_CODE_PREFIX } from "../lib/constants";
import {
  getEffectiveStorageFees,
  getStorageDebtBlockDelayMs,
  type EffectiveStorageFees,
} from "../lib/getConfig";

// ─── Fee Calculation ─────────────────────────────────────────

/**
 * Calcule les frais de stockage en centimes.
 *
 * Palier unités :
 *   ≤ 50 → 100 XOF/unité (10 000 centimes)
 *   > 50 →  60 XOF/unité  ( 6 000 centimes)
 *
 * Palier poids :
 *   0–5 kg   → 0 (inclus)
 *   5–25 kg  → 5 000 XOF forfait
 *   > 25 kg  → 5 000 XOF + 250 XOF/kg supplémentaire
 */
export function computeStorageFee(
  type: "units" | "weight",
  value: number,
  fees: EffectiveStorageFees = STORAGE_FEES,
): number {
  if (value <= 0) return 0;

  if (type === "units") {
    if (value > fees.BULK_THRESHOLD_UNITS) {
      return value * fees.PER_UNIT_BULK;
    }
    return value * fees.PER_UNIT;
  }

  // weight
  if (value <= fees.FREE_MAX_KG) return 0;
  if (value <= fees.MEDIUM_MAX_KG) return fees.MEDIUM_KG_FLAT;

  const extraKg = Math.ceil(value - fees.MEDIUM_MAX_KG);
  return fees.HEAVY_BASE + extraKg * fees.HEAVY_PER_KG;
}

// ─── Code Generation ─────────────────────────────────────────

/**
 * Génère le prochain code de stockage séquentiel (PM-001, PM-002, …).
 * Utilise le nombre total de demandes existantes pour éviter les doublons.
 */
export async function generateStorageCode(ctx: MutationCtx): Promise<string> {
  const allRequests = await ctx.db.query("storage_requests").collect();
  const next = allRequests.length + 1;
  return `${STORAGE_CODE_PREFIX}-${String(next).padStart(3, "0")}`;
}

// ─── Debt Helpers ────────────────────────────────────────────

/**
 * Retourne le montant total de la dette de stockage non réglée pour un store.
 */
export async function getOutstandingDebt(
  ctx: QueryCtx | MutationCtx,
  storeId: Id<"stores">,
): Promise<number> {
  const debts = await ctx.db
    .query("storage_debt")
    .withIndex("by_unsettled", (q) =>
      q.eq("store_id", storeId).eq("settled_at", undefined),
    )
    .collect();

  return debts.reduce((sum, d) => sum + d.amount, 0);
}

/**
 * Retourne true si le store a une facture impayée depuis plus de 30 jours
 * (règle F-06 : blocage retrait produits physiques).
 */
export async function hasBlockingDebt(
  ctx: QueryCtx | MutationCtx,
  storeId: Id<"stores">,
): Promise<boolean> {
  const delayMs = await getStorageDebtBlockDelayMs(ctx);
  const threshold = Date.now() - delayMs;

  const overdue = await ctx.db
    .query("storage_invoices")
    .withIndex("by_status", (q) =>
      q.eq("store_id", storeId).eq("status", "unpaid"),
    )
    .filter((q) => q.lt(q.field("created_at"), threshold))
    .first();

  return overdue !== null;
}

/**
 * Récupère le code de stockage actif pour un produit donné.
 * Retourne undefined si le produit n'est pas stocké en entrepôt.
 */
export async function getStorageCodeForProduct(
  ctx: QueryCtx | MutationCtx,
  productId: Id<"products">,
): Promise<string | undefined> {
  const request = await ctx.db
    .query("storage_requests")
    .withIndex("by_product", (q) => q.eq("product_id", productId))
    .filter((q) => q.eq(q.field("status"), "in_stock"))
    .first();

  return request?.storage_code;
}
