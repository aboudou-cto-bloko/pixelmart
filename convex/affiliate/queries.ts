// filepath: convex/affiliate/queries.ts

import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import {
  requireSuperAdmin,
  requireRoles,
  getVendorStore,
} from "../users/helpers";

// ─── Admin: liste des liens affiliés (paginée) ───────────────

export const listAffiliateLinkAdmin = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    let q = ctx.db.query("affiliate_links").order("desc");

    const filterActive = args.is_active;
    if (filterActive !== undefined) {
      q = ctx.db
        .query("affiliate_links")
        .withIndex("by_active", (qi) => qi.eq("is_active", filterActive))
        .order("desc") as typeof q;
    }

    const page = await q.paginate(args.paginationOpts);

    const enriched = await Promise.all(
      page.page.map(async (link) => {
        const store = await ctx.db.get(link.referrer_store_id);
        return { ...link, referrer_store_name: store?.name ?? null };
      }),
    );

    return { ...page, page: enriched };
  },
});

// ─── Admin: détail d'un lien affilié ─────────────────────────

export const getAffiliateLinkDetail = query({
  args: { link_id: v.id("affiliate_links") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const link = await ctx.db.get(args.link_id);
    if (!link) return null;
    const store = await ctx.db.get(link.referrer_store_id);
    const createdBy = await ctx.db.get(link.created_by);

    // Referlee stores (stores that used this link)
    const commissions = await ctx.db
      .query("affiliate_commissions")
      .withIndex("by_affiliate_link", (q) =>
        q.eq("affiliate_link_id", args.link_id),
      )
      .collect();

    const uniqueReferlleeIds = [
      ...new Set(commissions.map((c) => c.referlee_store_id)),
    ];
    const referlleStores = await Promise.all(
      uniqueReferlleeIds.map((id) => ctx.db.get(id)),
    );

    return {
      ...link,
      referrer_store_name: store?.name ?? null,
      created_by_name: createdBy?.name ?? null,
      referlee_stores: referlleStores.filter(Boolean),
    };
  },
});

// ─── Admin: liste des commissions (filtrable) ─────────────────

export const listCommissionsAdmin = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("paid"), v.literal("cancelled")),
    ),
    referrer_store_id: v.optional(v.id("stores")),
  },
  handler: async (ctx, args) => {
    await requireRoles(ctx, ["admin", "finance"]);

    let page;

    const filterStatus = args.status;
    const filterReferrerId = args.referrer_store_id;
    if (filterStatus) {
      page = await ctx.db
        .query("affiliate_commissions")
        .withIndex("by_status", (q) => q.eq("status", filterStatus))
        .order("desc")
        .paginate(args.paginationOpts);
    } else if (filterReferrerId) {
      page = await ctx.db
        .query("affiliate_commissions")
        .withIndex("by_referrer_store", (q) =>
          q.eq("referrer_store_id", filterReferrerId),
        )
        .order("desc")
        .paginate(args.paginationOpts);
    } else {
      page = await ctx.db
        .query("affiliate_commissions")
        .order("desc")
        .paginate(args.paginationOpts);
    }

    const enriched = await Promise.all(
      page.page.map(async (c) => {
        const [referrerStore, referlleeStore, order] = await Promise.all([
          ctx.db.get(c.referrer_store_id),
          ctx.db.get(c.referlee_store_id),
          ctx.db.get(c.order_id),
        ]);
        return {
          ...c,
          referrer_store_name: referrerStore?.name ?? null,
          referlee_store_name: referlleeStore?.name ?? null,
          order_number: order?.order_number ?? null,
        };
      }),
    );

    return { ...page, page: enriched };
  },
});

// ─── Admin: statistiques globales d'affiliation ───────────────

export const getCommissionsStats = query({
  args: {},
  handler: async (ctx) => {
    await requireRoles(ctx, ["admin", "finance"]);

    const [allLinks, allCommissions] = await Promise.all([
      ctx.db.query("affiliate_links").collect(),
      ctx.db.query("affiliate_commissions").collect(),
    ]);

    const activeLinks = allLinks.filter((l) => l.is_active);
    const pendingCommissions = allCommissions.filter(
      (c) => c.status === "pending",
    );
    const paidCommissions = allCommissions.filter((c) => c.status === "paid");

    const totalPending = pendingCommissions.reduce(
      (sum, c) => sum + c.commission_amount,
      0,
    );
    const totalPaid = paidCommissions.reduce(
      (sum, c) => sum + c.commission_amount,
      0,
    );
    const totalEarned = allCommissions
      .filter((c) => c.status !== "cancelled")
      .reduce((sum, c) => sum + c.commission_amount, 0);

    return {
      total_links: allLinks.length,
      active_links: activeLinks.length,
      total_referrals: allLinks.reduce((sum, l) => sum + l.referral_count, 0),
      total_commissions: allCommissions.length,
      pending_count: pendingCommissions.length,
      paid_count: paidCommissions.length,
      total_pending_amount: totalPending,
      total_paid_amount: totalPaid,
      total_earned_amount: totalEarned,
    };
  },
});

// ─── Vendor: accès au programme d'affiliation ────────────────
// Retourne true uniquement si l'admin a créé au moins un lien pour cette boutique.
// Utilisé pour masquer le menu "Parrainage" aux non-participants.

export const isEnrolledInAffiliateProgram = query({
  args: {},
  handler: async (ctx) => {
    let result;
    try {
      result = await getVendorStore(ctx);
    } catch {
      return false;
    }
    if (!result) return false;
    const { store } = result;

    const link = await ctx.db
      .query("affiliate_links")
      .withIndex("by_referrer_store", (q) =>
        q.eq("referrer_store_id", store._id),
      )
      .first();

    return link !== null;
  },
});

// ─── Vendor: mes liens affiliés ──────────────────────────────

export const listMyAffiliateLinks = query({
  args: {},
  handler: async (ctx) => {
    const result = await getVendorStore(ctx);
    if (!result) return [];
    const { store } = result;

    return ctx.db
      .query("affiliate_links")
      .withIndex("by_referrer_store", (q) =>
        q.eq("referrer_store_id", store._id),
      )
      .order("desc")
      .collect();
  },
});

// ─── Vendor: mes commissions ─────────────────────────────────

export const listMyCommissions = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("paid"), v.literal("cancelled")),
    ),
  },
  handler: async (ctx, args) => {
    const vendorResult = await getVendorStore(ctx);
    if (!vendorResult) return { page: [], isDone: true, continueCursor: "" };
    const { store } = vendorResult;

    let page;

    if (args.status) {
      // Fetch by referrer + filter client-side on status (no compound index needed)
      const all = await ctx.db
        .query("affiliate_commissions")
        .withIndex("by_referrer_store", (q) =>
          q.eq("referrer_store_id", store._id),
        )
        .order("desc")
        .collect();
      const filtered = all.filter((c) => c.status === args.status);
      // Manual pagination
      const cursor = args.paginationOpts.cursor
        ? parseInt(args.paginationOpts.cursor)
        : 0;
      const slice = filtered.slice(
        cursor,
        cursor + args.paginationOpts.numItems,
      );
      const nextCursor = cursor + slice.length;
      const isDone = nextCursor >= filtered.length;
      page = {
        page: slice,
        isDone,
        continueCursor: isDone ? "" : String(nextCursor),
      };
    } else {
      page = await ctx.db
        .query("affiliate_commissions")
        .withIndex("by_referrer_store", (q) =>
          q.eq("referrer_store_id", store._id),
        )
        .order("desc")
        .paginate(args.paginationOpts);
    }

    const enriched = await Promise.all(
      page.page.map(async (c) => {
        const [referlleeStore, order] = await Promise.all([
          ctx.db.get(c.referlee_store_id),
          ctx.db.get(c.order_id),
        ]);
        return {
          ...c,
          referlee_store_name: referlleeStore?.name ?? null,
          order_number: order?.order_number ?? null,
        };
      }),
    );

    return { ...page, page: enriched };
  },
});

// ─── Vendor: statistiques d'affiliation ──────────────────────

export const getMyAffiliateStats = query({
  args: {},
  handler: async (ctx) => {
    const statsResult = await getVendorStore(ctx);
    if (!statsResult) return null;
    const { store } = statsResult;

    const [links, commissions] = await Promise.all([
      ctx.db
        .query("affiliate_links")
        .withIndex("by_referrer_store", (q) =>
          q.eq("referrer_store_id", store._id),
        )
        .collect(),
      ctx.db
        .query("affiliate_commissions")
        .withIndex("by_referrer_store", (q) =>
          q.eq("referrer_store_id", store._id),
        )
        .collect(),
    ]);

    const activeLinks = links.filter((l) => l.is_active);
    const pendingCommissions = commissions.filter(
      (c) => c.status === "pending",
    );
    const paidCommissions = commissions.filter((c) => c.status === "paid");

    return {
      total_links: links.length,
      active_links: activeLinks.length,
      total_referrals: links.reduce((sum, l) => sum + l.referral_count, 0),
      pending_amount: pendingCommissions.reduce(
        (sum, c) => sum + c.commission_amount,
        0,
      ),
      paid_amount: paidCommissions.reduce(
        (sum, c) => sum + c.commission_amount,
        0,
      ),
      total_commissions: commissions.filter((c) => c.status !== "cancelled")
        .length,
    };
  },
});

// ─── Public: valider un code affilié ─────────────────────────
// Utilisé sur la page d'inscription pour afficher une bannière de confirmation

export const validateAffiliateCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("affiliate_links")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!link || !link.is_active) return null;

    const now = Date.now();
    if (link.expires_at !== undefined && link.expires_at < now) return null;

    const store = await ctx.db.get(link.referrer_store_id);
    return {
      code: link.code,
      commission_rate_bp: link.commission_rate_bp,
      referrer_store_name: store?.name ?? null,
    };
  },
});

// ─── Internal: récupérer le lien affilié d'une boutique ──────

export const getStorAffiliateInfo = internalQuery({
  args: { store_id: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.store_id);
    if (!store?.affiliate_link_id) return null;
    const link = await ctx.db.get(store.affiliate_link_id);
    if (!link) return null;
    return {
      affiliate_link_id: store.affiliate_link_id,
      referrer_store_id: link.referrer_store_id,
      commission_rate_bp:
        store.affiliate_commission_rate_bp ?? link.commission_rate_bp,
    };
  },
});
