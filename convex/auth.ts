import {
  createClient,
  type GenericCtx,
  type AuthFunctions,
} from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { betterAuth } from "better-auth/minimal";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;

// ---- Trigger functions reference ----
// These point to the exported trigger handlers below
const authFunctions: AuthFunctions = internal.auth;

// ---- Component client with triggers ----
export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      // When Better Auth creates a new user → create our app-level user
      onCreate: async (ctx, betterAuthUser) => {
        await ctx.db.insert("users", {
          better_auth_user_id: betterAuthUser._id,
          email: betterAuthUser.email,
          name: betterAuthUser.name,
          avatar_url: betterAuthUser.image ?? undefined,

          // Defaults for new users
          role: "customer",
          is_2fa_enabled: false,
          is_verified: false,
          is_banned: false,
          locale: "fr",
          updated_at: Date.now(),
        });
      },

      onUpdate: async (ctx, newDoc, _oldDoc) => {
        const appUser = await ctx.db
          .query("users")
          .withIndex("by_better_auth_id", (q) =>
            q.eq("better_auth_user_id", newDoc._id),
          )
          .unique();

        if (appUser) {
          await ctx.db.patch(appUser._id, {
            email: newDoc.email,
            name: newDoc.name,
            avatar_url: newDoc.image ?? undefined,
            updated_at: Date.now(),
          });
        }
      },

      // When Better Auth deletes a user → ban our app user (soft delete)
      onDelete: async (ctx, betterAuthUser) => {
        const appUser = await ctx.db
          .query("users")
          .withIndex("by_better_auth_id", (q) =>
            q.eq("better_auth_user_id", betterAuthUser._id),
          )
          .unique();

        if (appUser) {
          await ctx.db.patch(appUser._id, {
            is_banned: true,
            updated_at: Date.now(),
          });
        }
      },
    },
  },
});

// ---- Export trigger API (REQUIRED by the component) ----
// These are the internal functions that the component calls
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

// ---- Better Auth instance factory ----
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex({ authConfig })],
  });
};
