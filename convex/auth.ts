// filepath: convex/auth.ts

import {
  createClient,
  type GenericCtx,
  type AuthFunctions,
} from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
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
      minPasswordLength: 12, // Increased from 8 to 12
      maxPasswordLength: 128,
      autoSignIn: false,
      resetPasswordTokenExpiresIn: 1800, // Reduced from 3600 to 1800 (30 minutes)

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

      // Password strength validation
      passwordValidator: (password: string) => {
        // Enforce strong password requirements on backend
        if (password.length < 12) {
          return {
            isValid: false,
            message: "Le mot de passe doit contenir au moins 12 caractères",
          };
        }

        if (!/(?=.*[a-z])/.test(password)) {
          return {
            isValid: false,
            message:
              "Le mot de passe doit contenir au moins une lettre minuscule",
          };
        }

        if (!/(?=.*[A-Z])/.test(password)) {
          return {
            isValid: false,
            message:
              "Le mot de passe doit contenir au moins une lettre majuscule",
          };
        }

        if (!/(?=.*\d)/.test(password)) {
          return {
            isValid: false,
            message: "Le mot de passe doit contenir au moins un chiffre",
          };
        }

        if (!/(?=.*[!@#$%^&*(),.?":{}|<>[\]\\`~;+=_-])/.test(password)) {
          return {
            isValid: false,
            message:
              "Le mot de passe doit contenir au moins un caractère spécial",
          };
        }

        // Check for repeated characters
        if (/(.)\1{2,}/.test(password)) {
          return {
            isValid: false,
            message:
              "Le mot de passe ne peut pas contenir plus de 2 caractères identiques consécutifs",
          };
        }

        // Check against common passwords
        const commonPasswords = [
          "password",
          "123456",
          "password123",
          "admin",
          "qwerty",
          "letmein",
          "welcome",
          "monkey",
          "1234567890",
          "password1",
          "123456789",
          "12345678",
          "Password1",
          "password!",
          "Password!",
          "azerty",
          "motdepasse",
        ];

        if (commonPasswords.includes(password.toLowerCase())) {
          return {
            isValid: false,
            message:
              "Ce mot de passe est trop courant, veuillez en choisir un autre",
          };
        }

        return { isValid: true };
      },
    },

    // ---- Rate Limiting ----
    rateLimit: {
      enabled: true,
      window: 15 * 60 * 1000, // 15 minutes window
      max: 5, // Max 5 attempts per window
      message: "Trop de tentatives. Veuillez réessayer dans quelques minutes.",
    },

    // ---- Account Lockout ----
    accountLockout: {
      enabled: true,
      maxFailedAttempts: 5, // Lock after 5 failed attempts
      lockoutDuration: 30 * 60 * 1000, // 30 minutes lockout
      resetFailedAttemptsAfter: 24 * 60 * 60 * 1000, // Reset counter after 24 hours
    },

    // ---- Advanced Security ----
    advanced: {
      crossSubDomainCookies: {
        enabled: false, // Prevent cross-subdomain attacks
      },
      generateId: () => {
        // Use crypto-secure ID generation
        return crypto.randomUUID();
      },
    },

    // ---- Session Security ----
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days instead of default 30
      updateAge: 60 * 60 * 24, // Update session every 24 hours
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60 * 1000, // 5 minutes cache
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
      expiresIn: 1800, // Reduced from 3600 to 1800 (30 minutes)
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
