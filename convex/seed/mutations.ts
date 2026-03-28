// filepath: convex/seed/mutations.ts
// Mutations internes pour le seed de test — ne jamais exposer en production

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { calculateCommission } from "../orders/helpers";
import { COMMISSION_RATES } from "../lib/constants";

// ─── Promouvoir un utilisateur existant ──────────────────────────────────────

export const promoteUser = internalMutation({
  args: {
    email: v.string(),
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

// ─── Créer un lot de commandes simulées ──────────────────────────────────────

/**
 * Crée un ensemble de commandes couvrant tout le pipeline :
 * pending → paid → processing → shipped → delivered (+ cancelled)
 * Met à jour les balances store conformément aux règles F-01/F-03/F-04.
 */
export const createOrders = internalMutation({
  args: {
    storeId: v.id("stores"),
    customerEmail: v.string(),
  },
  handler: async (ctx, args) => {
    // ── Récupérer store + customer ─────────────────────────────
    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("Boutique introuvable");

    const customer = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.customerEmail))
      .first();
    if (!customer) throw new Error(`Customer ${args.customerEmail} introuvable`);

    // ── Récupérer les produits actifs de la boutique ───────────
    const products = await ctx.db
      .query("products")
      .withIndex("by_store", (q) => q.eq("store_id", args.storeId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (products.length === 0) {
      throw new Error("Aucun produit actif dans cette boutique. Seedez les produits d'abord.");
    }

    // Résoudre les URLs des images (MutationCtx a accès à ctx.storage)
    const productImages: Record<string, string> = {};
    for (const p of products) {
      if (p.images[0]) {
        const url = await ctx.storage.getUrl(p.images[0] as Id<"_storage">);
        productImages[p._id] = url ?? "";
      } else {
        productImages[p._id] = "";
      }
    }

    const commissionRate =
      COMMISSION_RATES[store.subscription_tier as keyof typeof COMMISSION_RATES] ??
      COMMISSION_RATES.free;

    const shippingAddress = {
      full_name: customer.name,
      line1: "Quartier Cadjehoun, Rue 123",
      city: "Cotonou",
      country: "BJ",
      phone: customer.phone ?? "+22961000099",
    };

    // ── Générateur de numéro de commande simple ────────────────
    const makeOrderNumber = async (): Promise<string> => {
      const year = new Date().getFullYear();
      const prefix = `PM-${year}-`;
      const lastOrder = await ctx.db
        .query("orders")
        .withIndex("by_order_number")
        .order("desc")
        .first();
      let seq = 1;
      if (lastOrder?.order_number?.startsWith(prefix)) {
        const lastSeq = parseInt(lastOrder.order_number.slice(prefix.length), 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      return `${prefix}${String(seq).padStart(4, "0")}`;
    };

    // ── Helper : créer 1 commande + transactions + màj balance ──
    const createOne = async (opts: {
      status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
      productIndex: number;
      quantity: number;
      daysAgo?: number;
      trackingNumber?: string;
    }) => {
      const product = products[opts.productIndex % products.length];
      const unitPrice = product.price;
      const qty = opts.quantity;
      const subtotal = unitPrice * qty;
      const shippingAmount = 50000; // 500 FCFA forfait
      const totalAmount = subtotal + shippingAmount;
      const commissionAmount = calculateCommission(totalAmount, commissionRate);
      const netAmount = totalAmount - commissionAmount;

      const isPaid = ["paid", "processing", "shipped", "delivered"].includes(opts.status);
      const paymentStatus = isPaid ? "paid" : opts.status === "cancelled" ? "failed" : "pending";
      const orderNumber = await makeOrderNumber();
      const now = Date.now();
      const createdAt = opts.daysAgo
        ? now - opts.daysAgo * 24 * 60 * 60 * 1000
        : now;

      const orderId = await ctx.db.insert("orders", {
        order_number: orderNumber,
        customer_id: customer._id,
        store_id: args.storeId,
        items: [
          {
            product_id: product._id,
            title: product.title,
            sku: product.sku,
            image_url: productImages[product._id] ?? "",
            quantity: qty,
            unit_price: unitPrice,
            total_price: unitPrice * qty,
          },
        ],
        subtotal,
        shipping_amount: shippingAmount,
        discount_amount: 0,
        total_amount: totalAmount,
        currency: store.currency,
        status: opts.status,
        payment_status: paymentStatus,
        payment_method: isPaid ? "moneroo_mtn" : undefined,
        payment_reference: isPaid ? `SEED-${orderNumber}` : undefined,
        shipping_address: shippingAddress,
        commission_amount: commissionAmount,
        delivery_type: "standard",
        payment_mode: "online",
        source: "marketplace",
        tracking_number: opts.trackingNumber,
        delivered_at:
          opts.status === "delivered" ? createdAt + 2 * 24 * 60 * 60 * 1000 : undefined,
        updated_at: createdAt,
      });

      // ── Transactions + balance (uniquement si payé) ──────────
      if (isPaid) {
        const currentStore = await ctx.db.get(args.storeId);
        if (!currentStore) return orderId;

        const balanceBefore = currentStore.pending_balance;
        const balanceAfter = balanceBefore + netAmount;

        // Transaction sale (crédit net vers pending_balance)
        await ctx.db.insert("transactions", {
          store_id: args.storeId,
          order_id: orderId,
          type: "sale",
          direction: "credit",
          amount: netAmount,
          currency: store.currency,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          status: "completed",
          reference: `SEED-${orderNumber}`,
          description: `Vente commande ${orderNumber}`,
          processed_at: createdAt,
        });

        // Transaction fee (commission Pixel-Mart)
        if (commissionAmount > 0) {
          await ctx.db.insert("transactions", {
            store_id: args.storeId,
            order_id: orderId,
            type: "fee",
            direction: "debit",
            amount: commissionAmount,
            currency: store.currency,
            balance_before: balanceAfter,
            balance_after: balanceAfter,
            status: "completed",
            reference: `SEED-${orderNumber}`,
            description: `Commission Pixel-Mart commande ${orderNumber}`,
            processed_at: createdAt,
          });
        }

        if (opts.status === "delivered") {
          // F-03 : déjà livrée → balance liquide (simuler le release de la balance)
          const releasedStore = await ctx.db.get(args.storeId);
          if (!releasedStore) return orderId;

          await ctx.db.insert("transactions", {
            store_id: args.storeId,
            order_id: orderId,
            type: "credit",
            direction: "credit",
            amount: netAmount,
            currency: store.currency,
            balance_before: releasedStore.balance,
            balance_after: releasedStore.balance + netAmount,
            status: "completed",
            description: `Release commande ${orderNumber}`,
            processed_at: createdAt + 3 * 24 * 60 * 60 * 1000,
          });

          await ctx.db.patch(args.storeId, {
            balance: releasedStore.balance + netAmount,
            pending_balance: Math.max(0, releasedStore.pending_balance),
            total_orders: (releasedStore.total_orders ?? 0) + 1,
            updated_at: Date.now(),
          });
        } else {
          // Non livré → pending_balance uniquement
          await ctx.db.patch(args.storeId, {
            pending_balance: balanceAfter,
            total_orders: (currentStore.total_orders ?? 0) + 1,
            updated_at: Date.now(),
          });
        }
      }

      return orderId;
    };

    // ── Scénarios créés ────────────────────────────────────────
    const orderIds: Record<string, Id<"orders">> = {};

    // 2 commandes en attente de paiement (récentes)
    orderIds.pending_1 = await createOne({ status: "pending", productIndex: 0, quantity: 1 });
    orderIds.pending_2 = await createOne({ status: "pending", productIndex: 1, quantity: 2 });

    // 2 commandes payées (vendor doit traiter)
    orderIds.paid_1 = await createOne({ status: "paid", productIndex: 0, quantity: 1, daysAgo: 1 });
    orderIds.paid_2 = await createOne({ status: "paid", productIndex: 2, quantity: 3, daysAgo: 2 });

    // 2 commandes en cours de préparation
    orderIds.processing_1 = await createOne({ status: "processing", productIndex: 1, quantity: 1, daysAgo: 3 });
    orderIds.processing_2 = await createOne({ status: "processing", productIndex: 3, quantity: 2, daysAgo: 4 });

    // 2 commandes expédiées (avec numéro de suivi)
    orderIds.shipped_1 = await createOne({
      status: "shipped",
      productIndex: 0,
      quantity: 1,
      daysAgo: 5,
      trackingNumber: "PM-TRK-001234",
    });
    orderIds.shipped_2 = await createOne({
      status: "shipped",
      productIndex: 2,
      quantity: 1,
      daysAgo: 6,
      trackingNumber: "PM-TRK-001235",
    });

    // 3 commandes livrées (balance déjà créditée)
    orderIds.delivered_1 = await createOne({ status: "delivered", productIndex: 1, quantity: 2, daysAgo: 10 });
    orderIds.delivered_2 = await createOne({ status: "delivered", productIndex: 3, quantity: 1, daysAgo: 15 });
    orderIds.delivered_3 = await createOne({ status: "delivered", productIndex: 0, quantity: 1, daysAgo: 20 });

    // 1 commande annulée
    orderIds.cancelled_1 = await createOne({ status: "cancelled", productIndex: 4, quantity: 1, daysAgo: 7 });

    return {
      created: Object.keys(orderIds).length,
      orderIds,
    };
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
      "finance@pixel-mart.test",
      "logistics@pixel-mart.test",
      "developer@pixel-mart.test",
      "marketing@pixel-mart.test",
    ];

    let deleted = { users: 0, stores: 0, products: 0, orders: 0, transactions: 0 };

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

        // Supprimer les commandes + transactions associées à cette boutique
        const orders = await ctx.db
          .query("orders")
          .withIndex("by_store", (q) => q.eq("store_id", store._id))
          .collect();

        for (const order of orders) {
          const txns = await ctx.db
            .query("transactions")
            .withIndex("by_store", (q) => q.eq("store_id", store._id))
            .filter((q) => q.eq(q.field("order_id"), order._id))
            .collect();
          for (const txn of txns) { await ctx.db.delete(txn._id); deleted.transactions++; }
          await ctx.db.delete(order._id);
          deleted.orders++;
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
