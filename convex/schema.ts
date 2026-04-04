// filepath: convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // USERS (app-level — synced from Better Auth via triggers)
  // ============================================
  users: defineTable({
    // ---- Link to Better Auth ----
    better_auth_user_id: v.optional(v.string()), // optional for provisional guest users

    // ---- Denormalized from Better Auth (synced via triggers) ----
    email: v.string(),
    name: v.string(),
    avatar_url: v.optional(v.string()),

    // ---- Pixel-Mart business fields (NOT in Better Auth) ----
    phone: v.optional(v.string()), // E.164 format: +22961234567

    role: v.union(
      v.literal("admin"), // Super Admin — accès total
      v.literal("finance"), // Responsable Financier — retraits, revenus, stockage facturation
      v.literal("logistics"), // Gestionnaire Livraisons — tarifs, pays, stockage réception
      v.literal("developer"), // Développeur — lecture audit & config
      v.literal("marketing"), // Gestionnaire Contenu — catégories, publicités
      v.literal("vendor"),
      v.literal("customer"),
      v.literal("agent"), // Agent entrepôt — réception & saisie physique
    ),

    // Security (app-level, not managed by Better Auth)
    is_2fa_enabled: v.boolean(),
    totp_secret: v.optional(v.string()), // encrypted AES-256

    // Status
    is_verified: v.boolean(),
    is_banned: v.boolean(),
    last_login_at: v.optional(v.number()),

    // Preferences
    locale: v.union(v.literal("fr"), v.literal("en")),

    // Multi-store: boutique active dans le dashboard vendeur
    active_store_id: v.optional(v.id("stores")),

    // Notifications
    push_notifications_enabled: v.optional(v.boolean()), // default: true

    // Guest account setup (provisional users created at guest checkout)
    guest_setup_token: v.optional(v.string()),
    guest_setup_expires_at: v.optional(v.number()),

    // Metadata
    updated_at: v.number(),
  })
    .index("by_better_auth_id", ["better_auth_user_id"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // ============================================
  // STORES
  // ============================================
  stores: defineTable({
    // Ownership
    owner_id: v.id("users"),

    // Identity
    name: v.string(),
    slug: v.string(), // unique, URL-safe
    description: v.optional(v.string()),
    logo_url: v.optional(v.string()),
    banner_url: v.optional(v.string()),

    // Appearance
    theme_id: v.string(), // "default" | "modern" | "classic" | "royal" | "nature"
    primary_color: v.optional(v.string()), // hex: #FF5722
    theme_mode: v.optional(v.union(v.literal("light"), v.literal("dark"))), // default: "light"

    // Status
    status: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("pending"),
      v.literal("closed"),
    ),

    // Subscription & Billing
    subscription_tier: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("business"),
    ),
    subscription_ends_at: v.optional(v.number()),
    commission_rate: v.number(), // basis points: 200 | 300 | 500

    // Financial
    balance: v.number(), // centimes, available for withdrawal
    pending_balance: v.number(), // centimes, awaiting release (48h rule)
    currency: v.string(), // default: XOF

    // Reputation
    level: v.union(
      v.literal("bronze"),
      v.literal("silver"),
      v.literal("gold"),
      v.literal("platinum"),
    ),
    total_orders: v.number(),
    avg_rating: v.number(), // 0.0 - 5.0
    is_verified: v.boolean(),

    // Location
    country: v.string(), // ISO 3166-1 alpha-2: BJ, SN, CI

    // Meta Pixel & Vendor Shop
    meta_pixel_id: v.optional(v.string()), // ID Pixel Meta (15-16 chiffres)
    meta_access_token: v.optional(v.string()), // Token Conversions API (secret)
    meta_test_event_code: v.optional(v.string()), // Code test event Meta
    vendor_shop_enabled: v.optional(v.boolean()), // true = /shop/[slug] actif

    // Delivery & Pickup
    use_pixelmart_service: v.optional(v.boolean()), // default true — uses Pixel-Mart warehouse
    custom_pickup_lat: v.optional(v.number()),
    custom_pickup_lon: v.optional(v.number()),
    custom_pickup_label: v.optional(v.string()), // human-readable address
    has_storage_plan: v.optional(v.boolean()), // true = mode A (Pixel-Mart stores goods at default warehouse)

    // Contact info
    contact_phone: v.optional(v.string()), // E.164: +22961234567
    contact_whatsapp: v.optional(v.string()), // E.164 (peut différer du téléphone)
    contact_email: v.optional(v.string()),
    contact_website: v.optional(v.string()),
    contact_facebook: v.optional(v.string()), // URL complète ou handle
    contact_instagram: v.optional(v.string()), // URL complète ou handle

    // Metadata
    updated_at: v.number(),
  })
    .index("by_owner", ["owner_id"])
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_subscription", ["subscription_tier"]),

  // ============================================
  // CATEGORIES
  // ============================================
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    parent_id: v.optional(v.id("categories")), // null = root, max 2 levels
    icon_url: v.optional(v.string()),
    sort_order: v.number(),
    is_active: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_parent", ["parent_id"])
    .index("by_sort", ["sort_order"]),

  // ============================================
  // PRODUCTS
  // ============================================
  products: defineTable({
    // Ownership
    store_id: v.id("stores"),

    // Content
    title: v.string(),
    slug: v.string(), // unique per store
    description: v.string(), // HTML sanitized via DOMPurify
    short_description: v.optional(v.string()),

    // Classification
    category_id: v.id("categories"),
    tags: v.array(v.string()),

    // Media
    images: v.array(v.string()), // Convex storage URLs, min 1
    image_roles: v.optional(v.array(v.string())), // parallel array: "main"|"usage"|"zoom"|"detail"|"lifestyle"

    // Pricing (all in centimes)
    price: v.number(),
    compare_price: v.optional(v.number()), // barré, must be > price
    cost_price: v.optional(v.number()), // for margin calculation

    // Identifiers
    sku: v.optional(v.string()),
    barcode: v.optional(v.string()),

    // Inventory
    track_inventory: v.boolean(),
    quantity: v.number(),
    warehouse_qty: v.optional(v.number()), // unités actuellement stockées en entrepôt Pixel-Mart
    low_stock_threshold: v.number(), // default: 5

    // Rating
    avg_rating: v.optional(v.number()), // 0.0 - 5.0
    review_count: v.optional(v.number()), // total avis publiés

    // Physical
    weight: v.optional(v.number()), // grams
    color: v.optional(v.string()),
    material: v.optional(v.string()),
    dimensions: v.optional(v.string()), // L x W x H in cm

    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("archived"),
      v.literal("out_of_stock"),
    ),

    // Digital products
    is_digital: v.boolean(),
    digital_file_url: v.optional(v.string()),

    // SEO
    seo_title: v.optional(v.string()),
    seo_description: v.optional(v.string()),
    seo_keywords: v.optional(v.string()), // comma-separated, backend only

    // Timestamps
    published_at: v.optional(v.number()),
    updated_at: v.number(),
  })
    .index("by_store", ["store_id"])
    .index("by_slug", ["slug"])
    .index("by_category", ["category_id"])
    .index("by_status", ["store_id", "status"])
    .index("by_store_active", ["store_id", "status", "published_at"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["store_id", "category_id", "status"],
    }),

  // ============================================
  // PRODUCT VARIANTS
  // ============================================
  product_variants: defineTable({
    product_id: v.id("products"),
    store_id: v.id("stores"), // denormalized for fast queries

    // Variant info
    title: v.string(), // e.g. "Rouge / XL"
    options: v.array(
      v.object({
        name: v.string(), // e.g. "Couleur"
        value: v.string(), // e.g. "Rouge"
      }),
    ),

    // Pricing (override product price if set)
    price: v.optional(v.number()), // centimes
    compare_price: v.optional(v.number()),

    // Identifiers
    sku: v.optional(v.string()),

    // Inventory
    quantity: v.number(),

    // Media
    image_url: v.optional(v.string()),

    // Physical
    weight: v.optional(v.number()), // grams

    // Status
    is_available: v.boolean(),
  })
    .index("by_product", ["product_id"])
    .index("by_store", ["store_id"]),

  // ============================================
  // PRODUCT SPECS (custom key-value pairs)
  // ============================================
  product_specs: defineTable({
    product_id: v.id("products"),
    store_id: v.id("stores"), // denormalized for fast queries

    // Spec info
    spec_key: v.string(), // e.g. "Matériau", "Garantie"
    spec_value: v.string(), // e.g. "Coton", "2 ans"

    // Order
    display_order: v.number(), // for sorting
  })
    .index("by_product", ["product_id"])
    .index("by_store", ["store_id"]),

  // ============================================
  // ORDERS
  // ============================================
  orders: defineTable({
    // Identifiers
    order_number: v.string(), // PM-2026-0001 (unique, sequential per year)

    // Parties
    customer_id: v.id("users"),
    store_id: v.id("stores"),

    // Items (embedded — snapshot at time of order)
    items: v.array(
      v.object({
        product_id: v.id("products"),
        variant_id: v.optional(v.id("product_variants")),
        variant_title: v.optional(v.string()),
        title: v.string(),
        sku: v.optional(v.string()),
        image_url: v.string(),
        quantity: v.number(),
        unit_price: v.number(), // centimes
        total_price: v.number(), // centimes
        storage_code: v.optional(v.string()), // ex: "PM-102" si produit stocké en entrepôt Pixel-Mart
      }),
    ),

    // Totals (all in centimes)
    subtotal: v.number(),
    shipping_amount: v.number(),
    discount_amount: v.number(),
    total_amount: v.number(),
    currency: v.string(), // default: XOF

    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded"),
      v.literal("ready_for_delivery"),
      v.literal("delivery_failed"),
    ),

    // Payment
    payment_status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    payment_method: v.optional(v.string()), // stripe_card | moneroo_mtn | moneroo_orange | ...
    payment_reference: v.optional(v.string()), // Stripe/Moneroo payment ID

    // Shipping
    shipping_address: v.object({
      full_name: v.string(),
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      state: v.optional(v.string()),
      postal_code: v.optional(v.string()),
      country: v.string(), // ISO alpha-2
      phone: v.optional(v.string()),
    }),
    billing_address: v.optional(
      v.object({
        full_name: v.string(),
        line1: v.string(),
        line2: v.optional(v.string()),
        city: v.string(),
        state: v.optional(v.string()),
        postal_code: v.optional(v.string()),
        country: v.string(),
        phone: v.optional(v.string()),
      }),
    ),

    // Delivery tracking
    tracking_number: v.optional(v.string()),
    carrier: v.optional(v.string()), // DHL | FedEx | local | pixel_mart
    estimated_delivery: v.optional(v.number()),
    delivered_at: v.optional(v.number()),

    // Extras
    notes: v.optional(v.string()), // customer note
    coupon_code: v.optional(v.string()),
    commission_amount: v.optional(v.number()), // centimes — Pixel-Mart fee
    delivery_lat: v.optional(v.number()), // latitude client
    delivery_lon: v.optional(v.number()), // longitude client
    delivery_distance_km: v.optional(v.number()), // distance calculée (hub→client ou distance unique)
    delivery_distance_vendor_to_hub_km: v.optional(v.number()), // segment 1 : vendeur → entrepôt PM (scénario collecte)
    delivery_distance_hub_to_client_km: v.optional(v.number()), // segment 2 : entrepôt PM → client (scénario collecte)
    delivery_type: v.optional(
      v.union(v.literal("standard"), v.literal("urgent"), v.literal("fragile")),
    ),
    payment_mode: v.optional(v.union(v.literal("online"), v.literal("cod"))),
    delivery_fee: v.optional(v.number()),
    estimated_weight_kg: v.optional(v.number()),
    batch_id: v.optional(v.id("delivery_batches")),
    ready_for_delivery: v.optional(v.boolean()),
    ready_at: v.optional(v.number()),

    // Source tracking
    source: v.optional(
      v.union(v.literal("marketplace"), v.literal("vendor_shop")),
    ), // Origine : marketplace Pixel-Mart ou boutique vendeur (/shop/slug)

    // Metadata
    updated_at: v.number(),
  })
    .index("by_customer", ["customer_id"])
    .index("by_store", ["store_id"])
    .index("by_status", ["store_id", "status"])
    .index("by_order_number", ["order_number"])
    .index("by_payment_status", ["payment_status"])
    .index("by_batch", ["batch_id"])
    .index("by_ready_for_delivery", ["store_id", "ready_for_delivery"])
    .index("by_source", ["store_id", "source"]),

  // ============================================
  // ORDER EVENTS (IMMUTABLE TIMELINE)
  // ============================================
  order_events: defineTable({
    order_id: v.id("orders"),
    store_id: v.id("stores"),
    type: v.union(
      v.literal("created"),
      v.literal("paid"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded"),
      v.literal("tracking_updated"),
      v.literal("note"),
    ),
    description: v.string(),
    actor_type: v.union(
      v.literal("system"),
      v.literal("customer"),
      v.literal("vendor"),
      v.literal("admin"),
    ),
    actor_id: v.optional(v.id("users")),
    metadata: v.optional(v.string()), // JSON stringified extra data
  })
    .index("by_order", ["order_id"])
    .index("by_store", ["store_id"]),

  // ============================================
  // TRANSACTIONS (IMMUTABLE FINANCIAL LEDGER)
  // ============================================
  // Rule: NEVER update a transaction. Create a reversal instead.
  // Rule F-01: Every balance change MUST create a transaction in the same mutation.
  transactions: defineTable({
    store_id: v.id("stores"),
    order_id: v.optional(v.id("orders")),

    // Type & Direction
    type: v.union(
      v.literal("sale"),
      v.literal("refund"),
      v.literal("payout"),
      v.literal("fee"),
      v.literal("credit"),
      v.literal("transfer"),
      v.literal("ad_payment"),
      v.literal("subscription"),
    ),
    direction: v.union(v.literal("credit"), v.literal("debit")),

    // Amount
    amount: v.number(), // centimes, always positive
    currency: v.string(), // default: XOF

    // Balance snapshot
    balance_before: v.number(),
    balance_after: v.number(),

    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("reversed"),
    ),

    // External reference
    reference: v.optional(v.string()), // Stripe ID, Moneroo ID, etc.

    // Details
    description: v.string(),
    metadata: v.optional(v.any()),
    processed_at: v.optional(v.number()),
  })
    .index("by_store", ["store_id"])
    .index("by_type", ["store_id", "type"])
    .index("by_order", ["order_id"]),

  // ============================================
  // REVIEWS
  // ============================================
  reviews: defineTable({
    product_id: v.id("products"),
    order_id: v.id("orders"), // must have purchased to review
    customer_id: v.id("users"),
    store_id: v.id("stores"), // denormalized

    // Content
    rating: v.number(), // 1-5
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    images: v.array(v.string()),

    // Status
    is_verified: v.boolean(), // confirmed purchase
    is_published: v.boolean(),
    flagged: v.boolean(),

    // Vendor response
    vendor_reply: v.optional(v.string()),
    replied_at: v.optional(v.number()),
  })
    .index("by_product", ["product_id"])
    .index("by_store", ["store_id"])
    .index("by_customer", ["customer_id"]),

  // ============================================
  // PRODUCT Q&A
  // ============================================
  product_questions: defineTable({
    product_id: v.id("products"),
    store_id: v.id("stores"), // denormalized

    // Author (customer or vendor)
    author_id: v.id("users"),
    source: v.union(v.literal("customer"), v.literal("vendor")),

    // Question
    body: v.string(), // max 500 chars

    // Status
    is_published: v.boolean(), // default true

    // Vendor answer
    vendor_answer: v.optional(v.string()), // max 1000 chars
    answered_at: v.optional(v.number()),
  })
    .index("by_product", ["product_id"])
    .index("by_store", ["store_id"])
    .index("by_author", ["author_id"]),

  // ============================================
  // COUPONS
  // ============================================
  coupons: defineTable({
    store_id: v.id("stores"),

    // Code
    code: v.string(), // uppercase: PROMO10

    // Type & Value
    type: v.union(
      v.literal("percentage"),
      v.literal("fixed_amount"),
      v.literal("free_shipping"),
    ),
    value: v.number(), // % or centimes depending on type

    // Constraints
    min_order_amount: v.optional(v.number()), // centimes
    max_uses: v.optional(v.number()),
    max_uses_per_user: v.number(),
    used_count: v.number(),

    // Scope
    applicable_to: v.union(
      v.literal("all"),
      v.literal("specific_products"),
      v.literal("specific_categories"),
    ),
    product_ids: v.optional(v.array(v.id("products"))),
    category_ids: v.optional(v.array(v.id("categories"))),

    // Validity
    starts_at: v.optional(v.number()),
    expires_at: v.optional(v.number()),
    is_active: v.boolean(),
  })
    .index("by_store", ["store_id"])
    .index("by_code", ["store_id", "code"]),

  // ============================================
  // MESSAGES
  // ============================================
  messages: defineTable({
    thread_id: v.string(), // grouping key: `${store_id}_${customer_id}`
    sender_id: v.id("users"),
    receiver_id: v.id("users"),
    order_id: v.optional(v.id("orders")),
    store_id: v.optional(v.id("stores")),

    // Content
    content: v.string(),
    attachments: v.array(v.string()), // storage URLs

    // Status
    is_read: v.boolean(),
    read_at: v.optional(v.number()),
    is_auto: v.boolean(), // system-generated messages
  })
    .index("by_thread", ["thread_id"])
    .index("by_receiver", ["receiver_id", "is_read"]),

  // ============================================
  // NOTIFICATIONS
  // ============================================
  notifications: defineTable({
    user_id: v.id("users"),

    // Content
    type: v.string(), // order_new | order_status | low_stock | payment | review | system | promo
    title: v.string(),
    body: v.string(),
    link: v.optional(v.string()), // in-app deep link

    // Status
    is_read: v.boolean(),

    // Channels
    channels: v.array(v.string()), // push | email | sms | whatsapp
    sent_via: v.array(v.string()), // which channels were actually sent

    // Extra
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["user_id"])
    .index("by_user_unread", ["user_id", "is_read"]),

  // ============================================
  // PAYOUTS
  // ============================================
  payouts: defineTable({
    store_id: v.id("stores"),

    // Amount
    amount: v.number(), // centimes, minimum 100 (= 1 XOF / 0.01 EUR)
    currency: v.string(), // XOF
    fee: v.number(), // provider fee deducted

    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),

    // Payout method
    payout_method: v.union(
      v.literal("bank_transfer"),
      v.literal("mobile_money"),
      v.literal("paypal"),
    ),
    payout_details: v.object({
      provider: v.string(), // moneroo | stripe
      account_name: v.optional(v.string()),
      account_number: v.optional(v.string()), // masked
      bank_code: v.optional(v.string()),
      phone_number: v.optional(v.string()), // for mobile money
    }),

    // External reference
    reference: v.optional(v.string()), // Moneroo payout ID

    // Security
    requires_2fa: v.boolean(),
    verified_2fa: v.boolean(),

    // Linked transaction
    transaction_id: v.optional(v.id("transactions")),

    // Timing
    requested_at: v.number(),
    processed_at: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_store", ["store_id"])
    .index("by_status", ["store_id", "status"])
    .index("by_status_only", ["status"]),

  // ============================================
  // RETURN REQUESTS
  // ============================================
  return_requests: defineTable({
    order_id: v.id("orders"),
    store_id: v.id("stores"), // denormalized for vendor queries
    customer_id: v.id("users"),

    // Items being returned (partial returns supported)
    items: v.array(
      v.object({
        product_id: v.id("products"),
        variant_id: v.optional(v.id("product_variants")),
        title: v.string(), // snapshot at time of return
        quantity: v.number(),
        unit_price: v.number(), // centimes at time of purchase
      }),
    ),

    // Status workflow: requested → approved → received → refunded
    //                  requested → rejected (terminal)
    status: v.union(
      v.literal("requested"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("received"),
      v.literal("refunded"),
    ),

    // Customer details
    reason: v.string(), // customer explanation
    reason_category: v.union(
      v.literal("defective"),
      v.literal("wrong_item"),
      v.literal("not_as_described"),
      v.literal("changed_mind"),
      v.literal("damaged_in_transit"),
      v.literal("other"),
    ),

    // Financial
    refund_amount: v.number(), // centimes, calculated on returned items

    // Vendor response
    vendor_notes: v.optional(v.string()),
    rejection_reason: v.optional(v.string()),

    // Timestamps
    requested_at: v.number(),
    approved_at: v.optional(v.number()),
    received_at: v.optional(v.number()),
    refunded_at: v.optional(v.number()),

    // External reference (Moneroo refund ID)
    refund_reference: v.optional(v.string()),
  })
    .index("by_order", ["order_id"])
    .index("by_store", ["store_id"])
    .index("by_customer", ["customer_id"])
    .index("by_store_status", ["store_id", "status"]),

  // ============================================
  // AD SPACES — Emplacements publicitaires
  // ============================================
  ad_spaces: defineTable({
    // Identification
    slot_id: v.string(), // "hero_main", "mid_banner", etc.
    name: v.string(), // "Héro Principal"
    description: v.optional(v.string()),

    // Dimensions & Format
    format: v.string(), // "banner", "card", "logo", "spotlight"
    width: v.number(), // px
    height: v.number(), // px
    max_slots: v.number(), // nb d'annonces simultanées (rotation)

    // Pricing (en centimes XOF)
    base_price_daily: v.number(), // prix de base par jour
    base_price_weekly: v.number(), // prix par semaine
    base_price_monthly: v.number(), // prix par mois

    // Dynamic pricing
    demand_multiplier: v.number(), // 1.0 = normal, 1.5 = haute demande
    peak_periods: v.optional(
      v.array(
        v.object({
          name: v.string(), // "Black Friday", "Noël"
          starts_at: v.number(),
          ends_at: v.number(),
          multiplier: v.number(), // ex: 2.0
        }),
      ),
    ),

    // Status
    is_active: v.boolean(),
    sort_order: v.number(), // ordre d'affichage dans le catalogue admin

    // Metadata
    updated_at: v.number(),
  })
    .index("by_slot_id", ["slot_id"])
    .index("by_active", ["is_active"]),

  // ============================================
  // AD BOOKINGS — Réservations d'espaces
  // ============================================
  ad_bookings: defineTable({
    // Liens
    ad_space_id: v.id("ad_spaces"),
    slot_id: v.string(), // dénormalisé pour queries rapides
    store_id: v.optional(v.id("stores")), // vendeur qui réserve
    booked_by: v.id("users"), // user qui a fait la réservation

    // Contenu de l'annonce
    content_type: v.union(
      v.literal("product"), // mise en avant produit
      v.literal("store"), // mise en avant boutique
      v.literal("banner"), // image custom
      v.literal("promotion"), // coupon / offre spéciale
    ),
    // Référence vers le contenu
    product_id: v.optional(v.id("products")),
    // Contenu banner custom
    image_url: v.optional(v.string()),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    cta_text: v.optional(v.string()), // "Découvrir" / "Acheter"
    cta_link: v.optional(v.string()), // URL destination
    background_color: v.optional(v.string()), // hex

    // Période
    starts_at: v.number(),
    ends_at: v.number(),

    // Pricing
    total_price: v.number(), // centimes, calculé à la réservation
    currency: v.string(), // XOF

    // Source
    source: v.union(
      v.literal("vendor"), // réservé par le vendeur (payant)
      v.literal("admin"), // placé par l'admin (override, peut être gratuit)
    ),

    // Priorité & Queue
    priority: v.number(),
    // 100 = admin override (toujours affiché)
    // 50  = vendor payé confirmé
    // 10  = en file d'attente
    // 0   = fallback organique

    // Status
    status: v.union(
      v.literal("pending"), // en attente de paiement ou validation
      v.literal("confirmed"), // payé ou validé par admin
      v.literal("active"), // actuellement affiché
      v.literal("completed"), // période terminée
      v.literal("cancelled"), // annulé
      v.literal("queued"), // en file d'attente (slots pleins)
    ),

    // Paiement
    payment_status: v.union(
      v.literal("unpaid"),
      v.literal("paid"),
      v.literal("refunded"),
      v.literal("waived"), // admin = gratuit
    ),
    transaction_id: v.optional(v.id("transactions")),

    // Stats
    impressions: v.number(), // nombre d'affichages
    clicks: v.number(), // nombre de clics

    // Metadata
    admin_notes: v.optional(v.string()),
    updated_at: v.number(),
  })
    .index("by_slot", ["slot_id", "status"])
    .index("by_store", ["store_id"])
    .index("by_status", ["status"])
    .index("by_active_slot", ["slot_id", "status", "priority"])
    .index("by_period", ["slot_id", "starts_at", "ends_at"]),

  // ============================================
  // DELIVERY BATCHES — Lots de livraison
  // ============================================
  delivery_batches: defineTable({
    // Identification
    batch_number: v.string(), // "LOT-2026-0001"

    // Source
    store_id: v.id("stores"),
    created_by: v.id("users"), // vendeur qui a créé le lot

    // Contenu
    order_ids: v.array(v.id("orders")), // commandes incluses
    order_count: v.number(), // dénormalisé pour affichage rapide

    // Regroupement
    grouping_type: v.union(
      v.literal("zone"), // regroupé par zone
      v.literal("manual"), // sélection manuelle
    ),
    delivery_zone_id: v.optional(v.id("delivery_zones")), // si grouping_type = "zone"

    // Workflow status
    status: v.union(
      v.literal("pending"), // créé par vendeur, en attente de transmission
      v.literal("transmitted"), // envoyé à l'admin
      v.literal("assigned"), // assigné au service de livraison
      v.literal("in_progress"), // livraisons en cours
      v.literal("completed"), // toutes les livraisons terminées
      v.literal("cancelled"), // annulé
    ),

    // Timestamps workflow
    transmitted_at: v.optional(v.number()), // quand envoyé à l'admin
    assigned_at: v.optional(v.number()), // quand assigné au livreur
    completed_at: v.optional(v.number()), // quand toutes livraisons terminées

    // Admin
    admin_notes: v.optional(v.string()),
    processed_by: v.optional(v.id("users")), // admin qui a traité

    // PDF
    pdf_url: v.optional(v.string()), // URL du récapitulatif généré

    // Stats
    total_delivery_fee: v.number(), // somme des frais de livraison (centimes)
    currency: v.string(), // XOF

    // Source — true si le lot part depuis l'entrepôt Pixel-Mart
    is_warehouse_batch: v.optional(v.boolean()),

    // Metadata
    updated_at: v.number(),
  })
    .index("by_store", ["store_id"])
    .index("by_status", ["status"])
    .index("by_store_status", ["store_id", "status"])
    .index("by_batch_number", ["batch_number"]),

  // ============================================
  // STORAGE REQUESTS — Demandes de mise en stock
  // ============================================
  // Flux : pending_drop_off → received (agent) → in_stock | rejected (admin)
  storage_requests: defineTable({
    // Propriété
    store_id: v.id("stores"),
    product_id: v.optional(v.id("products")), // optionnel si produit pas encore créé

    // Identification physique
    storage_code: v.string(), // "PM-102" — généré à la création, écrit sur le colis

    // Infos saisies par le vendeur
    product_name: v.string(), // nom du produit (snapshot)
    estimated_qty: v.optional(v.number()), // estimation vendeur

    // Données officielles saisies par l'agent (source de vérité)
    measurement_type: v.optional(
      v.union(v.literal("units"), v.literal("weight")),
    ),
    actual_qty: v.optional(v.number()), // nombre exact d'unités (si measurement_type = "units")
    actual_weight_kg: v.optional(v.number()), // poids réel en kg (si measurement_type = "weight")

    // Workflow
    status: v.union(
      v.literal("pending_drop_off"), // en attente de dépôt à l'entrepôt
      v.literal("received"), // reçu et mesuré par l'agent
      v.literal("in_stock"), // validé par l'admin, produit en stock
      v.literal("rejected"), // rejeté par l'admin
    ),

    // Agent qui a réceptionné
    agent_id: v.optional(v.id("users")),
    received_at: v.optional(v.number()),
    agent_notes: v.optional(v.string()),

    // Admin qui a validé / rejeté
    admin_id: v.optional(v.id("users")),
    validated_at: v.optional(v.number()),
    rejection_reason: v.optional(v.string()),

    // Facturation (calculée automatiquement après validation)
    storage_fee: v.optional(v.number()), // centimes
    invoice_id: v.optional(v.id("storage_invoices")),

    // Notes
    notes: v.optional(v.string()), // note libre du vendeur

    // Timestamps
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_store", ["store_id"])
    .index("by_code", ["storage_code"])
    .index("by_status", ["status"])
    .index("by_store_status", ["store_id", "status"])
    .index("by_product", ["product_id"]),

  // ============================================
  // STORAGE INVOICES — Factures de stockage
  // ============================================
  storage_invoices: defineTable({
    store_id: v.id("stores"),
    request_id: v.id("storage_requests"),

    // Montant
    amount: v.number(), // centimes
    currency: v.string(), // XOF

    // Statut de paiement
    status: v.union(
      v.literal("unpaid"), // en attente de paiement
      v.literal("paid"), // payé directement
      v.literal("deducted_from_payout"), // déduit d'un retrait
    ),

    // Mode de paiement choisi par le vendeur
    payment_method: v.optional(
      v.union(
        v.literal("immediate"), // paiement direct
        v.literal("auto_debit"), // prélèvement automatique sur ventes
        v.literal("deferred"), // paiement différé (dette mensuelle)
      ),
    ),

    // Référence paiement Moneroo (si paiement immédiat)
    payment_reference: v.optional(v.string()),
    paid_at: v.optional(v.number()),

    // Timestamps
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_store", ["store_id"])
    .index("by_request", ["request_id"])
    .index("by_status", ["store_id", "status"]),

  // ============================================
  // STORAGE DEBT — Dette mensuelle de stockage
  // ============================================
  // Accumulée quand le vendeur choisit le paiement différé.
  // Déduite automatiquement (F-05) lors d'un retrait de gains.
  storage_debt: defineTable({
    store_id: v.id("stores"),

    // Montant de la dette
    amount: v.number(), // centimes (toujours positif)
    currency: v.string(), // XOF

    // Période (format "YYYY-MM", ex: "2026-03")
    period: v.string(),

    // Lien vers les factures incluses dans cette dette
    invoice_ids: v.array(v.id("storage_invoices")),

    // Règlement
    settled_at: v.optional(v.number()),
    payout_id: v.optional(v.id("payouts")), // retrait qui a soldé la dette

    // Timestamps
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_store", ["store_id"])
    .index("by_store_period", ["store_id", "period"])
    .index("by_unsettled", ["store_id", "settled_at"]),

  // ============================================
  // STORAGE WITHDRAWALS — Retraits physiques depuis l'entrepôt
  // ============================================
  // Flux : pending → approved → processed | cancelled
  // Pour les vendeurs qui souhaitent récupérer leurs produits stockés.
  storage_withdrawals: defineTable({
    store_id: v.id("stores"),
    request_id: v.id("storage_requests"),
    product_id: v.optional(v.id("products")),

    // Quantité à retirer
    quantity: v.number(),

    // Raison / instructions
    reason: v.optional(v.string()),

    // Statut
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("processed"),
      v.literal("cancelled"),
    ),

    // Acteurs
    requested_by: v.id("users"),
    processed_by: v.optional(v.id("users")),
    processed_at: v.optional(v.number()),

    // Notes admin
    notes: v.optional(v.string()),

    // Timestamps
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_store", ["store_id"])
    .index("by_request", ["request_id"])
    .index("by_status", ["status"])
    .index("by_store_status", ["store_id", "status"]),

  // ============================================
  // DELIVERY RATES — Grille tarifaire (optionnel, peut être en constants)
  // ============================================
  // ============================================
  // WAITLIST — Captures des leads pré-lancement
  // ============================================
  waitlist: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("vendor"), v.literal("customer")),
    created_at: v.number(),
  }).index("by_email", ["email"]),

  delivery_rates: defineTable({
    // Type de course
    delivery_type: v.union(
      v.literal("standard"),
      v.literal("urgent"),
      v.literal("fragile"),
    ),

    // Période
    is_night_rate: v.boolean(), // 21h-06h

    // Tarification par palier de distance
    distance_min_km: v.number(), // 0, 6, 11
    distance_max_km: v.optional(v.number()), // 5, 10, null (= infini)

    // Prix
    base_price: v.number(), // prix fixe en centimes (pour palier 1-5km)
    price_per_km: v.optional(v.number()), // prix par km en centimes

    // Supplément poids
    weight_threshold_kg: v.number(), // 20 kg
    weight_surcharge_per_kg: v.number(), // 50 FCFA = 5000 centimes par kg au-dessus

    // Status
    is_active: v.boolean(),

    // Metadata
    updated_at: v.number(),
  }).index("by_type", ["delivery_type", "is_night_rate", "is_active"]),

  // ============================================
  // PUSH SUBSCRIPTIONS (Web Push API)
  // ============================================
  push_subscriptions: defineTable({
    user_id: v.id("users"),
    endpoint: v.string(), // Push service URL (unique per device/browser)
    p256dh: v.string(), // Client public key
    auth: v.string(), // Client auth secret
    user_agent: v.optional(v.string()), // Browser/device info
    created_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_endpoint", ["endpoint"]),

  // ============================================
  // COUNTRY CONFIG — activation/désactivation pays
  // ============================================
  country_config: defineTable({
    country_code: v.string(), // "BJ", "SN", etc.
    is_active: v.boolean(),
    updated_at: v.number(),
    updated_by: v.optional(v.id("users")),
  }).index("by_code", ["country_code"]),

  // ============================================
  // PLATFORM CONFIG — constantes éditables admin
  // ============================================
  platform_config: defineTable({
    key: v.string(), // identifiant unique, ex: "commission_free"
    value: v.number(), // valeur numérique (basis points, centimes ou ms)
    label: v.string(), // libellé lisible, ex: "Commission Free (bp)"
    updated_at: v.number(),
    updated_by: v.optional(v.id("users")),
  }).index("by_key", ["key"]),

  // ============================================
  // PLATFORM EVENTS — journal d'audit admin
  // ============================================
  platform_events: defineTable({
    type: v.string(), // "user_banned" | "config_changed" | "payout_approved" | "client_error" | …
    actor_id: v.optional(v.id("users")),
    actor_name: v.optional(v.string()),
    target_type: v.optional(v.string()), // "user" | "store" | "payout" | "config" | "category" | …
    target_id: v.optional(v.string()), // ID Convex de l'entité cible
    target_label: v.optional(v.string()), // libellé lisible
    metadata: v.optional(v.string()), // JSON sérialisé (context additionnel)
    created_at: v.number(),
  })
    .index("by_type", ["type", "created_at"])
    .index("by_actor", ["actor_id", "created_at"])
    .index("by_created_at", ["created_at"]),

  // ============================================
  // NEWSLETTER SUBSCRIBERS
  // ============================================
  newsletter_subscribers: defineTable({
    email: v.string(),
    subscribed_at: v.number(),
    source: v.optional(v.string()), // "storefront"
  }).index("by_email", ["email"]),

  // ============================================
  // WISHLISTS
  // ============================================
  wishlists: defineTable({
    user_id: v.id("users"),
    product_id: v.id("products"),
    added_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_user_product", ["user_id", "product_id"]),
});
