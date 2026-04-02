// filepath: convex/stores/queries.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { resolveImageUrl } from "../products/helpers";
import { getVendorStore, requireVendor } from "../users/helpers";
import { getEffectiveStorageFees } from "../lib/getConfig";

// Default Pixel-Mart warehouse coordinates (Cotonou)
const DEFAULT_WAREHOUSE_LAT = 6.4105682373046875;
const DEFAULT_WAREHOUSE_LON = 2.328976631164551;

/**
 * Retourne les coordonnées GPS de l'entrepôt Pixel-Mart.
 * Lues depuis platform_config (warehouse_lat / warehouse_lon).
 * Utilise les coordonnées hardcodées de Cotonou par défaut.
 * PUBLIC — utilisé par les pages checkout.
 */
export const getWarehouseCoordinates = query({
  args: {},
  handler: async (ctx) => {
    const latRow = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", "warehouse_lat"))
      .first();
    const lonRow = await ctx.db
      .query("platform_config")
      .withIndex("by_key", (q) => q.eq("key", "warehouse_lon"))
      .first();
    return {
      lat: latRow?.value ?? DEFAULT_WAREHOUSE_LAT,
      lon: lonRow?.value ?? DEFAULT_WAREHOUSE_LON,
    };
  },
});

/**
 * Retourne les taux de commission effectifs depuis platform_config.
 * PUBLIC — utilisé à l'onboarding et sur la page Tarifs vendor.
 */
export const getPublicCommissionRates = query({
  args: {},
  handler: async (ctx) => {
    const keys = [
      "commission_free",
      "commission_pro",
      "commission_business",
    ] as const;
    const defaults: Record<string, number> = {
      commission_free: 500,
      commission_pro: 300,
      commission_business: 200,
    };
    const rows = await ctx.db.query("platform_config").collect();
    const config = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      free: (config["commission_free"] ?? defaults["commission_free"]) / 100,
      pro: (config["commission_pro"] ?? defaults["commission_pro"]) / 100,
      business:
        (config["commission_business"] ?? defaults["commission_business"]) /
        100,
    };
  },
});

/**
 * Retourne les frais de stockage effectifs depuis platform_config.
 * PUBLIC — utilisé sur la page Tarifs vendor.
 */
export const getPublicStorageFees = query({
  args: {},
  handler: async (ctx) => {
    return getEffectiveStorageFees(ctx);
  },
});

/**
 * Vérifie si la boutique a des commandes actives (non terminées, non annulées).
 * Utilisé pour bloquer la modification des paramètres de livraison.
 */
export const hasPendingOrders = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    const ACTIVE_STATUSES = [
      "pending",
      "paid",
      "processing",
      "ready_for_delivery",
      "shipped",
    ] as const;

    for (const status of ACTIVE_STATUSES) {
      const order = await ctx.db
        .query("orders")
        .withIndex("by_store", (q) => q.eq("store_id", store._id))
        .filter((q) => q.eq(q.field("status"), status))
        .first();
      if (order) return true;
    }

    return false;
  },
});

/**
 * Détail boutique par slug — vitrine publique.
 * PUBLIC — pas d'auth requise.
 * Inclut les produits actifs de la boutique.
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!store || store.status !== "active") {
      return null;
    }

    // Resolve logo
    const logoUrl = store.logo_url
      ? await resolveImageUrl(ctx, store.logo_url)
      : null;

    // Resolve banner
    const bannerUrl = store.banner_url
      ? await resolveImageUrl(ctx, store.banner_url)
      : null;

    // Count active products
    const activeProducts = await ctx.db
      .query("products")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();

    const productCount = activeProducts.filter(
      (p) => p.status === "active",
    ).length;

    return {
      _id: store._id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      logo_url: logoUrl,
      banner_url: bannerUrl,
      theme_id: store.theme_id,
      primary_color: store.primary_color,
      country: store.country,
      currency: store.currency,
      level: store.level,
      total_orders: store.total_orders,
      avg_rating: store.avg_rating,
      is_verified: store.is_verified,
      subscription_tier: store.subscription_tier,
      product_count: productCount,
      _creationTime: store._creationTime,
      // Delivery & pickup fields (needed for two-segment distance calculation)
      use_pixelmart_service: store.use_pixelmart_service,
      has_storage_plan: store.has_storage_plan,
      custom_pickup_lat: store.custom_pickup_lat,
      custom_pickup_lon: store.custom_pickup_lon,
    };
  },
});

/**
 * Découverte boutiques — liste les boutiques actives.
 * PUBLIC — pas d'auth requise.
 * Triées par rating puis nombre de commandes.
 */
export const listActive = query({
  args: {
    limit: v.optional(v.number()),
    country: v.optional(v.string()),
    verifiedOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);

    const allStores = await ctx.db
      .query("stores")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(200);

    let stores = allStores;

    // Filter by country
    if (args.country) {
      stores = stores.filter((s) => s.country === args.country);
    }

    // Filter verified only
    if (args.verifiedOnly) {
      stores = stores.filter((s) => s.is_verified);
    }

    // Sort: verified first, then by rating, then by orders
    stores.sort((a, b) => {
      if (a.is_verified !== b.is_verified) {
        return a.is_verified ? -1 : 1;
      }
      if (a.avg_rating !== b.avg_rating) {
        return b.avg_rating - a.avg_rating;
      }
      return b.total_orders - a.total_orders;
    });

    stores = stores.slice(0, limit);

    // Resolve logos
    const storesWithLogos = await Promise.all(
      stores.map(async (store) => {
        const logoUrl = store.logo_url
          ? await resolveImageUrl(ctx, store.logo_url)
          : null;

        return {
          _id: store._id,
          name: store.name,
          slug: store.slug,
          description: store.description,
          logo_url: logoUrl,
          country: store.country,
          level: store.level,
          total_orders: store.total_orders,
          avg_rating: store.avg_rating,
          is_verified: store.is_verified,
          _creationTime: store._creationTime,
        };
      }),
    );

    return storesWithLogos;
  },
});

/**
 * Récupère la boutique du vendor connecté.
 */
export const getMyStore = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);
    return store;
  },
});

export const getMarketplaceStats = query({
  args: {},
  handler: async (ctx) => {
    const allStores = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const allProducts = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Calcul total commandes (somme des total_orders de chaque store)
    const totalOrders = allStores.reduce((sum, s) => sum + s.total_orders, 0);

    // Pays uniques
    const uniqueCountries = new Set(allStores.map((s) => s.country));

    return {
      totalStores: allStores.length,
      totalProducts: allProducts.length,
      totalOrders,
      totalCountries: uniqueCountries.size,
    };
  },
});

export const getFeaturedStores = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 6;

    const stores = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Trier par avg_rating desc, puis total_orders desc
    const sorted = stores
      .sort((a, b) => {
        if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
        return b.total_orders - a.total_orders;
      })
      .slice(0, limit);

    const storesWithLogos = await Promise.all(
      sorted.map(async (store) => {
        const logoUrl = store.logo_url
          ? await resolveImageUrl(ctx, store.logo_url)
          : null;

        return {
          ...store,
          logo_url: logoUrl,
        };
      }),
    );

    return storesWithLogos;
  },
});

/**
 * Récupère la configuration de livraison pour une liste de boutiques.
 * Utilisé par le checkout multi-boutique.
 */
export const getDeliveryConfigBatch = query({
  args: {
    storeIds: v.array(v.id("stores")),
  },
  handler: async (ctx, args) => {
    const stores = await Promise.all(args.storeIds.map((id) => ctx.db.get(id)));
    return stores.reduce(
      (acc, store) => {
        if (store) {
          acc[store._id] = {
            use_pixelmart_service: store.use_pixelmart_service ?? true,
            has_storage_plan: store.has_storage_plan ?? false,
            custom_pickup_lat: store.custom_pickup_lat,
            custom_pickup_lon: store.custom_pickup_lon,
          };
        }
        return acc;
      },
      {} as Record<
        string,
        {
          use_pixelmart_service: boolean;
          has_storage_plan: boolean;
          custom_pickup_lat?: number;
          custom_pickup_lon?: number;
        }
      >,
    );
  },
});

/**
 * Liste toutes les boutiques appartenant au vendor connecté.
 */
export const listMyStores = query({
  args: {},
  handler: async (ctx) => {
    const { user, store: activeStore } = await getVendorStore(ctx);

    const stores = await ctx.db
      .query("stores")
      .withIndex("by_owner", (q) => q.eq("owner_id", user._id))
      .collect();

    const storesWithLogos = await Promise.all(
      stores.map(async (s) => {
        const logoUrl = s.logo_url
          ? await resolveImageUrl(ctx, s.logo_url)
          : null;
        return {
          _id: s._id,
          name: s.name,
          slug: s.slug,
          logo_url: logoUrl,
          status: s.status,
          subscription_tier: s.subscription_tier,
          isActive: s._id === activeStore._id,
        };
      }),
    );

    return storesWithLogos;
  },
});

// ─── getOnboardingProgress ────────────────────────────────────

/**
 * Retourne l'état d'avancement de la configuration initiale de la boutique.
 * Dérivé uniquement des champs existants — aucun champ supplémentaire en DB.
 */
export const getOnboardingProgress = query({
  args: {},
  handler: async (ctx) => {
    const { store } = await getVendorStore(ctx);

    const products = await ctx.db
      .query("products")
      .withIndex("by_store", (q) => q.eq("store_id", store._id))
      .collect();
    const hasProducts = products.some((p) => p.status === "active");

    const steps: Array<{
      id: string;
      label: string;
      description: string;
      done: boolean;
      route: string | null;
      cta: string | null;
    }> = [
      {
        id: "store_created",
        label: "Créer votre boutique",
        description:
          "Votre boutique Pixel-Mart est en ligne et prête à recevoir des commandes.",
        done: true,
        route: null,
        cta: null,
      },
      {
        id: "logo",
        label: "Ajouter un logo",
        description:
          "Un logo renforce la confiance des acheteurs et donne une identité à votre boutique.",
        done: store.logo_url !== undefined && store.logo_url !== null,
        route: "/vendor/settings",
        cta: "Ajouter un logo",
      },
      {
        id: "delivery",
        label: "Configurer les services de livraison",
        description:
          "Choisissez si Pixel-Mart gère votre stock et livraisons, ou si vous utilisez votre propre logistique.",
        done:
          store.has_storage_plan !== undefined &&
          store.has_storage_plan !== null,
        route: "/vendor/settings",
        cta: "Configurer maintenant",
      },
      {
        id: "first_product",
        label: "Mettre en ligne votre premier produit",
        description:
          "Ajoutez des produits à votre catalogue pour commencer à vendre.",
        done: hasProducts,
        route: "/vendor/products/new",
        cta: "Ajouter un produit",
      },
      {
        id: "contact",
        label: "Renseigner vos informations de contact",
        description:
          "Téléphone, WhatsApp, email — facilitez la prise de contact avec vos clients.",
        done: !!(
          store.contact_phone ??
          store.contact_whatsapp ??
          store.contact_email
        ),
        route: "/vendor/settings",
        cta: "Compléter le profil",
      },
      {
        id: "theme",
        label: "Personnaliser l'apparence de votre vitrine",
        description:
          "Choisissez un thème et une couleur pour donner une identité visuelle unique à votre boutique.",
        done:
          store.theme_id !== "default" ||
          (store.primary_color !== undefined && store.primary_color !== null),
        route: "/vendor/store/theme",
        cta: "Personnaliser",
      },
    ];

    const completedCount = steps.filter((s) => s.done).length;
    const totalCount = steps.length;

    return {
      storeId: store._id,
      steps,
      completedCount,
      totalCount,
      percentage: Math.round((completedCount / totalCount) * 100),
      isComplete: completedCount === totalCount,
    };
  },
});

// ─── getVendorLeaderboard ─────────────────────────────────────

/**
 * Classement des vendeurs par CA (chiffre d'affaires).
 * Accessible à tous les vendeurs authentifiés.
 * Expose seulement les champs publics (pas de balance ni de données financières privées).
 */
export const getVendorLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    await requireVendor(ctx);

    const allOrders = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("payment_status"), "paid"))
      .collect();

    const storeRevenue: Record<string, number> = {};
    const storeOrders: Record<string, number> = {};
    for (const order of allOrders) {
      const sid = order.store_id as string;
      storeRevenue[sid] = (storeRevenue[sid] ?? 0) + order.total_amount;
      storeOrders[sid] = (storeOrders[sid] ?? 0) + 1;
    }

    const allStores = await ctx.db
      .query("stores")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const ranked = allStores
      .map((s) => ({
        _id: s._id,
        name: s.name,
        slug: s.slug,
        subscription_tier: s.subscription_tier,
        is_verified: s.is_verified,
        avg_rating: s.avg_rating ?? 0,
        revenue: storeRevenue[s._id as string] ?? 0,
        order_count: storeOrders[s._id as string] ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return ranked;
  },
});
