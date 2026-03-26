// filepath: convex/waitlist.ts

import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";

/**
 * Inscrit un email en waitlist pré-lancement.
 * Idempotent : ne crée pas de doublon, retourne alreadyRegistered si déjà présent.
 */
export const joinWaitlist = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("vendor"), v.literal("customer")),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ConvexError("Adresse email invalide.");
    }

    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      return { alreadyRegistered: true };
    }

    await ctx.db.insert("waitlist", {
      email,
      name: args.name?.trim() || undefined,
      role: args.role,
      created_at: Date.now(),
    });

    return { alreadyRegistered: false };
  },
});

/**
 * Nombre total d'inscrits en waitlist (affiché sur la landing).
 */
export const getWaitlistCount = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db.query("waitlist").collect();
    return entries.length;
  },
});
