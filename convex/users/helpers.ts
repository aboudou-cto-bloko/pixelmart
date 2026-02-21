import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

/**
 * Récupère l'utilisateur Pixel-Mart (app-level) à partir du contexte auth.
 * Retourne null si non authentifié.
 */
export async function getAppUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
  // Get Better Auth user ID from the authenticated session
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // The subject field contains the Better Auth user ID
  const betterAuthUserId = identity.subject;
  if (!betterAuthUserId) return null;

  // Lookup our app user by Better Auth ID
  const appUser = await ctx.db
    .query("users")
    .withIndex("by_better_auth_id", (q) =>
      q.eq("better_auth_user_id", betterAuthUserId),
    )
    .unique();

  return appUser;
}

/**
 * Comme getAppUser, mais throw si non authentifié.
 * À utiliser dans les mutations qui requièrent un utilisateur.
 */
export async function requireAppUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
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
 * Vérifie que l'utilisateur a le rôle requis.
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  ...roles: Doc<"users">["role"][]
): Promise<Doc<"users">> {
  const user = await requireAppUser(ctx);
  if (!roles.includes(user.role)) {
    throw new Error(`Rôle requis : ${roles.join(" ou ")}`);
  }
  return user;
}
