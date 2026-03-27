// filepath: convex/seed/mutations.ts
// Mutations internes pour le seed de test — ne jamais exposer en production

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// ─── Promouvoir un utilisateur existant ──────────────────────────────────────

export const promoteUser = internalMutation({
  args: {
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("vendor"),
      v.literal("customer"),
      v.literal("agent"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error(
        `Utilisateur ${args.email} introuvable. Avez-vous bien créé le compte ?`,
      );
    }

    await ctx.db.patch(user._id, {
      role: args.role,
      is_verified: true,
      updated_at: Date.now(),
    });

    return { userId: user._id, email: user.email, role: args.role };
  },
});

// ─── Créer une boutique pour un utilisateur ───────────────────────────────────

export const createStore = internalMutation({
  args: {
    ownerEmail: v.string(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    country: v.optional(v.string()),
    currency: v.optional(v.string()),
    contact_phone: v.optional(v.string()),
    contact_whatsapp: v.optional(v.string()),
    contact_email: v.optional(v.string()),
    subscription_tier: v.optional(
      v.union(v.literal("free"), v.literal("pro"), v.literal("business")),
    ),
    is_verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const owner = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.ownerEmail))
      .first();

    if (!owner) {
      throw new Error(`Utilisateur ${args.ownerEmail} introuvable`);
    }

    // Vérifier que le slug est unique
    const existing = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      // Si la boutique existe déjà, retourner son id
      return { storeId: existing._id, existed: true };
    }

    const storeId = await ctx.db.insert("stores", {
      owner_id: owner._id,
      name: args.name,
      slug: args.slug,
      description: args.description,
      theme_id: "default",
      status: "active",
      subscription_tier: args.subscription_tier ?? "free",
      commission_rate: 500, // 5% en basis points
      balance: 0,
      pending_balance: 0,
      currency: args.currency ?? "XOF",
      level: "bronze",
      total_orders: 0,
      avg_rating: 0,
      is_verified: args.is_verified ?? false,
      country: args.country ?? "BJ",
      contact_phone: args.contact_phone,
      contact_whatsapp: args.contact_whatsapp,
      contact_email: args.contact_email,
      vendor_shop_enabled: true,
      use_pixelmart_service: true,
      has_storage_plan: false,
      updated_at: Date.now(),
    });

    // Mettre à jour active_store_id du vendor
    if (!owner.active_store_id) {
      await ctx.db.patch(owner._id, {
        role: "vendor",
        active_store_id: storeId,
        updated_at: Date.now(),
      });
    }

    return { storeId, existed: false };
  },
});

// ─── Créer des produits pour une boutique ────────────────────────────────────

export const createProduct = internalMutation({
  args: {
    storeId: v.id("stores"),
    categorySlug: v.string(),
    title: v.string(),
    description: v.string(),
    short_description: v.optional(v.string()),
    price: v.number(),
    compare_price: v.optional(v.number()),
    quantity: v.number(),
    tags: v.array(v.string()),
    imageStorageIds: v.array(v.string()),
    color: v.optional(v.string()),
    material: v.optional(v.string()),
    weight: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.categorySlug))
      .first();

    if (!category) {
      throw new Error(
        `Catégorie "${args.categorySlug}" introuvable. Avez-vous seedé les catégories ?`,
      );
    }

    // Générer un slug unique
    const baseSlug = args.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);

    let slug = baseSlug;
    let counter = 0;
    while (true) {
      const existing = await ctx.db
        .query("products")
        .withIndex("by_store", (q) => q.eq("store_id", args.storeId))
        .filter((q) => q.eq(q.field("slug"), slug))
        .first();
      if (!existing) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const productId = await ctx.db.insert("products", {
      store_id: args.storeId,
      title: args.title,
      slug,
      description: args.description,
      short_description: args.short_description,
      category_id: category._id,
      tags: args.tags,
      images: args.imageStorageIds,
      price: args.price,
      compare_price: args.compare_price,
      track_inventory: true,
      quantity: args.quantity,
      low_stock_threshold: 5,
      status: "active",
      is_digital: false,
      color: args.color,
      material: args.material,
      weight: args.weight,
      published_at: Date.now(),
      updated_at: Date.now(),
    });

    return productId;
  },
});

// ─── Réinitialiser le seed (DANGER — dev only) ───────────────────────────────

export const wipeSeedData = internalMutation({
  args: { confirm: v.literal("WIPE_SEED_DATA") },
  handler: async (ctx) => {
    const seedEmails = [
      "admin@pixel-mart.test",
      "vendor@pixel-mart.test",
      "vendor2@pixel-mart.test",
      "customer@pixel-mart.test",
      "agent@pixel-mart.test",
    ];

    let deleted = { users: 0, stores: 0, products: 0 };

    for (const email of seedEmails) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();

      if (!user) continue;

      // Supprimer les boutiques + produits du vendor
      const stores = await ctx.db
        .query("stores")
        .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
        .collect();

      for (const store of stores) {
        const products = await ctx.db
          .query("products")
          .withIndex("by_store", (q) => q.eq("store_id", store._id))
          .collect();

        for (const product of products) {
          await ctx.db.delete(product._id);
          deleted.products++;
        }

        await ctx.db.delete(store._id);
        deleted.stores++;
      }

      await ctx.db.delete(user._id);
      deleted.users++;
    }

    return deleted;
  },
});
