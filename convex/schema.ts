// filepath: convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // USERS (app-level — synced from Better Auth via triggers)
  // ============================================
  users: defineTable({
    // ---- Link to Better Auth ----
    better_auth_user_id: v.string(), // ID from Better Auth component's user table

    // ---- Denormalized from Better Auth (synced via triggers) ----
    email: v.string(),
    name: v.string(),
    avatar_url: v.optional(v.string()),

    // ---- Pixel-Mart business fields (NOT in Better Auth) ----
    phone: v.optional(v.string()), // E.164 format: +22961234567

    role: v.union(
      v.literal("admin"),
      v.literal("vendor"),
      v.literal("customer"),
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
    theme_id: v.string(), // "default" | "modern" | "classic"
    primary_color: v.optional(v.string()), // hex: #FF5722

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
    low_stock_threshold: v.number(), // default: 5

    // Physical
    weight: v.optional(v.number()), // grams

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

    // Timestamps
    published_at: v.optional(v.number()),
    updated_at: v.number(),
  })
    .index("by_store", ["store_id"])
    .index("by_slug", ["slug"])
    .index("by_category", ["category_id"])
    .index("by_status", ["store_id", "status"])
    .index("by_store_active", ["store_id", "status", "published_at"]),

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
        title: v.string(),
        sku: v.optional(v.string()),
        image_url: v.string(),
        quantity: v.number(),
        unit_price: v.number(), // centimes
        total_price: v.number(), // centimes
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

    // Metadata
    updated_at: v.number(),
  })
    .index("by_customer", ["customer_id"])
    .index("by_store", ["store_id"])
    .index("by_status", ["store_id", "status"])
    .index("by_order_number", ["order_number"])
    .index("by_payment_status", ["payment_status"]),

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
    .index("by_status", ["store_id", "status"]),
});
