import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

/**
 * Résout un tableau de storageIds en URLs publiques.
 * Filtre les URLs null (fichier supprimé du storage).
 */
export async function resolveImageUrls(
  ctx: Ctx,
  storageIds: string[],
): Promise<string[]> {
  const urls = await Promise.all(
    storageIds.map(async (id) => {
      try {
        return await ctx.storage.getUrl(id as Id<"_storage">);
      } catch (_e) {
        return null;
      }
    }),
  );
  return urls.filter((url): url is string => url !== null);
}

/**
 * Cast un storageId string vers Id<"_storage">.
 * À utiliser pour tous les appels ctx.storage.getUrl / delete.
 */
export function toStorageId(id: string): Id<"_storage"> {
  return id as Id<"_storage">;
}

/**
 * Résout un seul storageId optionnel en URL publique.
 * Retourne null si l'id est undefined ou le fichier n'existe plus.
 */
export async function resolveImageUrl(
  ctx: Ctx,
  storageId: string | undefined,
): Promise<string | null> {
  if (!storageId) return null;
  try {
    return await ctx.storage.getUrl(toStorageId(storageId));
  } catch (_e) {
    return null;
  }
}

/**
 * Supprime un fichier du storage de manière safe.
 * Ne throw pas si le fichier n'existe plus.
 */
export async function safeDeleteFile(
  ctx: MutationCtx,
  storageId: string | undefined,
): Promise<void> {
  if (!storageId) return;
  try {
    await ctx.storage.delete(toStorageId(storageId));
  } catch (_e) {
    // Fichier déjà supprimé — ignorer silencieusement
  }
}

/**
 * Génère un slug à partir d'un titre, avec gestion collision.
 */
export async function generateProductSlug(
  ctx: Ctx,
  title: string,
  excludeId?: Id<"products">,
): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let slug = baseSlug;
  let counter = 0;

  while (true) {
    const existing = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!existing || (excludeId && existing._id === excludeId)) break;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

/**
 * Server-side HTML sanitization to prevent XSS attacks.
 * Basic implementation that strips dangerous tags and attributes.
 */
export function sanitizeHTML(html: string): string {
  if (!html) return "";

  // Remove script tags and their content
  let sanitized = html.replace(/<script[^>]*>.*?<\/script>/gi, "");

  // Remove dangerous event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Allow only safe HTML tags
  const allowedTags = [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "ul",
    "ol",
    "li",
    "h3",
    "h4",
    "h5",
    "h6",
  ];

  // Remove any tag not in the allowed list (basic implementation)
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
  sanitized = sanitized.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // Remove dangerous attributes but keep the tag
      return match.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
    }
    return ""; // Remove disallowed tags completely
  });

  return sanitized.trim();
}

/**
 * Validates product data for security and business rules.
 */
export function validateProductData(data: {
  title: string;
  description: string;
  short_description?: string;
  tags: string[];
  price: number;
  compare_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  images: string[];
}): {
  title: string;
  description: string;
  short_description?: string;
  tags: string[];
  price: number;
  compare_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  images: string[];
} {
  // Length validations
  if (data.title.length < 2 || data.title.length > 200) {
    throw new Error("Le titre doit contenir entre 2 et 200 caractères");
  }

  if (data.description.length < 10 || data.description.length > 10000) {
    throw new Error(
      "La description doit contenir entre 10 et 10 000 caractères",
    );
  }

  if (data.short_description && data.short_description.length > 160) {
    throw new Error(
      "La description courte ne peut pas dépasser 160 caractères",
    );
  }

  // Business rule validations
  if (data.price <= 0 || data.price > 10000000) {
    throw new Error("Le prix doit être entre 1 et 10 000 000 centimes");
  }

  if (data.compare_price && data.compare_price <= data.price) {
    throw new Error("Le prix barré doit être supérieur au prix de vente");
  }

  if (data.cost_price && data.cost_price > data.price) {
    throw new Error(
      "Le prix d'achat ne peut pas être supérieur au prix de vente",
    );
  }

  if (data.images.length === 0) {
    throw new Error("Au moins une image est requise");
  }

  if (data.images.length > 10) {
    throw new Error("Maximum 10 images par produit");
  }

  // Validate and sanitize tags
  const validTags = data.tags
    .filter((tag) => tag && tag.length <= 50)
    .filter((tag) => /^[a-zA-Z0-9\s\-_]+$/.test(tag))
    .slice(0, 10);

  // Format validations
  if (
    data.sku &&
    (data.sku.length > 100 || !/^[A-Za-z0-9\-_]*$/.test(data.sku))
  ) {
    throw new Error("SKU invalide");
  }

  if (
    data.barcode &&
    (data.barcode.length > 50 || !/^[0-9]*$/.test(data.barcode))
  ) {
    throw new Error("Code-barres invalide");
  }

  // Security validations - check for dangerous content
  const dangerousChars = /[<>"'&]/;
  if (dangerousChars.test(data.title)) {
    throw new Error("Le titre contient des caractères non autorisés");
  }

  if (data.seo_title && dangerousChars.test(data.seo_title)) {
    throw new Error("Le titre SEO contient des caractères non autorisés");
  }

  if (data.seo_description && dangerousChars.test(data.seo_description)) {
    throw new Error(
      "La meta description contient des caractères non autorisés",
    );
  }

  if (data.seo_keywords && dangerousChars.test(data.seo_keywords)) {
    throw new Error(
      "Les mots-clés SEO contiennent des caractères non autorisés",
    );
  }

  return {
    ...data,
    title: data.title.trim(),
    description: sanitizeHTML(data.description),
    short_description: data.short_description
      ? sanitizeHTML(data.short_description)
      : undefined,
    tags: validTags,
    sku: data.sku?.trim(),
    barcode: data.barcode?.trim(),
    seo_title: data.seo_title?.trim(),
    seo_description: data.seo_description?.trim(),
    seo_keywords: data.seo_keywords?.trim(),
  };
}
