// filepath: convex/auth.ts

import {
  createClient,
  type GenericCtx,
  type AuthFunctions,
} from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { betterAuth } from "better-auth/minimal";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { VerifyEmail } from "../emails/VerifyEmail";
import { ResetPassword } from "../emails/ResetPassword";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;
const resend = new Resend(process.env.RESEND_API_KEY);

// Adresse expéditeur — modifier UNIQUEMENT ici pour changer
const EMAIL_FROM = "Pixel-Mart <dev@aboudouzinsou.site>";

// ---- Trigger functions reference ----
const authFunctions: AuthFunctions = internal.auth;

// ---- Component client with triggers ----
export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, betterAuthUser) => {
        await ctx.db.insert("users", {
          better_auth_user_id: betterAuthUser._id,
          email: betterAuthUser.email,
          name: betterAuthUser.name,
          avatar_url: betterAuthUser.image ?? undefined,
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

// ---- Export trigger API (REQUIS) ----
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

// ---- Better Auth instance ----
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),

    // ---- Email + Password ----
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: false,
      resetPasswordTokenExpiresIn: 3600,

      sendResetPassword: async ({ user, url }) => {
        const html = await render(
          ResetPassword({ userName: user.name ?? "", resetUrl: url }),
        );
        const text = await render(
          ResetPassword({ userName: user.name ?? "", resetUrl: url }),
          { plainText: true },
        );

        await resend.emails.send({
          from: EMAIL_FROM,
          to: user.email,
          subject: "Réinitialiser votre mot de passe — Pixel-Mart",
          html,
          text,
        });
      },
    },

    // ---- Vérification email (TOP-LEVEL, pas dans emailAndPassword) ----
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        const html = await render(
          VerifyEmail({ userName: user.name ?? "", verificationUrl: url }),
        );
        const text = await render(
          VerifyEmail({ userName: user.name ?? "", verificationUrl: url }),
          { plainText: true },
        );

        await resend.emails.send({
          from: EMAIL_FROM,
          to: user.email,
          subject: "Vérifiez votre email — Pixel-Mart",
          html,
          text,
        });
      },
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 3600,
    },

    // ---- Google OAuth ----
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },

    plugins: [convex({ authConfig })],
  });
};
