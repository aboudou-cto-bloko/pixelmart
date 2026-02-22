// filepath: convex/users/helpers.ts

import { QueryCtx, MutationCtx } from "../_generated/server";
import { authComponent } from "../auth";

type Ctx = QueryCtx | MutationCtx;

/**
 * Retourne l'utilisateur app Pixel-Mart à partir de la session Better Auth.
 * Retourne null si pas de session ou pas d'utilisateur app.
 */
export async function getAppUser(ctx: Ctx) {
  const betterAuthUser = await authComponent.getAuthUser(ctx);
  if (!betterAuthUser) return null;

  const appUser = await ctx.db
    .query("users")
    .withIndex("by_better_auth_id", (q) =>
      q.eq("better_auth_user_id", betterAuthUser._id),
    )
    .unique();

  return appUser;
}

/**
 * Comme getAppUser mais throw si pas authentifié.
 */
export async function requireAppUser(ctx: Ctx) {
  const user = await getAppUser(ctx);
  if (!user) {
    throw new Error("Non authentifié");
  }
  if (user.is_banned) {
    throw new Error("Compte suspendu");
  }
  return user;
}

/**
 * Requiert un utilisateur avec le rôle vendor ou admin.
 */
export async function requireVendor(ctx: Ctx) {
  const user = await requireAppUser(ctx);
  if (user.role !== "vendor" && user.role !== "admin") {
    throw new Error("Accès réservé aux vendeurs");
  }
  return user;
}

/**
 * Requiert un utilisateur admin.
 */
export async function requireAdmin(ctx: Ctx) {
  const user = await requireAppUser(ctx);
  if (user.role !== "admin") {
    throw new Error("Accès réservé aux administrateurs");
  }
  return user;
}

/**
 * Retourne la boutique du vendor connecté.
 * Throw si le vendor n'a pas de boutique.
 */
export async function getVendorStore(ctx: Ctx) {
  const user = await requireVendor(ctx);

  const store = await ctx.db
    .query("stores")
    .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
    .first();

  if (!store) {
    throw new Error("Aucune boutique trouvée — complétez l'onboarding");
  }

  return { user, store };
}
