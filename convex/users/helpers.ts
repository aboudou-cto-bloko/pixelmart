// filepath: convex/users/helpers.ts

import type { QueryCtx, MutationCtx } from "../_generated/server";
import { authComponent } from "../auth";

// ─── Admin role constants ──────────────────────────────────────

/** Tous les rôles qui ont accès au dashboard admin */
export const ADMIN_ROLES = [
  "admin",
  "finance",
  "logistics",
  "developer",
  "marketing",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

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
 * Requiert n'importe quel rôle admin (lecture générale du dashboard).
 * Anciennement requireAdmin — garde le même nom pour ne pas casser les imports existants.
 */
export async function requireAdmin(ctx: Ctx) {
  const user = await requireAppUser(ctx);
  if (!(ADMIN_ROLES as readonly string[]).includes(user.role)) {
    throw new Error("Accès réservé aux administrateurs");
  }
  return user;
}

/**
 * Requiert le rôle super admin uniquement (admin).
 * Utilisé pour les opérations sensibles : ban, config, changement de rôle, etc.
 */
export async function requireSuperAdmin(ctx: Ctx) {
  const user = await requireAppUser(ctx);
  if (user.role !== "admin") {
    throw new Error("Accès réservé au super administrateur");
  }
  return user;
}

/**
 * Requiert que l'utilisateur ait l'un des rôles spécifiés.
 */
export async function requireRoles(ctx: Ctx, roles: string[]) {
  const user = await requireAppUser(ctx);
  if (!roles.includes(user.role)) {
    throw new Error("Accès non autorisé pour ce rôle");
  }
  return user;
}

/**
 * Requiert un utilisateur avec le rôle agent ou admin.
 */
export async function requireAgent(ctx: Ctx) {
  const user = await requireAppUser(ctx);
  if (user.role !== "agent" && user.role !== "admin") {
    throw new Error("Accès réservé aux agents entrepôt");
  }
  return user;
}

/**
 * Retourne la boutique active du vendor connecté.
 * Priorité : active_store_id > première boutique trouvée.
 * Throw si le vendor n'a aucune boutique.
 */
export async function getVendorStore(ctx: Ctx) {
  const user = await requireVendor(ctx);

  // Tente de charger la boutique active si définie
  if (user.active_store_id) {
    const activeStore = await ctx.db.get(user.active_store_id);
    if (activeStore && activeStore.owner_id === user._id) {
      return { user, store: activeStore };
    }
    // active_store_id obsolète — on continue avec le fallback
  }

  // Fallback : première boutique de ce vendor
  const store = await ctx.db
    .query("stores")
    .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
    .first();

  if (!store) {
    throw new Error("Aucune boutique trouvée — complétez l'onboarding");
  }

  return { user, store };
}
