import { query } from "../_generated/server";
import { v } from "convex/values";
import { resolveImageUrls, resolveImageUrl } from "./helpers";
import { getVendorStore } from "../users/helpers";

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;

    const imageUrls = await resolveImageUrls(ctx, product.images);
    return { ...product, imageUrls };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!product || product.status !== "active") return null;

    const imageUrls = await resolveImageUrls(ctx, product.images);
    return { ...product, imageUrls };
  },
});

export const listByStore = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("archived"),
        v.literal("out_of_stock"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const productsQuery = args.status
      ? ctx.db
          .query("products")
          .withIndex("by_status", (q) =>
            q.eq("store_id", store._id).eq("status", args.status!),
          )
      : ctx.db
          .query("products")
          .withIndex("by_store", (q) => q.eq("store_id", store._id));

    const products = await productsQuery.collect();

    return Promise.all(
      products.map(async (product) => {
        const thumbnailUrl = await resolveImageUrl(ctx, product.images[0]);
        return { ...product, thumbnailUrl };
      }),
    );
  },
});

export const listByCategory = query({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category_id", args.categoryId))
      .collect();

    const activeProducts = products.filter((p) => p.status === "active");

    return Promise.all(
      activeProducts.map(async (product) => {
        const thumbnailUrl = await resolveImageUrl(ctx, product.images[0]);
        return { ...product, thumbnailUrl };
      }),
    );
  },
});

export const listActiveByStore = query({
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_status", (q) =>
        q.eq("store_id", args.storeId).eq("status", "active"),
      )
      .collect();

    return Promise.all(
      products.map(async (product) => {
        const thumbnailUrl = await resolveImageUrl(ctx, product.images[0]);
        return { ...product, thumbnailUrl };
      }),
    );
  },
});
