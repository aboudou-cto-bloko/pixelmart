// filepath: convex/admin/mutations.ts

import { mutation } from "../_generated/server";
import { internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { components, internal } from "../_generated/api";
import { v } from "convex/values";
import { requireAdmin, requireSuperAdmin, requireRoles, ADMIN_ROLES } from "../users/helpers";

// ─── Audit log helper ─────────────────────────────────────────

async function logEvent(
  ctx: MutationCtx,
  actorId: Id<"users">,
  actorName: string | undefined,
  type: string,
  opts?: {
    target_type?: string;
    target_id?: string;
    target_label?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await ctx.db.insert("platform_events", {
    type,
    actor_id: actorId,
    actor_name: actorName,
    target_type: opts?.target_type,
    target_id: opts?.target_id,
    target_label: opts?.target_label,
    metadata: opts?.metadata ? JSON.stringify(opts.metadata) : undefined,
    created_at: Date.now(),
  });
}

// ─── verifyStore ─────────────────────────────────────────────

export const verifyStore = mutation({
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);

    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("Boutique introuvable");

    await ctx.db.patch(args.storeId, {
      is_verified: true,
      updated_at: Date.now(),
    });

    await logEvent(ctx, admin._id, admin.name, "store_verified", {
      target_type: "store",
      target_id: args.storeId,
      target_label: store.name,
    });

    // Notify vendor
    await ctx.scheduler.runAfter(0, internal.notifications.send.createInAppNotification, {
      userId: store.owner_id,
      type: "system",
      title: "Boutique vérifiée ✓",
      body: `Votre boutique "${store.name}" a été vérifiée et est maintenant active.`,
      link: "/vendor/store/settings",
      channels: ["in_app"],
      sentVia: ["in_app"],
      metadata: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: store.owner_id,
      title: "Boutique vérifiée",
      body: `"${store.name}" est maintenant vérifiée.`,
      url: "/vendor/store/settings",
    });

    return { success: true };
  },
});

// ─── suspendStore ─────────────────────────────────────────────

export const suspendStore = mutation({
  args: {
    storeId: v.id("stores"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);

    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("Boutique introuvable");

    await ctx.db.patch(args.storeId, {
      status: "suspended",
      updated_at: Date.now(),
    });

    await logEvent(ctx, admin._id, admin.name, "store_suspended", {
      target_type: "store",
      target_id: args.storeId,
      target_label: store.name,
      metadata: { reason: args.reason },
    });

    // Notify vendor
    await ctx.scheduler.runAfter(0, internal.notifications.send.createInAppNotification, {
      userId: store.owner_id,
      type: "system",
      title: "Boutique suspendue",
      body: `Votre boutique "${store.name}" a été suspendue. Motif : ${args.reason}`,
      link: "/vendor/store/settings",
      channels: ["in_app"],
      sentVia: ["in_app"],
      metadata: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: store.owner_id,
      title: "Boutique suspendue",
      body: `"${store.name}" a été suspendue. Motif : ${args.reason}`,
      url: "/vendor/store/settings",
    });

    return { success: true };
  },
});

// ─── reactivateStore ──────────────────────────────────────────

export const reactivateStore = mutation({
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);

    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("Boutique introuvable");

    await ctx.db.patch(args.storeId, {
      status: "active",
      updated_at: Date.now(),
    });

    await logEvent(ctx, admin._id, admin.name, "store_reactivated", {
      target_type: "store",
      target_id: args.storeId,
      target_label: store.name,
    });

    // Notify vendor
    await ctx.scheduler.runAfter(0, internal.notifications.send.createInAppNotification, {
      userId: store.owner_id,
      type: "system",
      title: "Boutique réactivée ✓",
      body: `Votre boutique "${store.name}" est à nouveau active.`,
      link: "/vendor/store/settings",
      channels: ["in_app"],
      sentVia: ["in_app"],
      metadata: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: store.owner_id,
      title: "Boutique réactivée",
      body: `"${store.name}" est à nouveau active.`,
      url: "/vendor/store/settings",
    });

    return { success: true };
  },
});

// ─── approvePayout ────────────────────────────────────────────

export const approvePayout = mutation({
  args: {
    payoutId: v.id("payouts"),
  },
  handler: async (ctx, args) => {
    const admin = await requireRoles(ctx, ["admin", "finance"]);

    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new Error("Virement introuvable");
    if (payout.status !== "pending") {
      throw new Error("Ce virement n'est pas en attente");
    }

    const store = await ctx.db.get(payout.store_id);
    if (!store) throw new Error("Boutique introuvable");

    const owner = await ctx.db.get(store.owner_id);
    if (!owner) throw new Error("Propriétaire introuvable");

    const netAmount = payout.amount - payout.fee;

    await ctx.scheduler.runAfter(
      0,
      internal.payouts.actions.initializePayoutViaMoneroo,
      {
        payoutId: payout._id,
        storeId: payout.store_id,
        amount: netAmount,
        currency: payout.currency,
        method: payout.payout_details.provider,
        phoneNumber: payout.payout_details.phone_number,
        accountName: payout.payout_details.account_name,
        vendorEmail: owner.email,
        vendorName: owner.name ?? "Vendeur",
      },
    );

    await logEvent(ctx, admin._id, admin.name, "payout_approved", {
      target_type: "payout",
      target_id: args.payoutId,
      target_label: store.name,
      metadata: { amount: payout.amount, currency: payout.currency },
    });

    return { success: true };
  },
});

// ─── banUser ──────────────────────────────────────────────────

export const banUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur introuvable");
    if ((ADMIN_ROLES as readonly string[]).includes(user.role)) {
      throw new Error("Impossible de bannir un administrateur");
    }

    await ctx.db.patch(args.userId, { is_banned: true, updated_at: Date.now() });

    await logEvent(ctx, admin._id, admin.name, "user_banned", {
      target_type: "user",
      target_id: args.userId,
      target_label: user.email,
    });

    await ctx.scheduler.runAfter(0, internal.notifications.send.createInAppNotification, {
      userId: args.userId,
      type: "system",
      title: "Compte suspendu",
      body: "Votre compte a été suspendu. Contactez le support pour plus d'informations.",
      link: "/",
      channels: ["in_app"],
      sentVia: ["in_app"],
      metadata: undefined,
    });

    return { success: true };
  },
});

// ─── unbanUser ────────────────────────────────────────────────

export const unbanUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur introuvable");

    await ctx.db.patch(args.userId, { is_banned: false, updated_at: Date.now() });

    await logEvent(ctx, admin._id, admin.name, "user_unbanned", {
      target_type: "user",
      target_id: args.userId,
      target_label: user.email,
    });

    await ctx.scheduler.runAfter(0, internal.notifications.send.createInAppNotification, {
      userId: args.userId,
      type: "system",
      title: "Compte réactivé ✓",
      body: "Votre compte a été réactivé. Vous pouvez maintenant utiliser Pixel-Mart normalement.",
      link: "/",
      channels: ["in_app"],
      sentVia: ["in_app"],
      metadata: undefined,
    });

    return { success: true };
  },
});

// ─── changeUserRole ───────────────────────────────────────────

export const changeUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("finance"),
      v.literal("logistics"),
      v.literal("developer"),
      v.literal("marketing"),
      v.literal("vendor"),
      v.literal("customer"),
      v.literal("agent"),
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur introuvable");

    const previousRole = user.role;
    await ctx.db.patch(args.userId, { role: args.role, updated_at: Date.now() });

    await logEvent(ctx, admin._id, admin.name, "user_role_changed", {
      target_type: "user",
      target_id: args.userId,
      target_label: user.email,
      metadata: { from: previousRole, to: args.role },
    });

    const ROLE_LABELS: Record<string, string> = {
      admin: "Super Admin",
      finance: "Responsable Financier",
      logistics: "Gestionnaire Livraisons",
      developer: "Développeur",
      marketing: "Gestionnaire Contenu",
      vendor: "Vendeur",
      customer: "Client",
      agent: "Agent Entrepôt",
    };
    await ctx.scheduler.runAfter(0, internal.notifications.send.createInAppNotification, {
      userId: args.userId,
      type: "system",
      title: "Rôle mis à jour",
      body: `Votre rôle a été changé de ${ROLE_LABELS[previousRole] ?? previousRole} à ${ROLE_LABELS[args.role] ?? args.role}.`,
      link: "/",
      channels: ["in_app"],
      sentVia: ["in_app"],
      metadata: undefined,
    });

    return { success: true };
  },
});

// ─── createCategory ───────────────────────────────────────────

export const createCategory = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    parent_id: v.optional(v.id("categories")),
    sort_order: v.number(),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRoles(ctx, ["admin", "marketing"]);

    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error(`Le slug "${args.slug}" existe déjà`);

    if (args.parent_id) {
      const parent = await ctx.db.get(args.parent_id);
      if (!parent) throw new Error("Catégorie parent introuvable");
      if (parent.parent_id) throw new Error("Maximum 2 niveaux de profondeur");
    }

    return await ctx.db.insert("categories", {
      name: args.name,
      slug: args.slug,
      parent_id: args.parent_id,
      sort_order: args.sort_order,
      is_active: args.is_active,
    });
  },
});

// ─── updateCategory ───────────────────────────────────────────

export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    sort_order: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireRoles(ctx, ["admin", "marketing"]);

    const category = await ctx.db.get(args.id);
    if (!category) throw new Error("Catégorie introuvable");

    if (args.slug !== undefined && args.slug !== category.slug) {
      const existingSlug = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
        .unique();
      if (existingSlug) throw new Error(`Le slug "${args.slug}" existe déjà`);
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.slug !== undefined) updates.slug = args.slug;
    if (args.sort_order !== undefined) updates.sort_order = args.sort_order;
    if (args.is_active !== undefined) updates.is_active = args.is_active;

    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

// ─── deleteCategory ───────────────────────────────────────────

export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await requireRoles(ctx, ["admin", "marketing"]);

    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category_id", args.id))
      .first();
    if (products) throw new Error("Des produits utilisent cette catégorie");

    const children = await ctx.db
      .query("categories")
      .withIndex("by_parent", (q) => q.eq("parent_id", args.id))
      .first();
    if (children) throw new Error("Cette catégorie a des sous-catégories");

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ─── setCountryActive ────────────────────────────────────────

export const setCountryActive = mutation({
  args: {
    country_code: v.string(),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireRoles(ctx, ["admin", "logistics"]);

    const existing = await ctx.db
      .query("country_config")
      .withIndex("by_code", (q) => q.eq("country_code", args.country_code))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        is_active: args.is_active,
        updated_at: Date.now(),
        updated_by: user._id,
      });
    } else {
      await ctx.db.insert("country_config", {
        country_code: args.country_code,
        is_active: args.is_active,
        updated_at: Date.now(),
        updated_by: user._id,
      });
    }

    return { success: true };
  },
});

// ─── upsertDeliveryRate ───────────────────────────────────────

export const upsertDeliveryRate = mutation({
  args: {
    id: v.optional(v.id("delivery_rates")),
    delivery_type: v.union(
      v.literal("standard"),
      v.literal("urgent"),
      v.literal("fragile"),
    ),
    is_night_rate: v.boolean(),
    distance_min_km: v.number(),
    distance_max_km: v.optional(v.number()),
    base_price: v.number(),
    price_per_km: v.optional(v.number()),
    weight_threshold_kg: v.number(),
    weight_surcharge_per_kg: v.number(),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireRoles(ctx, ["admin", "logistics"]);

    const { id, ...fields } = args;
    const payload = { ...fields, updated_at: Date.now() };

    if (id) {
      const existing = await ctx.db.get(id);
      if (!existing) throw new Error("Tarif introuvable");
      await ctx.db.patch(id, payload);
      return id;
    } else {
      return await ctx.db.insert("delivery_rates", payload);
    }
  },
});

// ─── toggleDeliveryRate ───────────────────────────────────────

export const toggleDeliveryRate = mutation({
  args: { id: v.id("delivery_rates") },
  handler: async (ctx, args) => {
    await requireRoles(ctx, ["admin", "logistics"]);
    const rate = await ctx.db.get(args.id);
    if (!rate) throw new Error("Tarif introuvable");
    await ctx.db.patch(args.id, {
      is_active: !rate.is_active,
      updated_at: Date.now(),
    });
    return { is_active: !rate.is_active };
  },
});

// ─── deleteDeliveryRate ───────────────────────────────────────

export const deleteDeliveryRate = mutation({
  args: { id: v.id("delivery_rates") },
  handler: async (ctx, args) => {
    await requireRoles(ctx, ["admin", "logistics"]);
    const rate = await ctx.db.get(args.id);
    if (!rate) throw new Error("Tarif introuvable");
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ─── updateBatchStatus ────────────────────────────────────────

export const updateBatchStatus = mutation({
  args: {
    batchId: v.id("delivery_batches"),
    status: v.union(
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRoles(ctx, ["admin", "logistics"]);

    const batch = await ctx.db.get(args.batchId);
    if (!batch) throw new Error("Lot introuvable");

    // Validate transitions
    const allowed: Record<string, string[]> = {
      transmitted: ["assigned", "cancelled"],
      assigned: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
    };
    if (!allowed[batch.status]?.includes(args.status)) {
      throw new Error(`Transition ${batch.status} → ${args.status} non autorisée`);
    }

    const now = Date.now();
    const patch: Record<string, unknown> = {
      status: args.status,
      updated_at: now,
      processed_by: user._id,
    };
    if (args.status === "assigned") patch.assigned_at = now;
    if (args.status === "completed") patch.completed_at = now;
    if (args.notes) patch.admin_notes = args.notes;

    await ctx.db.patch(args.batchId, patch);

    // Pour les lots entrepôt complétés : décrémenter l'inventaire entrepôt
    if (args.status === "completed" && batch.is_warehouse_batch) {
      // Agréger la quantité livrée par produit
      const qtyByProductId = new Map<string, number>();
      for (const orderId of batch.order_ids) {
        const order = await ctx.db.get(orderId);
        if (!order) continue;
        for (const item of order.items) {
          if (!item.storage_code) continue; // pas un article entrepôt
          const key = item.product_id.toString();
          qtyByProductId.set(key, (qtyByProductId.get(key) ?? 0) + item.quantity);
        }
      }

      // Récupérer toutes les demandes en stock pour ce lot (une seule requête)
      const inStockReqs = await ctx.db
        .query("storage_requests")
        .withIndex("by_store_status", (q) =>
          q.eq("store_id", batch.store_id).eq("status", "in_stock"),
        )
        .collect();

      // Décrémenter products.warehouse_qty + storage_requests.actual_qty
      for (const [productIdStr, qty] of qtyByProductId) {
        const req = inStockReqs.find((r) => r.product_id?.toString() === productIdStr);
        if (!req) continue;

        await ctx.db.patch(req._id, {
          actual_qty: Math.max(0, (req.actual_qty ?? 0) - qty),
          updated_at: now,
        });

        if (req.product_id) {
          const product = await ctx.db.get(req.product_id);
          if (product) {
            await ctx.db.patch(req.product_id, {
              warehouse_qty: Math.max(0, (product.warehouse_qty ?? 0) - qty),
              updated_at: now,
            });
          }
        }
      }
    }

    await logEvent(ctx, user._id, user.name, "batch_status_updated", {
      target_type: "delivery_batches",
      target_id: args.batchId,
      target_label: batch.batch_number,
      metadata: { from: batch.status, to: args.status, notes: args.notes },
    });

    return { success: true };
  },
});

// ─── generateAdminUploadUrl ───────────────────────────────────

export const generateAdminUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// ─── getAdminFileUrl ──────────────────────────────────────────

export const deleteAdminFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.storage.delete(args.storageId);
  },
});

// ─── toggleAdSpace ────────────────────────────────────────────

export const toggleAdSpace = mutation({
  args: { adSpaceId: v.id("ad_spaces") },
  handler: async (ctx, args) => {
    await requireRoles(ctx, ["admin", "marketing"]);

    const space = await ctx.db.get(args.adSpaceId);
    if (!space) throw new Error("Espace introuvable");

    await ctx.db.patch(args.adSpaceId, {
      is_active: !space.is_active,
      updated_at: Date.now(),
    });

    return { is_active: !space.is_active };
  },
});

// ─── upsertPlatformConfig ─────────────────────────────────────

export const upsertPlatformConfig = mutation({
  args: {
    key: v.string(),
    value: v.number(),
    label: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const existing = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    const previousValue = existing?.value;

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updated_at: Date.now(),
        updated_by: user._id,
      });
    } else {
      await ctx.db.insert("platform_config", {
        key: args.key,
        value: args.value,
        label: args.label,
        updated_at: Date.now(),
        updated_by: user._id,
      });
    }

    await logEvent(ctx, user._id, user.name, "config_changed", {
      target_type: "config",
      target_id: args.key,
      target_label: args.label,
      metadata: { key: args.key, from: previousValue, to: args.value },
    });

    return { success: true };
  },
});

// ─── rejectPayout ────────────────────────────────────────────

export const rejectPayout = mutation({
  args: {
    payoutId: v.id("payouts"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireRoles(ctx, ["admin", "finance"]);

    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new Error("Virement introuvable");
    if (payout.status !== "pending") {
      throw new Error("Ce virement n'est pas en attente");
    }

    const store = await ctx.db.get(payout.store_id);

    await ctx.scheduler.runAfter(
      0,
      internal.payouts.mutations.failPayout,
      {
        payoutId: args.payoutId,
        reason: args.reason,
      },
    );

    await logEvent(ctx, admin._id, admin.name, "payout_rejected", {
      target_type: "payout",
      target_id: args.payoutId,
      target_label: store?.name ?? "Boutique inconnue",
      metadata: { amount: payout.amount, currency: payout.currency, reason: args.reason },
    });

    return { success: true };
  },
});

// ─── deletePlatformConfig ─────────────────────────────────────

export const deletePlatformConfig = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const existing = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (!existing) return { success: true };

    await ctx.db.delete(existing._id);

    await logEvent(ctx, user._id, user.name, "config_reset", {
      target_type: "config",
      target_id: args.key,
      target_label: existing.label,
      metadata: { key: args.key, resetFrom: existing.value },
    });

    return { success: true };
  },
});

// ─── deleteUser ───────────────────────────────────────────────
// Hard-deletes a user: cleans up Better Auth records + app data.
// Orders are kept for audit trail; customer_id becomes a dangling ref.

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur introuvable");
    if ((ADMIN_ROLES as readonly string[]).includes(user.role)) {
      throw new Error("Impossible de supprimer un administrateur");
    }

    // ── Better Auth cleanup ────────────────────────────────────
    if (user.better_auth_user_id) {
      await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
        input: { model: "session", where: [{ field: "userId", value: user.better_auth_user_id }] },
        paginationOpts: { numItems: 200, cursor: null },
      });
      await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
        input: { model: "account", where: [{ field: "userId", value: user.better_auth_user_id }] },
        paginationOpts: { numItems: 200, cursor: null },
      });
      await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
        input: { model: "user", where: [{ field: "_id", value: user.better_auth_user_id }] },
      });
    }

    // ── App-level cleanup ─────────────────────────────────────
    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .collect();
    for (const n of notifs) await ctx.db.delete(n._id);

    const subs = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .collect();
    for (const s of subs) await ctx.db.delete(s._id);

    await ctx.db.delete(args.userId);

    await logEvent(ctx, admin._id, admin.name, "user_deleted", {
      target_type: "user",
      target_id: args.userId,
      target_label: user.email,
    });

    return { success: true };
  },
});

// ─── bulkBanUsers ─────────────────────────────────────────────

export const bulkBanUsers = mutation({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);
    let count = 0;
    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (!user || (ADMIN_ROLES as readonly string[]).includes(user.role) || user.is_banned) continue;
      await ctx.db.patch(userId, { is_banned: true, updated_at: Date.now() });
      count++;
    }
    await logEvent(ctx, admin._id, admin.name, "bulk_action", {
      metadata: { action: "ban", count },
    });
    return { count };
  },
});

// ─── bulkUnbanUsers ───────────────────────────────────────────

export const bulkUnbanUsers = mutation({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);
    let count = 0;
    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (!user || !user.is_banned) continue;
      await ctx.db.patch(userId, { is_banned: false, updated_at: Date.now() });
      count++;
    }
    await logEvent(ctx, admin._id, admin.name, "bulk_action", {
      metadata: { action: "unban", count },
    });
    return { count };
  },
});

// ─── bulkDeleteUsers ──────────────────────────────────────────

export const bulkDeleteUsers = mutation({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);
    let count = 0;
    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (!user || (ADMIN_ROLES as readonly string[]).includes(user.role)) continue;

      if (user.better_auth_user_id) {
        await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
          input: { model: "session", where: [{ field: "userId", value: user.better_auth_user_id }] },
          paginationOpts: { numItems: 200, cursor: null },
        });
        await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
          input: { model: "account", where: [{ field: "userId", value: user.better_auth_user_id }] },
          paginationOpts: { numItems: 200, cursor: null },
        });
        await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
          input: { model: "user", where: [{ field: "_id", value: user.better_auth_user_id }] },
        });
      }

      const notifs = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .collect();
      for (const n of notifs) await ctx.db.delete(n._id);

      const subs = await ctx.db
        .query("push_subscriptions")
        .withIndex("by_user", (q) => q.eq("user_id", userId))
        .collect();
      for (const s of subs) await ctx.db.delete(s._id);

      await ctx.db.delete(userId);
      count++;
    }
    await logEvent(ctx, admin._id, admin.name, "bulk_action", {
      metadata: { action: "delete", count },
    });
    return { count };
  },
});

// ─── bulkVerifyStores ─────────────────────────────────────────

export const bulkVerifyStores = mutation({
  args: { storeIds: v.array(v.id("stores")) },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);
    let count = 0;
    for (const storeId of args.storeIds) {
      const store = await ctx.db.get(storeId);
      if (!store || store.is_verified) continue;
      await ctx.db.patch(storeId, { is_verified: true, updated_at: Date.now() });
      count++;
    }
    await logEvent(ctx, admin._id, admin.name, "bulk_action", {
      metadata: { action: "verify_stores", count },
    });
    return { count };
  },
});

// ─── bulkSuspendStores ────────────────────────────────────────

export const bulkSuspendStores = mutation({
  args: { storeIds: v.array(v.id("stores")), reason: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);
    let count = 0;
    for (const storeId of args.storeIds) {
      const store = await ctx.db.get(storeId);
      if (!store || store.status === "suspended") continue;
      await ctx.db.patch(storeId, {
        status: "suspended",
        updated_at: Date.now(),
      });
      count++;
    }
    await logEvent(ctx, admin._id, admin.name, "bulk_action", {
      metadata: { action: "suspend_stores", count, reason: args.reason },
    });
    return { count };
  },
});
