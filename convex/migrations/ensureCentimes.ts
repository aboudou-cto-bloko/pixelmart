// filepath: convex/migrations/ensureCentimes.ts
//
// Migration de sécurité — vérifie que toutes les valeurs monétaires en base
// sont bien en centimes (1 XOF = 100 centimes).
//
// Heuristique de détection : une valeur monétaire est PROBABLEMENT en FCFA
// (pas en centimes) si elle est > 0 et < THRESHOLD_CENTIMES (500 = 5 XOF).
// Les vraies valeurs en centimes sont toujours ≥ 500 pour tout produit réel.
//
// ⚠️  NE PAS exécuter en production sans audit préalable.
//     Utiliser via : npx convex run migrations/ensureCentimes:run
//
// Résultat : { table, id, field, oldValue, newValue }[] par table touchée.

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Seuil en dessous duquel on considère que la valeur est en FCFA et non en centimes.
// 500 centimes = 5 XOF — aucun produit ou frais réel ne peut valoir moins que ça.
const MIN_CENTIMES = 500;

// Valeur maximale plausible en FCFA avant conversion (10 M FCFA = 1 Md centimes).
// Au-dessus de cette borne on suppose que la valeur est déjà en centimes.
const MAX_FCFA_BEFORE_CONV = 10_000_000;

function likelyCfa(value: number): boolean {
  return value > 0 && value < MIN_CENTIMES && value <= MAX_FCFA_BEFORE_CONV;
}

type FixRecord = {
  table: string;
  id: string;
  field: string;
  oldValue: number;
  newValue: number;
};

export const run = internalMutation({
  args: {
    dry_run: v.optional(v.boolean()), // true = affiche les problèmes sans modifier
  },
  handler: async (ctx, { dry_run = true }) => {
    const fixes: FixRecord[] = [];

    // ── products ────────────────────────────────────────────────────────────
    {
      const rows = await ctx.db.query("products").collect();
      for (const row of rows) {
        const patch: {
          price?: number;
          compare_price?: number;
          cost_price?: number;
        } = {};
        if (likelyCfa(row.price)) {
          fixes.push({
            table: "products",
            id: row._id,
            field: "price",
            oldValue: row.price,
            newValue: row.price * 100,
          });
          patch.price = row.price * 100;
        }
        if (row.compare_price !== undefined && likelyCfa(row.compare_price)) {
          fixes.push({
            table: "products",
            id: row._id,
            field: "compare_price",
            oldValue: row.compare_price,
            newValue: row.compare_price * 100,
          });
          patch.compare_price = row.compare_price * 100;
        }
        if (row.cost_price !== undefined && likelyCfa(row.cost_price)) {
          fixes.push({
            table: "products",
            id: row._id,
            field: "cost_price",
            oldValue: row.cost_price,
            newValue: row.cost_price * 100,
          });
          patch.cost_price = row.cost_price * 100;
        }
        if (!dry_run && Object.keys(patch).length > 0) {
          await ctx.db.patch(row._id, patch);
        }
      }
    }

    // ── product_variants ────────────────────────────────────────────────────
    {
      const rows = await ctx.db.query("product_variants").collect();
      for (const row of rows) {
        const patch: { price?: number; compare_price?: number } = {};
        if (row.price !== undefined && likelyCfa(row.price)) {
          fixes.push({
            table: "product_variants",
            id: row._id,
            field: "price",
            oldValue: row.price,
            newValue: row.price * 100,
          });
          patch.price = row.price * 100;
        }
        if (row.compare_price !== undefined && likelyCfa(row.compare_price)) {
          fixes.push({
            table: "product_variants",
            id: row._id,
            field: "compare_price",
            oldValue: row.compare_price,
            newValue: row.compare_price * 100,
          });
          patch.compare_price = row.compare_price * 100;
        }
        if (!dry_run && Object.keys(patch).length > 0) {
          await ctx.db.patch(row._id, patch);
        }
      }
    }

    // ── stores (balance + pending_balance) ──────────────────────────────────
    {
      const rows = await ctx.db.query("stores").collect();
      for (const row of rows) {
        const patch: Partial<typeof row> = {};
        const fields = ["balance", "pending_balance"] as const;
        for (const field of fields) {
          const val = row[field];
          if (likelyCfa(val)) {
            const newVal = val * 100;
            fixes.push({
              table: "stores",
              id: row._id,
              field,
              oldValue: val,
              newValue: newVal,
            });
            patch[field] = newVal;
          }
        }
        if (!dry_run && Object.keys(patch).length > 0) {
          await ctx.db.patch(row._id, patch);
        }
      }
    }

    // ── orders ──────────────────────────────────────────────────────────────
    {
      const rows = await ctx.db.query("orders").collect();
      for (const row of rows) {
        const patch: Record<string, unknown> = {};
        const topFields = [
          "subtotal",
          "shipping_amount",
          "discount_amount",
          "total_amount",
          "commission_amount",
          "delivery_fee",
        ] as const;
        for (const field of topFields) {
          const val = row[field];
          if (val !== undefined && likelyCfa(val)) {
            const newVal = val * 100;
            fixes.push({
              table: "orders",
              id: row._id,
              field,
              oldValue: val,
              newValue: newVal,
            });
            patch[field] = newVal;
          }
        }
        // items[] sub-fields
        let itemsChanged = false;
        const newItems = row.items.map((item) => {
          let unit_price = item.unit_price;
          let total_price = item.total_price;
          if (likelyCfa(item.unit_price)) {
            fixes.push({
              table: "orders",
              id: row._id,
              field: `items[${item.product_id}].unit_price`,
              oldValue: item.unit_price,
              newValue: item.unit_price * 100,
            });
            unit_price = item.unit_price * 100;
            itemsChanged = true;
          }
          if (likelyCfa(item.total_price)) {
            fixes.push({
              table: "orders",
              id: row._id,
              field: `items[${item.product_id}].total_price`,
              oldValue: item.total_price,
              newValue: item.total_price * 100,
            });
            total_price = item.total_price * 100;
            itemsChanged = true;
          }
          return { ...item, unit_price, total_price };
        });
        if (itemsChanged) patch.items = newItems;

        if (!dry_run && Object.keys(patch).length > 0) {
          await ctx.db.patch(row._id, patch);
        }
      }
    }

    // ── transactions ────────────────────────────────────────────────────────
    // Transactions are immutable ledger entries — we log but never patch.
    {
      const rows = await ctx.db.query("transactions").collect();
      for (const row of rows) {
        for (const field of [
          "amount",
          "balance_before",
          "balance_after",
        ] as const) {
          const val = row[field];
          if (likelyCfa(val)) {
            fixes.push({
              table: "transactions (READ-ONLY — manual fix required)",
              id: row._id,
              field,
              oldValue: val,
              newValue: val * 100,
            });
          }
        }
        // Transactions are never patched — they are immutable by design (rule F-01)
      }
    }

    // ── payouts ─────────────────────────────────────────────────────────────
    {
      const rows = await ctx.db.query("payouts").collect();
      for (const row of rows) {
        const patch: Partial<typeof row> = {};
        for (const field of ["amount", "fee"] as const) {
          const val = row[field];
          if (val !== undefined && likelyCfa(val)) {
            const newVal = val * 100;
            fixes.push({
              table: "payouts",
              id: row._id,
              field,
              oldValue: val,
              newValue: newVal,
            });
            patch[field] = newVal;
          }
        }
        if (!dry_run && Object.keys(patch).length > 0) {
          await ctx.db.patch(row._id, patch);
        }
      }
    }

    // ── coupons ─────────────────────────────────────────────────────────────
    // `value` peut être un % ou des centimes — on ne touche que min_order_amount
    {
      const rows = await ctx.db.query("coupons").collect();
      for (const row of rows) {
        const val = row.min_order_amount;
        if (val !== undefined && likelyCfa(val)) {
          fixes.push({
            table: "coupons",
            id: row._id,
            field: "min_order_amount",
            oldValue: val,
            newValue: val * 100,
          });
          if (!dry_run) {
            await ctx.db.patch(row._id, { min_order_amount: val * 100 });
          }
        }
      }
    }

    // ── return_requests ─────────────────────────────────────────────────────
    {
      const rows = await ctx.db.query("return_requests").collect();
      for (const row of rows) {
        const patch: Record<string, unknown> = {};
        const val = row.refund_amount;
        if (val !== undefined && likelyCfa(val)) {
          fixes.push({
            table: "return_requests",
            id: row._id,
            field: "refund_amount",
            oldValue: val,
            newValue: val * 100,
          });
          patch.refund_amount = val * 100;
        }
        let itemsChanged = false;
        const newItems = row.items.map((item) => {
          if (likelyCfa(item.unit_price)) {
            fixes.push({
              table: "return_requests",
              id: row._id,
              field: `items[${item.product_id}].unit_price`,
              oldValue: item.unit_price,
              newValue: item.unit_price * 100,
            });
            itemsChanged = true;
            return { ...item, unit_price: item.unit_price * 100 };
          }
          return item;
        });
        if (itemsChanged) patch.items = newItems;
        if (!dry_run && Object.keys(patch).length > 0) {
          await ctx.db.patch(row._id, patch);
        }
      }
    }

    // ── ad_spaces ───────────────────────────────────────────────────────────
    {
      const rows = await ctx.db.query("ad_spaces").collect();
      for (const row of rows) {
        const patch: Partial<typeof row> = {};
        const fields = [
          "base_price_daily",
          "base_price_weekly",
          "base_price_monthly",
        ] as const;
        for (const field of fields) {
          const val = row[field];
          if (likelyCfa(val)) {
            const newVal = val * 100;
            fixes.push({
              table: "ad_spaces",
              id: row._id,
              field,
              oldValue: val,
              newValue: newVal,
            });
            patch[field] = newVal;
          }
        }
        if (!dry_run && Object.keys(patch).length > 0) {
          await ctx.db.patch(row._id, patch);
        }
      }
    }

    // ── ad_bookings ─────────────────────────────────────────────────────────
    {
      const rows = await ctx.db.query("ad_bookings").collect();
      for (const row of rows) {
        const val = row.total_price;
        if (likelyCfa(val)) {
          fixes.push({
            table: "ad_bookings",
            id: row._id,
            field: "total_price",
            oldValue: val,
            newValue: val * 100,
          });
          if (!dry_run) {
            await ctx.db.patch(row._id, { total_price: val * 100 });
          }
        }
      }
    }

    // ── delivery_batches ────────────────────────────────────────────────────
    {
      const rows = await ctx.db.query("delivery_batches").collect();
      for (const row of rows) {
        const val = row.total_delivery_fee;
        if (val !== undefined && likelyCfa(val)) {
          fixes.push({
            table: "delivery_batches",
            id: row._id,
            field: "total_delivery_fee",
            oldValue: val,
            newValue: val * 100,
          });
          if (!dry_run) {
            await ctx.db.patch(row._id, { total_delivery_fee: val * 100 });
          }
        }
      }
    }

    // ── delivery_rates ──────────────────────────────────────────────────────
    {
      const rows = await ctx.db.query("delivery_rates").collect();
      for (const row of rows) {
        const patch: {
          base_price?: number;
          price_per_km?: number;
          weight_surcharge_per_kg?: number;
        } = {};
        if (likelyCfa(row.base_price)) {
          fixes.push({
            table: "delivery_rates",
            id: row._id,
            field: "base_price",
            oldValue: row.base_price,
            newValue: row.base_price * 100,
          });
          patch.base_price = row.base_price * 100;
        }
        if (row.price_per_km !== undefined && likelyCfa(row.price_per_km)) {
          fixes.push({
            table: "delivery_rates",
            id: row._id,
            field: "price_per_km",
            oldValue: row.price_per_km,
            newValue: row.price_per_km * 100,
          });
          patch.price_per_km = row.price_per_km * 100;
        }
        if (likelyCfa(row.weight_surcharge_per_kg)) {
          fixes.push({
            table: "delivery_rates",
            id: row._id,
            field: "weight_surcharge_per_kg",
            oldValue: row.weight_surcharge_per_kg,
            newValue: row.weight_surcharge_per_kg * 100,
          });
          patch.weight_surcharge_per_kg = row.weight_surcharge_per_kg * 100;
        }
        if (!dry_run && Object.keys(patch).length > 0) {
          await ctx.db.patch(row._id, patch);
        }
      }
    }

    return {
      dry_run,
      total_fixes: fixes.length,
      fixes,
      message:
        fixes.length === 0
          ? "✅ Toutes les valeurs monétaires sont déjà en centimes."
          : dry_run
            ? `⚠️  ${fixes.length} valeur(s) suspecte(s) détectée(s). Relancer avec dry_run: false pour corriger.`
            : `✅ ${fixes.length} valeur(s) corrigée(s) (×100).`,
    };
  },
});
