// filepath: convex/seed/index.ts
// Actions publiques de seed — gated par SEED_ENABLED=true dans Convex dashboard
"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
  SEED_USERS,
  SEED_STORES,
  SEED_PRODUCTS,
  PRODUCT_IMAGE_SEEDS,
  type SeedCategory,
} from "./data";

// ─── Garde de sécurité ───────────────────────────────────────────────────────

function assertSeedEnabled(): void {
  if (process.env.SEED_ENABLED !== "true") {
    throw new Error(
      "Seed désactivé. Ajoutez SEED_ENABLED=true dans les variables d'environnement Convex.",
    );
  }
}

// ─── Upload d'image depuis Picsum vers Convex Storage ────────────────────────

async function uploadImageFromPicsum(
  generateUploadUrl: () => Promise<string>,
  seed: number,
  size = 800,
): Promise<string> {
  const imageUrl = `https://picsum.photos/seed/${seed}/${size}/${size}`;
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Picsum fetch failed for seed ${seed}`);

  const blob = await imgRes.blob();
  const uploadUrl = await generateUploadUrl();

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": blob.type || "image/jpeg" },
    body: blob,
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed: ${uploadRes.statusText}`);
  }

  const { storageId } = (await uploadRes.json()) as { storageId: string };
  return storageId;
}

// ─── Enregistrer un utilisateur via Better Auth ──────────────────────────────

async function registerUser(
  siteUrl: string,
  email: string,
  password: string,
  name: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${siteUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const body = await res.text();
    if (!res.ok) {
      return { success: false, message: `HTTP ${res.status}: ${body.slice(0, 120)}` };
    }
    return { success: true, message: "Compte créé" };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

// ─── Seed complet ─────────────────────────────────────────────────────────────

export const seedAll = action({
  args: {},
  handler: async (ctx): Promise<Record<string, unknown>> => {
    assertSeedEnabled();

    const siteUrl = process.env.SITE_URL;
    if (!siteUrl) throw new Error("SITE_URL non configuré");

    // 1. Créer les utilisateurs
    console.log("[seed] 1/3 Création des utilisateurs...");
    const userResults: Record<string, string> = {};

    for (const u of SEED_USERS) {
      const res = await registerUser(siteUrl, u.email, u.password, u.name);
      userResults[u.email] = res.message;

      // Promouvoir même si l'erreur est "already exists"
      try {
        await ctx.runMutation(internal.seed.mutations.promoteUser, {
          email: u.email,
          role: u.role,
        });
      } catch (err) {
        userResults[u.email] += ` (promote: ${String(err)})`;
      }
    }

    // 2. Créer les boutiques
    console.log("[seed] 2/3 Création des boutiques...");
    const storeIds: Record<string, Id<"stores"> | null> = {};

    for (const s of SEED_STORES) {
      try {
        const res = await ctx.runMutation(internal.seed.mutations.createStore, {
          ownerEmail: s.vendorEmail,
          name: s.name,
          slug: s.slug,
          description: s.description,
          country: s.country,
          currency: s.currency,
          contact_phone: s.contact_phone,
          contact_whatsapp: s.contact_whatsapp,
          contact_email: s.contact_email,
          subscription_tier: s.subscription_tier,
          is_verified: s.is_verified,
        });
        storeIds[s.slug] = res.storeId as Id<"stores">;
      } catch (err) {
        console.error(`[seed] Boutique ${s.slug} échouée:`, err);
        storeIds[s.slug] = null;
      }
    }

    // 3. Créer les produits avec images uploadées
    console.log("[seed] 3/3 Création des produits et upload des images...");
    const productResults: Record<string, number> = {};

    for (const [storeSlug, products] of Object.entries(SEED_PRODUCTS)) {
      const storeId = storeIds[storeSlug];
      if (!storeId) { productResults[storeSlug] = 0; continue; }

      let count = 0;
      for (const product of products) {
        const imageSeeds =
          PRODUCT_IMAGE_SEEDS[product.categorySlug as SeedCategory] ?? [10, 20];
        const storageIds: string[] = [];

        for (const seed of imageSeeds.slice(0, 3)) {
          try {
            const id = await uploadImageFromPicsum(
              () => ctx.storage.generateUploadUrl(),
              seed,
            );
            storageIds.push(id);
          } catch (err) {
            console.error(`[seed] Image seed=${seed} échouée:`, err);
          }
        }

        if (storageIds.length === 0) { continue; }

        try {
          await ctx.runMutation(internal.seed.mutations.createProduct, {
            storeId,
            categorySlug: product.categorySlug,
            title: product.title,
            description: product.description,
            short_description: product.short_description,
            price: product.price,
            compare_price: product.compare_price,
            quantity: product.quantity,
            tags: [...product.tags],
            imageStorageIds: storageIds,
            color: product.color,
            material: product.material,
            weight: product.weight,
          });
          count++;
        } catch (err) {
          console.error(`[seed] Produit "${product.title}" échoué:`, err);
        }
      }
      productResults[storeSlug] = count;
    }

    console.log("[seed] Terminé ✓");
    return { users: userResults, storeIds, products: productResults };
  },
});

// ─── Seed boutique d'un vendor déjà inscrit ──────────────────────────────────

export const seedVendorStore = action({
  args: { vendorEmail: v.string() },
  handler: async (ctx, args): Promise<{ storeId: string; productsCreated: number }> => {
    assertSeedEnabled();

    const storeConfig = SEED_STORES.find((s) => s.vendorEmail === args.vendorEmail);
    if (!storeConfig) {
      throw new Error(
        `Aucune config pour ${args.vendorEmail}. Disponibles : ${SEED_STORES.map((s) => s.vendorEmail).join(", ")}`,
      );
    }

    const storeRes = await ctx.runMutation(internal.seed.mutations.createStore, {
      ownerEmail: args.vendorEmail,
      name: storeConfig.name,
      slug: storeConfig.slug,
      description: storeConfig.description,
      country: storeConfig.country,
      currency: storeConfig.currency,
      contact_phone: storeConfig.contact_phone,
      contact_whatsapp: storeConfig.contact_whatsapp,
      contact_email: storeConfig.contact_email,
      subscription_tier: storeConfig.subscription_tier,
      is_verified: storeConfig.is_verified,
    });

    const storeId = storeRes.storeId as Id<"stores">;
    const products = SEED_PRODUCTS[storeConfig.slug] ?? [];
    let count = 0;

    for (const product of products) {
      const imageSeeds =
        PRODUCT_IMAGE_SEEDS[product.categorySlug as SeedCategory] ?? [10, 20];
      const storageIds: string[] = [];

      for (const seed of imageSeeds.slice(0, 3)) {
        try {
          const id = await uploadImageFromPicsum(
            () => ctx.storage.generateUploadUrl(),
            seed,
          );
          storageIds.push(id);
        } catch {
          // continue with available images
        }
      }

      if (storageIds.length === 0) continue;

      await ctx.runMutation(internal.seed.mutations.createProduct, {
        storeId,
        categorySlug: product.categorySlug,
        title: product.title,
        description: product.description,
        short_description: product.short_description,
        price: product.price,
        compare_price: product.compare_price,
        quantity: product.quantity,
        tags: [...product.tags],
        imageStorageIds: storageIds,
        color: product.color,
        material: product.material,
        weight: product.weight,
      });
      count++;
    }

    return { storeId: storeRes.storeId, productsCreated: count };
  },
});

// ─── Promouvoir un utilisateur (action publique gated) ──────────────────────

export const promoteUser = action({
  args: {
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("vendor"),
      v.literal("customer"),
      v.literal("agent"),
    ),
  },
  handler: async (ctx, args): Promise<{ userId: string; email: string; role: string }> => {
    assertSeedEnabled();
    return await ctx.runMutation(internal.seed.mutations.promoteUser, args);
  },
});

// ─── Wipe seed data ──────────────────────────────────────────────────────────

export const wipeSeedData = action({
  args: { confirm: v.literal("WIPE_SEED_DATA") },
  handler: async (ctx, args): Promise<{ users: number; stores: number; products: number }> => {
    assertSeedEnabled();
    return await ctx.runMutation(internal.seed.mutations.wipeSeedData, args);
  },
});
