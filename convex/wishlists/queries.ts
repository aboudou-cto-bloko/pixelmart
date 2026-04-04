// filepath: convex/wishlists/queries.ts

import { query } from "../_generated/server";
import { getAppUser } from "../users/helpers";
import { resolveImageUrl } from "../products/helpers";

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAppUser(ctx);
    if (!user) return [];

    const entries = await ctx.db
      .query("wishlists")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    return entries.map((e) => e.product_id as string);
  },
});

export const listProductsByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAppUser(ctx);
    if (!user) return [];

    const entries = await ctx.db
      .query("wishlists")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .order("desc")
      .collect();

    const products = await Promise.all(
      entries.map(async (entry) => {
        const product = await ctx.db.get(entry.product_id);
        if (!product || product.status !== "active") return null;

        const imageUrl = await resolveImageUrl(ctx, product.images[0]);
        const store = product.store_id
          ? await ctx.db.get(product.store_id)
          : null;

        return {
          _id: product._id as string,
          title: product.title,
          slug: product.slug,
          price: product.price,
          compare_price: product.compare_price,
          images: imageUrl ? [imageUrl] : [],
          is_digital: product.is_digital,
          quantity: product.quantity,
          store_name: store?.name ?? null,
          store_id: product.store_id as string,
          store_slug: store?.slug ?? null,
        };
      }),
    );

    return products.filter(<T>(p: T | null): p is T => p !== null);
  },
});
