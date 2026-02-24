// filepath: convex/orders/events.ts

import { internalMutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { requireAppUser, getVendorStore } from "../users/helpers";

// ─── Types ───────────────────────────────────────────────────

type EventType =
  | "created"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "tracking_updated"
  | "note";

type ActorType = "system" | "customer" | "vendor" | "admin";

// ─── Log Event (internal — called from mutations) ────────────

/**
 * Crée un événement dans la timeline de la commande.
 * Appelé depuis les mutations d'orders via logOrderEvent helper.
 */
export async function logOrderEvent(
  ctx: MutationCtx,
  params: {
    orderId: Id<"orders">;
    storeId: Id<"stores">;
    type: EventType;
    description: string;
    actorType: ActorType;
    actorId?: Id<"users">;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await ctx.db.insert("order_events", {
    order_id: params.orderId,
    store_id: params.storeId,
    type: params.type,
    description: params.description,
    actor_type: params.actorType,
    actor_id: params.actorId,
    metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
  });
}

// ─── Get Timeline (public query) ─────────────────────────────

/**
 * Retourne la timeline complète d'une commande.
 * Accessible au customer, vendor owner, ou admin.
 */
export const getTimeline = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) return [];

    // Vérifier l'accès
    const isCustomer = order.customer_id === user._id;
    const isAdmin = user.role === "admin";
    let isVendor = false;
    if (user.role === "vendor") {
      const store = await ctx.db
        .query("stores")
        .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
        .first();
      isVendor = store?._id === order.store_id;
    }

    if (!isCustomer && !isVendor && !isAdmin) return [];

    const events = await ctx.db
      .query("order_events")
      .withIndex("by_order", (q) => q.eq("order_id", args.orderId))
      .collect();

    // Trier par _creationTime ascending (chronologique)
    return events
      .sort((a, b) => a._creationTime - b._creationTime)
      .map((event) => ({
        _id: event._id,
        type: event.type,
        description: event.description,
        actorType: event.actor_type,
        metadata: event.metadata ? JSON.parse(event.metadata) : undefined,
        createdAt: event._creationTime,
      }));
  },
});
