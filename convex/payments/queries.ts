// filepath: convex/payments/queries.ts

import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Query interne pour récupérer une commande avec les infos client.
 * Appelée par les actions (qui ne peuvent pas accéder à ctx.db directement).
 */
export const getOrderForPayment = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    const customer = await ctx.db.get(order.customer_id);

    return {
      ...order,
      customer_email: customer?.email ?? "",
      customer_name: customer?.name ?? "Client",
    };
  },
});
