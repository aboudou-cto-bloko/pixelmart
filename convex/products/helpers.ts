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
      } catch {
        return null;
      }
    }),
  );
  return urls.filter((url): url is string => url !== null);
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
    .replace(/[\u0300-\u036f]/g, "") // retirer accents
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
