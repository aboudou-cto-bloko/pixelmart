// filepath: convex/questions/mutations.ts

import { mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { requireAppUser, getVendorStore } from "../users/helpers";

/**
 * Poser une question sur un produit — tout utilisateur authentifié.
 * Pas besoin d'avoir acheté le produit.
 */
export const ask = mutation({
  args: {
    product_id: v.id("products"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const trimmed = args.body.trim();
    if (trimmed.length === 0) {
      throw new ConvexError("La question ne peut pas être vide");
    }
    if (trimmed.length > 500) {
      throw new ConvexError("La question ne peut pas dépasser 500 caractères");
    }

    const product = await ctx.db.get(args.product_id);
    if (!product || product.status === "archived") {
      throw new ConvexError("Produit introuvable");
    }

    const questionId = await ctx.db.insert("product_questions", {
      product_id: args.product_id,
      store_id: product.store_id,
      author_id: user._id,
      source: "customer",
      body: trimmed,
      is_published: true,
    });

    return questionId;
  },
});

/**
 * Le vendor ajoute une paire question/réponse directement (FAQ, question fréquente).
 * Uniquement le vendor propriétaire du produit.
 */
export const addVendorQA = mutation({
  args: {
    product_id: v.id("products"),
    body: v.string(),
    vendor_answer: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, store } = await getVendorStore(ctx);

    const trimmedQ = args.body.trim();
    const trimmedA = args.vendor_answer.trim();

    if (trimmedQ.length === 0) {
      throw new ConvexError("La question ne peut pas être vide");
    }
    if (trimmedQ.length > 500) {
      throw new ConvexError("La question ne peut pas dépasser 500 caractères");
    }
    if (trimmedA.length === 0) {
      throw new ConvexError("La réponse ne peut pas être vide");
    }
    if (trimmedA.length > 1000) {
      throw new ConvexError("La réponse ne peut pas dépasser 1000 caractères");
    }

    const product = await ctx.db.get(args.product_id);
    if (!product) throw new ConvexError("Produit introuvable");
    if (product.store_id !== store._id) {
      throw new ConvexError("Ce produit n'appartient pas à votre boutique");
    }

    const questionId = await ctx.db.insert("product_questions", {
      product_id: args.product_id,
      store_id: store._id,
      author_id: user._id,
      source: "vendor",
      body: trimmedQ,
      is_published: true,
      vendor_answer: trimmedA,
      answered_at: Date.now(),
    });

    return questionId;
  },
});

/**
 * Répondre à une question client — uniquement le vendor du store concerné.
 */
export const answer = mutation({
  args: {
    question_id: v.id("product_questions"),
    vendor_answer: v.string(),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const trimmed = args.vendor_answer.trim();
    if (trimmed.length === 0) {
      throw new ConvexError("La réponse ne peut pas être vide");
    }
    if (trimmed.length > 1000) {
      throw new ConvexError("La réponse ne peut pas dépasser 1000 caractères");
    }

    const question = await ctx.db.get(args.question_id);
    if (!question) throw new ConvexError("Question introuvable");

    if (question.store_id !== store._id) {
      throw new ConvexError(
        "Vous ne pouvez répondre qu'aux questions de votre boutique",
      );
    }

    await ctx.db.patch(args.question_id, {
      vendor_answer: trimmed,
      answered_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Modifier une réponse existante — uniquement le vendor du store.
 */
export const editAnswer = mutation({
  args: {
    question_id: v.id("product_questions"),
    vendor_answer: v.string(),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const trimmed = args.vendor_answer.trim();
    if (trimmed.length === 0) {
      throw new ConvexError("La réponse ne peut pas être vide");
    }
    if (trimmed.length > 1000) {
      throw new ConvexError("La réponse ne peut pas dépasser 1000 caractères");
    }

    const question = await ctx.db.get(args.question_id);
    if (!question) throw new ConvexError("Question introuvable");

    if (question.store_id !== store._id) {
      throw new ConvexError("Action non autorisée");
    }

    await ctx.db.patch(args.question_id, {
      vendor_answer: trimmed,
      answered_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Modifier le corps de la question — auteur ou vendor (pour les Q&A vendeur).
 */
export const editQuestion = mutation({
  args: {
    question_id: v.id("product_questions"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const trimmed = args.body.trim();
    if (trimmed.length === 0) {
      throw new ConvexError("La question ne peut pas être vide");
    }
    if (trimmed.length > 500) {
      throw new ConvexError("La question ne peut pas dépasser 500 caractères");
    }

    const question = await ctx.db.get(args.question_id);
    if (!question) throw new ConvexError("Question introuvable");

    const isAuthor = question.author_id === user._id;
    const isAdmin = user.role === "admin";

    // Vendor can edit their own seeded Q&A
    let isVendorOwner = false;
    if (user.role === "vendor") {
      const store = await ctx.db.get(question.store_id);
      isVendorOwner = store?.owner_id === user._id;
    }

    if (!isAuthor && !isAdmin && !isVendorOwner) {
      throw new ConvexError("Action non autorisée");
    }

    await ctx.db.patch(args.question_id, { body: trimmed });
    return { success: true };
  },
});

/**
 * Supprimer une question — auteur, vendor du store, ou admin.
 */
export const remove = mutation({
  args: {
    question_id: v.id("product_questions"),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const question = await ctx.db.get(args.question_id);
    if (!question) throw new ConvexError("Question introuvable");

    const isAuthor = question.author_id === user._id;
    const isAdmin = user.role === "admin";

    let isVendor = false;
    if (user.role === "vendor") {
      const store = await ctx.db.get(question.store_id);
      isVendor = store?.owner_id === user._id;
    }

    if (!isAuthor && !isAdmin && !isVendor) {
      throw new ConvexError("Action non autorisée");
    }

    await ctx.db.delete(args.question_id);
    return { success: true };
  },
});

/**
 * Masquer/afficher une question — vendor du store ou admin.
 */
export const setPublished = mutation({
  args: {
    question_id: v.id("product_questions"),
    is_published: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const question = await ctx.db.get(args.question_id);
    if (!question) throw new ConvexError("Question introuvable");

    const isAdmin = user.role === "admin";

    let isVendor = false;
    if (user.role === "vendor") {
      const store = await ctx.db.get(question.store_id);
      isVendor = store?.owner_id === user._id;
    }

    if (!isAdmin && !isVendor) {
      throw new ConvexError("Action non autorisée");
    }

    await ctx.db.patch(args.question_id, {
      is_published: args.is_published,
    });

    return { success: true };
  },
});
