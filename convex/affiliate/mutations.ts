// filepath: convex/affiliate/mutations.ts

import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { requireSuperAdmin, requireRoles } from "../users/helpers";
import { getAffiliateConfig } from "../lib/getConfig";
import { generateAffiliateCode } from "./helpers";

// ─── Admin: créer un lien affilié ────────────────────────────

export const createAffiliateLink = mutation({
  args: {
    referrer_store_id: v.id("stores"),
    commission_rate_bp: v.number(),
    duration_days: v.optional(v.number()), // undefined = illimité
    custom_code: v.optional(v.string()), // code personnalisé (optionnel)
  },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);
    const { maxCommissionBp, maxDurationDays } = await getAffiliateConfig(ctx);

    if (
      args.commission_rate_bp <= 0 ||
      args.commission_rate_bp > maxCommissionBp
    ) {
      throw new Error(
        `Taux invalide. Maximum autorisé : ${maxCommissionBp / 100} %`,
      );
    }
    if (
      args.duration_days !== undefined &&
      args.duration_days > maxDurationDays
    ) {
      throw new Error(
        `Durée invalide. Maximum autorisé : ${maxDurationDays} jours`,
      );
    }

    const store = await ctx.db.get(args.referrer_store_id);
    if (!store) throw new Error("Boutique introuvable");

    let code: string;
    if (args.custom_code) {
      // Valider et normaliser le code custom
      const normalized = args.custom_code.trim().toUpperCase();
      if (!/^[A-Z0-9-]{3,30}$/.test(normalized)) {
        throw new Error(
          "Code invalide. Utilisez uniquement des lettres, chiffres et tirets (3–30 caractères).",
        );
      }
      const existing = await ctx.db
        .query("affiliate_links")
        .withIndex("by_code", (q) => q.eq("code", normalized))
        .unique();
      if (existing) throw new Error("Ce code est déjà utilisé.");
      code = normalized;
    } else {
      // Générer un code unique (retry si collision)
      code = generateAffiliateCode();
      let attempts = 0;
      while (
        await ctx.db
          .query("affiliate_links")
          .withIndex("by_code", (q) => q.eq("code", code))
          .unique()
      ) {
        if (++attempts > 10)
          throw new Error("Impossible de générer un code unique");
        code = generateAffiliateCode();
      }
    }

    const now = Date.now();
    const expires_at =
      args.duration_days !== undefined
        ? now + args.duration_days * 24 * 60 * 60 * 1000
        : undefined;

    const linkId = await ctx.db.insert("affiliate_links", {
      created_by: admin._id,
      referrer_store_id: args.referrer_store_id,
      code,
      commission_rate_bp: args.commission_rate_bp,
      duration_days: args.duration_days,
      expires_at,
      is_active: true,
      referral_count: 0,
      total_commission_earned: 0,
      created_at: now,
      updated_at: now,
    });

    return { linkId, code };
  },
});

// ─── Admin: activer / désactiver un lien ─────────────────────

export const toggleAffiliateLink = mutation({
  args: {
    link_id: v.id("affiliate_links"),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const link = await ctx.db.get(args.link_id);
    if (!link) throw new Error("Lien introuvable");
    await ctx.db.patch(args.link_id, {
      is_active: args.is_active,
      updated_at: Date.now(),
    });
  },
});

// ─── Admin: marquer une commission comme payée ───────────────

export const markCommissionPaid = mutation({
  args: {
    commission_id: v.id("affiliate_commissions"),
    admin_note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireRoles(ctx, ["admin", "finance"]);
    const commission = await ctx.db.get(args.commission_id);
    if (!commission) throw new Error("Commission introuvable");
    if (commission.status !== "pending") {
      throw new Error(
        "Seules les commissions en attente peuvent être marquées payées",
      );
    }
    const now = Date.now();
    await ctx.db.patch(args.commission_id, {
      status: "paid",
      paid_at: now,
      paid_by: admin._id,
      admin_note: args.admin_note,
      updated_at: now,
    });
  },
});

// ─── Admin: marquer plusieurs commissions payées (bulk) ──────

export const markCommissionsPaid = mutation({
  args: {
    commission_ids: v.array(v.id("affiliate_commissions")),
    admin_note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireRoles(ctx, ["admin", "finance"]);
    const now = Date.now();
    let count = 0;
    for (const id of args.commission_ids) {
      const c = await ctx.db.get(id);
      if (c && c.status === "pending") {
        await ctx.db.patch(id, {
          status: "paid",
          paid_at: now,
          paid_by: admin._id,
          admin_note: args.admin_note,
          updated_at: now,
        });
        count++;
      }
    }
    return { marked: count };
  },
});

// ─── Admin: override manuel du montant ───────────────────────

export const overrideCommissionAmount = mutation({
  args: {
    commission_id: v.id("affiliate_commissions"),
    manual_override_amount: v.number(),
    admin_note: v.string(),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const commission = await ctx.db.get(args.commission_id);
    if (!commission) throw new Error("Commission introuvable");
    await ctx.db.patch(args.commission_id, {
      manual_override_amount: args.manual_override_amount,
      admin_note: args.admin_note,
      updated_at: Date.now(),
    });
  },
});

// ─── Internal: annuler les commissions d'une commande ────────

export const cancelCommissionsForOrder = internalMutation({
  args: { order_id: v.id("orders") },
  handler: async (ctx, args) => {
    const commissions = await ctx.db
      .query("affiliate_commissions")
      .withIndex("by_order", (q) => q.eq("order_id", args.order_id))
      .collect();
    const now = Date.now();
    for (const c of commissions) {
      if (c.status === "pending") {
        await ctx.db.patch(c._id, { status: "cancelled", updated_at: now });
        const link = await ctx.db.get(c.affiliate_link_id);
        if (link) {
          await ctx.db.patch(c.affiliate_link_id, {
            total_commission_earned: Math.max(
              0,
              link.total_commission_earned - c.commission_amount,
            ),
            updated_at: now,
          });
        }
      }
    }
  },
});

// ─── Internal: créer un enregistrement de commission ─────────
// Appelé depuis createOrder (COD) et confirmPayment (online)

export const createCommissionRecord = internalMutation({
  args: {
    affiliate_link_id: v.id("affiliate_links"),
    referrer_store_id: v.id("stores"),
    referlee_store_id: v.id("stores"),
    order_id: v.id("orders"),
    order_subtotal: v.number(),
    commission_rate_bp: v.number(),
    commission_amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("affiliate_commissions", {
      affiliate_link_id: args.affiliate_link_id,
      referrer_store_id: args.referrer_store_id,
      referlee_store_id: args.referlee_store_id,
      order_id: args.order_id,
      order_subtotal: args.order_subtotal,
      commission_rate_bp: args.commission_rate_bp,
      commission_amount: args.commission_amount,
      currency: args.currency,
      status: "pending",
      created_at: now,
      updated_at: now,
    });
    const link = await ctx.db.get(args.affiliate_link_id);
    if (link) {
      await ctx.db.patch(args.affiliate_link_id, {
        total_commission_earned:
          link.total_commission_earned + args.commission_amount,
        updated_at: now,
      });
    }
  },
});

// ─── Internal: lier une boutique à un lien affilié ───────────
// Appelé depuis stores/mutations.ts à la création de boutique

export const linkStoreToAffiliate = internalMutation({
  args: {
    store_id: v.id("stores"),
    owner_id: v.id("users"),
    affiliate_code: v.string(),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("affiliate_links")
      .withIndex("by_code", (q) => q.eq("code", args.affiliate_code))
      .unique();

    if (!link || !link.is_active) return;

    const now = Date.now();
    const isExpired = link.expires_at !== undefined && link.expires_at < now;
    if (isExpired) return;

    await ctx.db.patch(args.store_id, {
      affiliate_link_id: link._id,
      affiliate_commission_rate_bp: link.commission_rate_bp,
    });

    await ctx.db.patch(link._id, {
      referral_count: link.referral_count + 1,
      updated_at: now,
    });

    // Notifier le parrain (in-app)
    const referrerStore = await ctx.db.get(link.referrer_store_id);
    if (referrerStore) {
      await ctx.scheduler.runAfter(0, internal.notifications.mutations.create, {
        userId: referrerStore.owner_id,
        type: "system",
        title: "Nouveau vendeur parrainé !",
        body: "Un nouveau vendeur vient de rejoindre Pixel-Mart via votre lien de parrainage.",
        link: "/vendor/parrainage",
        channels: ["in_app"],
        sentVia: ["in_app"],
        metadata: undefined,
      });
    }
  },
});
