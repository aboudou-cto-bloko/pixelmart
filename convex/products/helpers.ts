import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

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
