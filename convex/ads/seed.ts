// filepath: convex/ads/seed.ts

import { mutation } from "../_generated/server";
import { AD_SLOT_DEFINITIONS } from "./constants";

export const seedAdSpaces = mutation({
  args: {},
  handler: async (ctx) => {
    // Vérifier qu'on n'a pas déjà seedé
    const existing = await ctx.db.query("ad_spaces").first();
    if (existing) {
      return { message: "Ad spaces already seeded" };
    }

    let sortOrder = 0;
    for (const def of Object.values(AD_SLOT_DEFINITIONS)) {
      await ctx.db.insert("ad_spaces", {
        slot_id: def.slot_id,
        name: def.name,
        format: def.format,
        width: def.width,
        height: def.height,
        max_slots: def.max_slots,
        base_price_daily: def.base_price_daily,
        base_price_weekly: def.base_price_weekly,
        base_price_monthly: def.base_price_monthly,
        demand_multiplier: 1.0,
        is_active: true,
        sort_order: sortOrder++,
        updated_at: Date.now(),
      });
    }

    return {
      message: `Seeded ${Object.keys(AD_SLOT_DEFINITIONS).length} ad spaces`,
    };
  },
});
