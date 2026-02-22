// filepath: convex/files/mutations.ts

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireVendor } from "../users/helpers";

/**
 * Génère une URL d'upload temporaire (expire dans 1h).
 * Le client POST le fichier vers cette URL et reçoit un storageId.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Seuls les vendors/admins peuvent uploader
    await requireVendor(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Supprime un fichier du storage Convex.
 * Utilisé quand on retire une image d'un produit.
 */
export const deleteFile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireVendor(ctx);
    await ctx.storage.delete(args.storageId);
  },
});
