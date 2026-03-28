// filepath: convex/admin/mutations.ts

import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { requireAdmin } from "../users/helpers";

// ─── verifyStore ─────────────────────────────────────────────

export const verifyStore = mutation({
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("Boutique introuvable");

    await ctx.db.patch(args.storeId, {
      is_verified: true,
      updated_at: Date.now(),
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
    await requireAdmin(ctx);

    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("Boutique introuvable");

    await ctx.db.patch(args.storeId, {
      status: "suspended",
      updated_at: Date.now(),
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
    await requireAdmin(ctx);

    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("Boutique introuvable");

    await ctx.db.patch(args.storeId, {
      status: "active",
      updated_at: Date.now(),
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
    await requireAdmin(ctx);

    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new Error("Virement introuvable");
    if (payout.status !== "pending") {
      throw new Error("Ce virement n'est pas en attente");
    }

    const store = await ctx.db.get(payout.store_id);
    if (!store) throw new Error("Boutique introuvable");

    const owner = await ctx.db.get(store.owner_id);
    if (!owner) throw new Error("Propriétaire introuvable");

    // Net amount = amount - fee
    const netAmount = payout.amount - payout.fee;

    // Schedule Moneroo payout
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

    return { success: true };
  },
});

// ─── banUser ──────────────────────────────────────────────────

export const banUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur introuvable");
    if (user.role === "admin") throw new Error("Impossible de bannir un admin");

    await ctx.db.patch(args.userId, { is_banned: true, updated_at: Date.now() });
    return { success: true };
  },
});

// ─── unbanUser ────────────────────────────────────────────────

export const unbanUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur introuvable");

    await ctx.db.patch(args.userId, { is_banned: false, updated_at: Date.now() });
    return { success: true };
  },
});

// ─── changeUserRole ───────────────────────────────────────────

export const changeUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("vendor"),
      v.literal("customer"),
      v.literal("agent"),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Utilisateur introuvable");

    await ctx.db.patch(args.userId, { role: args.role, updated_at: Date.now() });
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
    await requireAdmin(ctx);

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
    await requireAdmin(ctx);

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
    await requireAdmin(ctx);

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
    const user = await requireAdmin(ctx);

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
    await requireAdmin(ctx);

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
    await requireAdmin(ctx);
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
    await requireAdmin(ctx);
    const rate = await ctx.db.get(args.id);
    if (!rate) throw new Error("Tarif introuvable");
    await ctx.db.delete(args.id);
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
    await requireAdmin(ctx);

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
    const user = await requireAdmin(ctx);

    const existing = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

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
    await requireAdmin(ctx);

    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new Error("Virement introuvable");
    if (payout.status !== "pending") {
      throw new Error("Ce virement n'est pas en attente");
    }

    // Use internal failPayout which handles reversal + notifications
    await ctx.scheduler.runAfter(
      0,
      internal.payouts.mutations.failPayout,
      {
        payoutId: args.payoutId,
        reason: args.reason,
      },
    );

    return { success: true };
  },
});
