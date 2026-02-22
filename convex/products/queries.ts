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

/**
 * Détail produit par slug — page produit.
 * PUBLIC — pas d'auth requise.
 * Inclut les variantes et les infos boutique.
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!product || product.status === "archived") {
      return null;
    }

    // Resolve images
    const imageUrls = await resolveImageUrls(ctx, product.images);

    // Fetch variants
    const variants = await ctx.db
      .query("product_variants")
      .withIndex("by_product", (q) => q.eq("product_id", product._id))
      .collect();

    const variantsWithImages = await Promise.all(
      variants
        .filter((v) => v.is_available)
        .map(async (variant) => {
          const variantImage = variant.image_url
            ? await ctx.storage
                .getUrl(
                  variant.image_url as unknown as import("../_generated/dataModel").Id<"_storage">,
                )
                .catch(() => null)
            : null;

          return {
            _id: variant._id,
            title: variant.title,
            options: variant.options,
            price: variant.price,
            compare_price: variant.compare_price,
            sku: variant.sku,
            quantity: variant.quantity,
            image_url: variantImage,
            weight: variant.weight,
          };
        }),
    );

    // Fetch store info (minimal, for display)
    const store = await ctx.db.get(product.store_id);

    // Fetch category
    const category = await ctx.db.get(product.category_id);

    return {
      ...product,
      images: imageUrls,
      variants: variantsWithImages,
      store: store
        ? {
            _id: store._id,
            name: store.name,
            slug: store.slug,
            logo_url: store.logo_url,
            is_verified: store.is_verified,
            avg_rating: store.avg_rating,
            country: store.country,
          }
        : null,
      category: category
        ? {
            _id: category._id,
            name: category.name,
            slug: category.slug,
          }
        : null,
    };
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

/**
 * Recherche full-text produits avec filtres.
 * PUBLIC — pas d'auth requise.
 *
 * Filtres : catégorie, prix min/max, en stock uniquement.
 * Tri post-search : newest, price_asc, price_desc (relevance par défaut).
 */
export const search = query({
  args: {
    query: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    storeId: v.optional(v.id("stores")),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    inStock: v.optional(v.boolean()),
    sort: v.optional(
      v.union(
        v.literal("relevance"),
        v.literal("newest"),
        v.literal("price_asc"),
        v.literal("price_desc"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);
    const sort = args.sort ?? "relevance";

    let products;

    // --- Full-text search path ---
    if (args.query && args.query.trim().length > 0) {
      const searchQuery = ctx.db
        .query("products")
        .withSearchIndex("search_title", (q) => {
          let search = q.search("title", args.query!);

          // Filtres sur le search index (equality only)
          search = search.eq("status", "active");
          if (args.categoryId) {
            search = search.eq("category_id", args.categoryId);
          }
          if (args.storeId) {
            search = search.eq("store_id", args.storeId);
          }

          return search;
        });

      // Search retourne max 1024 résultats, on prend large pour filtrer ensuite
      products = await searchQuery.take(256);
    }
    // --- Browse path (no search query) ---
    else {
      const browseQuery = ctx.db
        .query("products")
        .withIndex("by_category", (q) =>
          args.categoryId ? q.eq("category_id", args.categoryId) : q,
        );

      const allProducts = await browseQuery.take(500);
      products = allProducts.filter((p) => p.status === "active");

      if (args.storeId) {
        products = products.filter((p) => p.store_id === args.storeId);
      }
    }

    // --- Post-search filters (price, stock) ---
    if (args.minPrice !== undefined) {
      products = products.filter((p) => p.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= args.maxPrice!);
    }
    if (args.inStock) {
      products = products.filter(
        (p) => p.status !== "out_of_stock" && p.quantity > 0,
      );
    }

    // --- Sorting ---
    if (sort === "newest") {
      products.sort(
        (a, b) =>
          (b.published_at ?? b._creationTime) -
          (a.published_at ?? a._creationTime),
      );
    } else if (sort === "price_asc") {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      products.sort((a, b) => b.price - a.price);
    }
    // "relevance" = search engine order, no re-sort needed

    // --- Limit ---
    products = products.slice(0, limit);

    // --- Resolve image URLs ---
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const imageUrls = await resolveImageUrls(ctx, product.images);
        return {
          _id: product._id,
          title: product.title,
          slug: product.slug,
          short_description: product.short_description,
          price: product.price,
          compare_price: product.compare_price,
          images: imageUrls,
          store_id: product.store_id,
          category_id: product.category_id,
          quantity: product.quantity,
          status: product.status,
          tags: product.tags,
          is_digital: product.is_digital,
          published_at: product.published_at,
          _creationTime: product._creationTime,
        };
      }),
    );

    return productsWithImages;
  },
});

/**
 * 20 derniers produits actifs — pour la homepage.
 * PUBLIC — pas d'auth requise.
 */
export const listLatest = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);

    // Récupérer les produits actifs, ordonnés par création (desc par défaut dans Convex)
    const allProducts = await ctx.db.query("products").order("desc").take(200);

    const activeProducts = allProducts
      .filter((p) => p.status === "active")
      .slice(0, limit);

    const productsWithImages = await Promise.all(
      activeProducts.map(async (product) => {
        const imageUrls = await resolveImageUrls(ctx, product.images);
        return {
          _id: product._id,
          title: product.title,
          slug: product.slug,
          short_description: product.short_description,
          price: product.price,
          compare_price: product.compare_price,
          images: imageUrls,
          store_id: product.store_id,
          category_id: product.category_id,
          quantity: product.quantity,
          tags: product.tags,
          is_digital: product.is_digital,
          published_at: product.published_at,
          _creationTime: product._creationTime,
        };
      }),
    );

    return productsWithImages;
  },
});
