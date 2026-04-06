import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAppUser } from "./helpers";

/**
 * Récupère le profil de l'utilisateur connecté.
 * Retourne null si non authentifié.
 */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    return await getAppUser(ctx);
  },
});

/**
 * Vérifie si un email correspond à un compte enregistré (non provisoire).
 * Utilisé lors du checkout invité pour informer l'utilisateur que sa commande
 * sera automatiquement associée à son compte existant.
 * Retourne false pour les comptes provisoires (guest_setup_token présent).
 */
export const checkGuestEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.email.trim().toLowerCase();
    if (!normalized.includes("@")) return { isRegistered: false };

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .unique();

    // Compte réel = better_auth_user_id défini et pas de token provisoire
    const isRegistered =
      !!user && !!user.better_auth_user_id && !user.guest_setup_token;

    return { isRegistered };
  },
});
