// filepath: convex/lib/getConfig.ts

/**
 * DB-first config helpers.
 *
 * Each getter reads the `platform_config` table and falls back to the
 * hardcoded constant when no override has been saved by an admin.
 */

import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  COMMISSION_RATES,
  CANCELLATION_WINDOW_MS,
  BALANCE_RELEASE_DELAY_MS,
  STORAGE_FEES,
  STORAGE_DEBT_BLOCK_DELAY_MS,
  type SubscriptionTier,
} from "./constants";

type AnyCtx = QueryCtx | MutationCtx;

async function getConfigValue(
  ctx: AnyCtx,
  key: string,
  fallback: number,
): Promise<number> {
  const row = await ctx.db
    .query("platform_config")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  return row?.value ?? fallback;
}

// ─── Order helpers ────────────────────────────────────────────

export async function getCancellationWindowMs(ctx: AnyCtx): Promise<number> {
  return getConfigValue(ctx, "cancellation_window_ms", CANCELLATION_WINDOW_MS);
}

export async function getBalanceReleaseDelayMs(ctx: AnyCtx): Promise<number> {
  return getConfigValue(
    ctx,
    "balance_release_delay_ms",
    BALANCE_RELEASE_DELAY_MS,
  );
}

export async function getEffectiveCommissionRates(
  ctx: AnyCtx,
): Promise<Record<SubscriptionTier, number>> {
  const [free, pro, business] = await Promise.all([
    getConfigValue(ctx, "commission_free", COMMISSION_RATES.free),
    getConfigValue(ctx, "commission_pro", COMMISSION_RATES.pro),
    getConfigValue(ctx, "commission_business", COMMISSION_RATES.business),
  ]);
  return { free, pro, business };
}

// ─── Storage helpers ──────────────────────────────────────────

export type EffectiveStorageFees = {
  PER_UNIT: number;
  PER_UNIT_BULK: number;
  BULK_THRESHOLD_UNITS: number;
  MEDIUM_KG_FLAT: number;
  HEAVY_BASE: number;
  HEAVY_PER_KG: number;
  MEDIUM_MAX_KG: number;
  FREE_MAX_KG: number;
};

export async function getEffectiveStorageFees(
  ctx: AnyCtx,
): Promise<EffectiveStorageFees> {
  const [
    PER_UNIT,
    PER_UNIT_BULK,
    BULK_THRESHOLD_UNITS,
    MEDIUM_KG_FLAT,
    HEAVY_BASE,
    HEAVY_PER_KG,
    MEDIUM_MAX_KG,
    FREE_MAX_KG,
  ] = await Promise.all([
    getConfigValue(ctx, "storage_fee_per_unit", STORAGE_FEES.PER_UNIT),
    getConfigValue(
      ctx,
      "storage_fee_per_unit_bulk",
      STORAGE_FEES.PER_UNIT_BULK,
    ),
    getConfigValue(
      ctx,
      "storage_fee_bulk_threshold",
      STORAGE_FEES.BULK_THRESHOLD_UNITS,
    ),
    getConfigValue(
      ctx,
      "storage_fee_medium_kg_flat",
      STORAGE_FEES.MEDIUM_KG_FLAT,
    ),
    getConfigValue(ctx, "storage_fee_heavy_base", STORAGE_FEES.HEAVY_BASE),
    getConfigValue(ctx, "storage_fee_heavy_per_kg", STORAGE_FEES.HEAVY_PER_KG),
    getConfigValue(
      ctx,
      "storage_fee_medium_max_kg",
      STORAGE_FEES.MEDIUM_MAX_KG,
    ),
    getConfigValue(ctx, "storage_fee_free_max_kg", STORAGE_FEES.FREE_MAX_KG),
  ]);
  return {
    PER_UNIT,
    PER_UNIT_BULK,
    BULK_THRESHOLD_UNITS,
    MEDIUM_KG_FLAT,
    HEAVY_BASE,
    HEAVY_PER_KG,
    MEDIUM_MAX_KG,
    FREE_MAX_KG,
  };
}

export async function getStorageDebtBlockDelayMs(ctx: AnyCtx): Promise<number> {
  return getConfigValue(
    ctx,
    "storage_debt_block_delay_ms",
    STORAGE_DEBT_BLOCK_DELAY_MS,
  );
}

// ─── Subscription helpers ─────────────────────────────────────

/** Nombre maximum de produits actifs pour le plan Gratuit (défaut 50). */
export async function getFreeMaxActiveProducts(ctx: AnyCtx): Promise<number> {
  return getConfigValue(ctx, "subscription_free_max_products", 50);
}
