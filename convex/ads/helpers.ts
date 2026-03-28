// filepath: convex/ads/helpers.ts

import { type QueryCtx, type MutationCtx } from "../_generated/server";
import { type Id } from "../_generated/dataModel";
import { formatAmountText } from "../lib/format";

/**
 * Calculer le prix d'une réservation selon la durée et la demande.
 */
export function calculateBookingPrice(
  adSpace: {
    base_price_daily: number;
    base_price_weekly: number;
    base_price_monthly: number;
    demand_multiplier: number;
    peak_periods?: Array<{
      name: string;
      starts_at: number;
      ends_at: number;
      multiplier: number;
    }>;
  },
  startsAt: number,
  endsAt: number,
): { totalPrice: number; breakdown: string } {
  const durationMs = endsAt - startsAt;
  const durationDays = Math.ceil(durationMs / (24 * 60 * 60 * 1000));

  // Calculer le prix de base selon la durée
  let basePrice: number;
  let breakdown: string;

  if (durationDays >= 28) {
    const months = Math.ceil(durationDays / 30);
    basePrice = months * adSpace.base_price_monthly;
    breakdown = `${months} mois × ${formatAmountText(adSpace.base_price_monthly, "XOF")}`;
  } else if (durationDays >= 7) {
    const weeks = Math.ceil(durationDays / 7);
    basePrice = weeks * adSpace.base_price_weekly;
    breakdown = `${weeks} semaine(s) × ${formatAmountText(adSpace.base_price_weekly, "XOF")}`;
  } else {
    basePrice = durationDays * adSpace.base_price_daily;
    breakdown = `${durationDays} jour(s) × ${formatAmountText(adSpace.base_price_daily, "XOF")}`;
  }

  // Appliquer le multiplicateur de demande
  let multiplier = adSpace.demand_multiplier;

  // Vérifier les périodes de pointe
  if (adSpace.peak_periods) {
    for (const peak of adSpace.peak_periods) {
      if (startsAt <= peak.ends_at && endsAt >= peak.starts_at) {
        multiplier = Math.max(multiplier, peak.multiplier);
        breakdown += ` (période ${peak.name} ×${peak.multiplier})`;
      }
    }
  }

  const totalPrice = Math.round(basePrice * multiplier);
  breakdown += ` → Total: ${formatAmountText(totalPrice, "XOF")}`;

  return { totalPrice, breakdown };
}

/**
 * Récupérer les bookings actifs pour un slot, triés par priorité.
 */
export async function getActiveBookingsForSlot(
  ctx: QueryCtx,
  slotId: string,
  now: number,
): Promise<
  Array<{
    _id: Id<"ad_bookings">;
    priority: number;
    store_id?: Id<"stores">;
    content_type: string;
    product_id?: Id<"products">;
    image_url?: string;
    title?: string;
    subtitle?: string;
    cta_text?: string;
    cta_link?: string;
    background_color?: string;
    source: string;
  }>
> {
  const bookings = await ctx.db
    .query("ad_bookings")
    .withIndex("by_active_slot", (q) =>
      q.eq("slot_id", slotId).eq("status", "active"),
    )
    .filter((q) =>
      q.and(q.lte(q.field("starts_at"), now), q.gte(q.field("ends_at"), now)),
    )
    .collect();

  // Trier par priorité décroissante (admin first)
  return bookings.sort((a, b) => b.priority - a.priority);
}

/**
 * Promouvoir les bookings en file d'attente quand un slot se libère.
 */
export async function promoteQueuedBookings(ctx: MutationCtx, slotId: string) {
  const now = Date.now();

  // Compter les actifs actuels
  const adSpace = await ctx.db
    .query("ad_spaces")
    .withIndex("by_slot_id", (q) => q.eq("slot_id", slotId))
    .first();

  if (!adSpace) return;

  const activeCount = (
    await ctx.db
      .query("ad_bookings")
      .withIndex("by_active_slot", (q) =>
        q.eq("slot_id", slotId).eq("status", "active"),
      )
      .filter((q) =>
        q.and(q.lte(q.field("starts_at"), now), q.gte(q.field("ends_at"), now)),
      )
      .collect()
  ).length;

  const slotsAvailable = adSpace.max_slots - activeCount;
  if (slotsAvailable <= 0) return;

  // Prendre les premiers en queue (par priorité puis date)
  const queued = await ctx.db
    .query("ad_bookings")
    .withIndex("by_slot", (q) => q.eq("slot_id", slotId).eq("status", "queued"))
    .filter((q) =>
      q.and(q.lte(q.field("starts_at"), now), q.gte(q.field("ends_at"), now)),
    )
    .collect();

  const toPromote = queued
    .sort(
      (a, b) => b.priority - a.priority || a._creationTime - b._creationTime,
    )
    .slice(0, slotsAvailable);

  for (const booking of toPromote) {
    await ctx.db.patch(booking._id, {
      status: "active",
      updated_at: now,
    });
  }
}
