# PIXEL-MART — Technical Documentation (Phase 0)

> Multi-vendor e-commerce marketplace for Africa. Built with Next.js 14, Convex, TypeScript, shadcn/ui.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Environment Variables](#environment-variables)
4. [Repository Structure](#repository-structure)
5. [Database Schema](#database-schema)
6. [Backend — Convex Functions Reference](#backend--convex-functions-reference)
7. [Frontend — Pages & Routes](#frontend--pages--routes)
8. [Constants & Sources of Truth](#constants--sources-of-truth)
9. [Business Rules](#business-rules)
10. [Order State Machine](#order-state-machine)
11. [Payment Flow (Moneroo)](#payment-flow-moneroo)
12. [Email System](#email-system)
13. [Authentication Flow](#authentication-flow)
14. [Development Phases](#development-phases)
15. [Known TypeScript Gotchas](#known-typescript-gotchas)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  Next.js 14 (App Router) + shadcn/ui + Tailwind     │
│  Hosted on Vercel                                    │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │Storefront│  │  Vendor   │  │      Admin       │   │
│  │  (public)│  │ Dashboard │  │    Dashboard     │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
└──────────────┬───────────────────────────────────────┘
               │ Convex React Client (reactive queries)
               │
┌──────────────▼───────────────────────────────────────┐
│                    BACKEND                           │
│  Convex Cloud (queries, mutations, actions, crons)   │
│                                                      │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Queries │  │Mutations │  │     Actions        │  │
│  │ (reads) │  │ (writes) │  │ (external APIs)    │  │
│  └─────────┘  └──────────┘  └────────────────────┘  │
│                                                      │
│  ┌─────────┐  ┌──────────────────────────────────┐   │
│  │  HTTP   │  │       File Storage               │   │
│  │ Actions │  │   (images, digital products)     │   │
│  │(webhooks│  └──────────────────────────────────┘   │
│  └────┬────┘                                         │
└───────┼──────────────────────────────────────────────┘
        │
   ┌────▼─────────────────────────────────┐
   │         EXTERNAL SERVICES            │
   │                                      │
   │  Moneroo (payments) │ Resend (email) │
   │  Google OAuth       │                │
   └──────────────────────────────────────┘
```

**Key Principles:**
- Queries = read-only, reactive, cached automatically
- Mutations = write to DB, transactional, atomic
- Actions = external API calls (Moneroo, Resend) — NOT transactional
- **NEVER** call external APIs inside a mutation — use action → mutation pattern
- All monetary amounts in **centimes** (1/100 unit)
- Default currency: **XOF** (Franc CFA)

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14+ (App Router) | `app/` directory, server components default |
| Database | Convex | Real-time reactive queries/mutations |
| Auth | Convex + Better Auth | Email/password + Google OAuth |
| Payments | Moneroo | MTN, Orange, Wave, Moov (Mobile Money) |
| UI Components | shadcn/ui | Tailwind-based, CLI installed |
| Styling | Tailwind CSS | Dark theme first, mobile first |
| Email | Resend + react-email | Transactional emails |
| Hosting | Vercel (frontend) + Convex Cloud (backend) |
| File Storage | Convex File Storage | Product images, store logos |

---

## Environment Variables

### Convex (set via `npx convex env set`)

```env
BETTER_AUTH_SECRET=          # openssl rand -base64 32
SITE_URL=                    # https://yourdomain.com
RESEND_API_KEY=              # Resend API key
GOOGLE_CLIENT_ID=            # Google OAuth client ID
GOOGLE_CLIENT_SECRET=        # Google OAuth client secret
MONEROO_SECRET_KEY=          # Moneroo API secret key
MONEROO_WEBHOOK_SECRET=      # Moneroo webhook HMAC secret
```

### Next.js (`.env.local`)

```env
CONVEX_DEPLOYMENT=dev:xxx
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://xxx.convex.site
```

---

## Repository Structure

```
pixelmart/
├── convex/                           # ← BACKEND (Convex)
│   ├── schema.ts                     # Database schema (12 tables)
│   ├── http.ts                       # HTTP router (auth + webhooks)
│   ├── auth.ts                       # Better Auth configuration
│   ├── auth.config.ts                # Auth provider config
│   │
│   ├── lib/
│   │   └── constants.ts              # Shared backend constants (commission rates)
│   │
│   ├── users/
│   │   ├── queries.ts                # getMe
│   │   ├── mutations.ts              # updateProfile, becomeVendor
│   │   └── helpers.ts                # getAppUser, requireAppUser, getVendorStore, requireRole
│   │
│   ├── stores/
│   │   ├── queries.ts                # getMyStore, getBySlug
│   │   └── mutations.ts              # updateStore, generateUploadUrl
│   │
│   ├── categories/
│   │   ├── queries.ts                # listCategories, getBySlug
│   │   ├── mutations.ts              # createCategory, updateCategory (admin)
│   │   └── seed.ts                   # Seed 8 default categories
│   │
│   ├── products/
│   │   ├── queries.ts                # listByStore, getBySlug, search, listPublic
│   │   └── mutations.ts              # create, update, delete, adjustStock
│   │
│   ├── orders/
│   │   ├── queries.ts                # listByCustomer, listByStore, getById, getStoreOrderStats
│   │   ├── mutations.ts              # createOrder, updateStatus, cancelOrder
│   │   └── helpers.ts                # assertValidTransition, restoreInventory
│   │
│   ├── payments/
│   │   ├── moneroo.ts                # initializePayment, verifyPayment (actions)
│   │   ├── mutations.ts              # confirmPayment, failPayment, setPaymentReference
│   │   ├── queries.ts                # getOrderForPayment (internal)
│   │   ├── webhooks.ts               # handleMonerooWebhook (httpAction)
│   │   └── helpers.ts                # centimesToMonerooAmount, verifyMonerooSignature
│   │
│   ├── coupons/
│   │   ├── queries.ts                # validateCoupon
│   │   └── mutations.ts              # createCoupon, updateCoupon
│   │
│   ├── dashboard/
│   │   └── queries.ts                # getVendorDashboard (KPIs)
│   │
│   └── emails/
│       └── send.ts                   # Email dispatch actions (Resend)
│
├── emails/                           # ← EMAIL TEMPLATES (react-email)
│   ├── components/
│   │   ├── Layout.tsx                # Shared email layout + theme tokens
│   │   └── CTAButton.tsx             # Reusable CTA button
│   ├── VerifyEmail.tsx               # Email verification
│   ├── ResetPassword.tsx             # Password reset
│   ├── OrderConfirmation.tsx         # Order confirmation → client
│   ├── NewOrder.tsx                  # New order notification → vendor
│   ├── OrderShipped.tsx              # Shipping notification → client
│   ├── OrderDelivered.tsx            # Delivery confirmation → client
│   └── OrderCancelled.tsx            # Cancellation notice → client
│
├── src/                              # ← FRONTEND (Next.js)
│   ├── app/
│   │   ├── layout.tsx                # Root layout (ConvexProvider)
│   │   ├── page.tsx                  # Landing page
│   │   ├── dashboard/page.tsx        # Role-based redirect router
│   │   │
│   │   ├── (auth)/                   # Auth pages (no sidebar)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── vendor/register/page.tsx
│   │   │
│   │   ├── (storefront)/             # Public storefront
│   │   │   ├── layout.tsx            # Navbar + Footer
│   │   │   ├── products/page.tsx     # Product catalog
│   │   │   ├── products/[slug]/page.tsx  # Product detail
│   │   │   ├── categories/page.tsx   # All categories
│   │   │   ├── categories/[slug]/page.tsx  # Category products
│   │   │   ├── stores/[slug]/page.tsx    # Store vitrine
│   │   │   ├── search/page.tsx       # Full-text search results
│   │   │   ├── cart/page.tsx         # Shopping cart
│   │   │   ├── checkout/page.tsx     # Checkout flow
│   │   │   ├── checkout/payment-callback/page.tsx  # Moneroo return
│   │   │   ├── checkout/confirmation/page.tsx      # Order success
│   │   │   └── orders/
│   │   │       ├── page.tsx          # Customer order history
│   │   │       └── [id]/page.tsx     # Customer order detail
│   │   │
│   │   └── (vendor)/                 # Vendor dashboard
│   │       ├── layout.tsx            # Sidebar + header (AuthGuard vendor)
│   │       └── vendor/
│   │           ├── dashboard/page.tsx    # KPIs, charts, alerts
│   │           ├── products/page.tsx     # Product list
│   │           ├── products/new/page.tsx # Create product
│   │           ├── products/[id]/edit/page.tsx  # Edit product
│   │           ├── orders/page.tsx       # Order management
│   │           ├── orders/[id]/page.tsx  # Order detail + actions
│   │           ├── settings/page.tsx     # User profile
│   │           └── store/settings/page.tsx  # Store settings
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui (auto-generated)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── VendorSidebar.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── auth/
│   │   │   └── AuthGuard.tsx         # Role-based route protection
│   │   ├── products/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductForm.tsx       # Tabbed form (info, media, variants, SEO)
│   │   │   ├── ProductImageUpload.tsx
│   │   │   └── VariantEditor.tsx
│   │   ├── checkout/
│   │   │   ├── AddressForm.tsx
│   │   │   └── CouponInput.tsx
│   │   └── cart/
│   │       └── CartProvider.tsx       # React Context + localStorage
│   │
│   ├── hooks/
│   │   ├── useCurrentUser.ts         # Auth state + Convex user
│   │   └── useCart.ts                # Cart context consumer
│   │
│   ├── lib/
│   │   ├── auth-client.ts            # Better Auth client
│   │   ├── utils.ts                  # cn(), formatPrice()
│   │   ├── payment-queue.ts          # Multi-store payment queue (localStorage)
│   │   └── order-helpers.ts          # Status configs, timeline, date formatting
│   │
│   ├── constants/
│   │   ├── routes.ts                 # All app routes (source of truth)
│   │   ├── countries.ts              # SUPPORTED_COUNTRIES array
│   │   ├── paymentMethods.ts         # Moneroo payment methods config
│   │   ├── subscriptionPlans.ts      # Free/Pro/Business plans
│   │   └── vendor-nav.ts             # Vendor sidebar navigation items
│   │
│   └── types/
│       └── index.ts                  # Shared TypeScript types
│
└── package.json
```

---

## Database Schema

### 12 Tables — Phase 0

| # | Table | Purpose | Key Indexes |
|---|-------|---------|-------------|
| 1 | `users` | All users (customer, vendor, admin) | `by_email`, `by_role` |
| 2 | `stores` | Vendor shops | `by_slug`, `by_owner`, `by_status` |
| 3 | `categories` | Product categories (2-level hierarchy) | `by_slug`, `by_parent` |
| 4 | `products` | Product catalog | `by_store`, `by_slug`, `by_category`, `by_status`, `by_store_active` |
| 5 | `product_variants` | Size/color variants | `by_product`, `by_store` |
| 6 | `orders` | Orders with embedded items | `by_store`, `by_customer`, `by_order_number` |
| 7 | `transactions` | Financial ledger (IMMUTABLE) | `by_store`, `by_type`, `by_order` |
| 8 | `reviews` | Product reviews | `by_product`, `by_store`, `by_customer` |
| 9 | `coupons` | Promo codes per store | `by_store`, `by_code` (composite) |
| 10 | `messages` | Vendor-customer messaging | `by_thread`, `by_receiver` |
| 11 | `notifications` | Multi-channel notifications | `by_user_unread` |
| 12 | `payouts` | Vendor withdrawal requests | `by_store`, `by_status` |

### Key Data Rules

- All amounts in **centimes** (integers). XOF: 5000 XOF = 500000 centimes
- All timestamps in **Unix milliseconds** (`Date.now()`)
- Commission rates in **basis points** (500 = 5%)
- Slugs are **unique** and auto-generated with collision resolution
- Transactions are **IMMUTABLE** — never update, create reversals instead
- Order items are **embedded** (snapshot at time of order)

### Users Table

```
users {
  email: string
  name: string
  avatar_url?: string
  phone?: string             # E.164: +22961234567
  role: "admin" | "vendor" | "customer"
  auth_provider: "email" | "google" | "facebook"
  email_verified: boolean
  is_2fa_enabled: boolean
  totp_secret?: string       # AES-256 encrypted
  is_verified: boolean
  is_banned: boolean
  last_login_at?: number
  locale: "fr" | "en"
  updated_at: number
}
```

### Stores Table

```
stores {
  owner_id: Id<"users">
  name: string
  slug: string               # unique, URL-safe
  description?: string
  logo_url?: string
  banner_url?: string
  theme_id: string           # "default" | "modern" | "classic"
  primary_color?: string     # hex
  status: "active" | "suspended" | "pending" | "closed"
  subscription_tier: "free" | "pro" | "business"
  subscription_ends_at?: number
  commission_rate: number    # basis points: 200 | 300 | 500
  balance: number            # centimes, available for withdrawal
  pending_balance: number    # centimes, awaiting 48h release
  currency: string           # default: XOF
  level: "bronze" | "silver" | "gold" | "platinum"
  total_orders: number
  avg_rating: number         # 0.0–5.0
  is_verified: boolean
  country: string            # ISO 3166-1 alpha-2
  updated_at: number
}
```

### Orders Table

```
orders {
  order_number: string       # PM-2026-0001
  customer_id: Id<"users">
  store_id: Id<"stores">
  items: [{                  # embedded snapshot
    product_id, variant_id?, title, sku?, image_url,
    quantity, unit_price, total_price
  }]
  subtotal: number           # centimes
  discount_amount: number
  shipping_amount: number
  commission_amount: number
  total_amount: number
  currency: string
  coupon_code?: string
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  payment_status: "pending" | "paid" | "failed" | "refunded"
  payment_method?: string
  payment_reference?: string # Moneroo transaction ID
  shipping_address: { full_name, line1, line2?, city, state?, postal_code?, country, phone? }
  tracking_number?: string
  carrier?: string
  notes?: string
  delivered_at?: number
  updated_at: number
}
```

### Transactions Table (F-01 Ledger)

```
transactions {
  store_id: Id<"stores">
  order_id?: Id<"orders">
  type: "sale" | "refund" | "payout" | "fee" | "credit" | "transfer" | "ad_payment" | "subscription"
  direction: "credit" | "debit"
  amount: number             # centimes, always positive
  currency: string
  balance_before: number     # snapshot
  balance_after: number      # snapshot
  status: "pending" | "completed" | "failed" | "reversed"
  reference?: string         # external payment ID
  description: string
  metadata?: any
  processed_at?: number
}
```

---

## Backend — Convex Functions Reference

### HTTP Actions (`convex/http.ts`)

| Path | Method | Handler | Purpose |
|------|--------|---------|---------|
| `/api/auth/*` | ALL | Better Auth | Authentication routes |
| `/webhooks/moneroo` | POST | `handleMonerooWebhook` | Payment webhook |

### Users (`convex/users/`)

| Type | Function | Args | Description |
|------|----------|------|-------------|
| Query | `getMe` | — | Current user from auth identity |
| Mutation | `updateProfile` | `name?, phone?, locale?` | Update user profile |
| Mutation | `becomeVendor` | `store_name` | Promote customer → vendor, create store |

**Helpers:** `getAppUser(ctx)`, `requireAppUser(ctx)`, `requireRole(ctx, roles)`, `getVendorStore(ctx)`

### Stores (`convex/stores/`)

| Type | Function | Args | Description |
|------|----------|------|-------------|
| Query | `getMyStore` | — | Current vendor's store |
| Query | `getBySlug` | `slug` | Public store lookup |
| Mutation | `updateStore` | `name?, description?, logo_url?, banner_url?, ...` | Update store settings |
| Mutation | `generateUploadUrl` | — | Get Convex file upload URL |

### Categories (`convex/categories/`)

| Type | Function | Args | Description |
|------|----------|------|-------------|
| Query | `listCategories` | — | All active categories (hierarchical) |
| Query | `getBySlug` | `slug` | Single category |
| Mutation | `createCategory` | `name, slug, parent_id?, ...` | Admin only |
| Mutation | `updateCategory` | `id, name?, is_active?, ...` | Admin only |

### Products (`convex/products/`)

| Type | Function | Args | Description |
|------|----------|------|-------------|
| Query | `listByStore` | `status?` | Vendor's products |
| Query | `listPublic` | `storeId?, categoryId?, limit?` | Storefront catalog |
| Query | `getBySlug` | `slug` | Product detail page |
| Query | `search` | `query, categoryId?, minPrice?, maxPrice?` | Full-text search |
| Mutation | `create` | `{title, description, price, images, ...}` | Create product |
| Mutation | `update` | `id, {fields...}` | Update product |
| Mutation | `remove` | `id` | Delete product |
| Mutation | `adjustStock` | `productId, variantId?, delta` | Adjust inventory |

### Orders (`convex/orders/`)

| Type | Function | Args | Description |
|------|----------|------|-------------|
| Query | `listByCustomer` | `status?, limit?` | Customer order history |
| Query | `listByStore` | `status?, limit?` | Vendor order list |
| Query | `getById` | `orderId` | Order detail |
| Query | `getStoreOrderStats` | — | Counts by status + revenue |
| Mutation | `createOrder` | `storeId, items, shippingAddress, ...` | Create order (decrements stock) |
| Mutation | `updateStatus` | `orderId, status, trackingNumber?, carrier?` | Vendor: confirm/ship/deliver |
| Mutation | `cancelOrder` | `orderId, reason?` | Cancel + restore inventory |

### Payments (`convex/payments/`)

| Type | Function | Args | Description |
|------|----------|------|-------------|
| Action | `initializePayment` | `orderId` | Call Moneroo API → return checkout URL |
| Action | `verifyPayment` | `orderId` | Verify payment status with Moneroo |
| InternalMutation | `confirmPayment` | `orderId, paymentReference, amountPaid, currency` | Mark paid, create F-01 transactions, credit store |
| InternalMutation | `failPayment` | `orderId, reason?` | Cancel order, restore inventory |
| InternalMutation | `setPaymentReference` | `orderId, paymentReference, paymentMethod` | Store Moneroo payment ID |
| InternalQuery | `getOrderForPayment` | `orderId` | Order + customer info for actions |
| HTTPAction | `handleMonerooWebhook` | — | HMAC-verified webhook handler |

### Coupons (`convex/coupons/`)

| Type | Function | Args | Description |
|------|----------|------|-------------|
| Query | `validateCoupon` | `storeId, code, subtotal` | Validate + calculate discount |
| Mutation | `createCoupon` | `{code, type, value, ...}` | Create promo code |

### Dashboard (`convex/dashboard/`)

| Type | Function | Args | Description |
|------|----------|------|-------------|
| Query | `getVendorDashboard` | — | Complete KPI data: orders, revenue, products, top sellers, low stock |

### Emails (`convex/emails/`)

| Type | Function | Description |
|------|----------|-------------|
| InternalAction | `sendOrderConfirmation` | → Client after payment |
| InternalAction | `sendNewOrderNotification` | → Vendor after payment |
| InternalAction | `sendOrderShipped` | → Client when shipped |
| InternalAction | `sendOrderDelivered` | → Client when delivered |
| InternalAction | `sendOrderCancelled` | → Client when cancelled |

All emails dispatched via `ctx.scheduler.runAfter(0, ...)` for non-blocking execution.

---

## Frontend — Pages & Routes

### Route Map

| Route | Page | Auth | Description |
|-------|------|------|-------------|
| `/` | Landing | Public | Homepage |
| `/login` | Login | Public | Email/password + Google |
| `/register` | Register | Public | Customer registration |
| `/vendor/register` | Vendor Register | Public | Vendor onboarding |
| `/dashboard` | Redirect | Auth | Routes to vendor/admin/storefront by role |
| `/products` | Catalog | Public | All products with filters |
| `/products/[slug]` | Detail | Public | Product detail + add to cart |
| `/categories` | Categories | Public | Browse categories |
| `/categories/[slug]` | Category | Public | Products in category |
| `/stores/[slug]` | Store | Public | Store vitrine |
| `/search` | Search | Public | Full-text search results |
| `/cart` | Cart | Public | Shopping cart |
| `/checkout` | Checkout | Auth | Address + payment + order creation |
| `/checkout/payment-callback` | Callback | Auth | Moneroo return handler |
| `/checkout/confirmation` | Confirmation | Auth | Success page |
| `/orders` | My Orders | Auth | Customer order history |
| `/orders/[id]` | Order Detail | Auth | Timeline, items, cancel/pay |
| `/vendor/dashboard` | Dashboard | Vendor | KPIs, charts, alerts |
| `/vendor/products` | Products | Vendor | Product list management |
| `/vendor/products/new` | New Product | Vendor | Creation form |
| `/vendor/products/[id]/edit` | Edit Product | Vendor | Edit form |
| `/vendor/orders` | Orders | Vendor | Order management |
| `/vendor/orders/[id]` | Order Detail | Vendor | Confirm/ship/deliver/cancel |
| `/vendor/settings` | Profile | Vendor | User profile settings |
| `/vendor/store/settings` | Store Settings | Vendor | Store info, images, theme |

### Key Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CartProvider` | `components/cart/CartProvider.tsx` | React Context + localStorage cart |
| `AuthGuard` | `components/auth/AuthGuard.tsx` | Role-based route protection |
| `VendorSidebar` | `components/layout/VendorSidebar.tsx` | Vendor dashboard navigation |
| `ProductForm` | `components/products/ProductForm.tsx` | Tabbed product create/edit form |
| `ProductCard` | `components/products/ProductCard.tsx` | Product display card |
| `ProductGrid` | `components/products/ProductGrid.tsx` | Responsive product grid |
| `AddressForm` | `components/checkout/AddressForm.tsx` | Shipping address form |
| `CouponInput` | `components/checkout/CouponInput.tsx` | Real-time coupon validation |

---

## Constants & Sources of Truth

### Routes (`src/constants/routes.ts`)

Single source of truth for all navigation. Never hardcode paths.

```typescript
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  PRODUCTS: "/products",
  PRODUCT: (slug: string) => `/products/${slug}`,
  CATEGORIES: "/categories",
  CATEGORY: (slug: string) => `/categories/${slug}`,
  STORE: (slug: string) => `/stores/${slug}`,
  SEARCH: "/search",
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDER_CONFIRMATION: "/checkout/confirmation",
  CUSTOMER_ORDERS: "/orders",
  CUSTOMER_ORDER: (id: string) => `/orders/${id}`,
  VENDOR_DASHBOARD: "/vendor/dashboard",
  VENDOR_PRODUCTS: "/vendor/products",
  VENDOR_ORDERS: "/vendor/orders",
  // ...
};
```

### Supported Countries (`src/constants/countries.ts`)

```typescript
export const SUPPORTED_COUNTRIES = [
  { code: "BJ", name: "Bénin", currency: "XOF" },
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF" },
  { code: "SN", name: "Sénégal", currency: "XOF" },
  { code: "CM", name: "Cameroun", currency: "XAF" },
  { code: "TG", name: "Togo", currency: "XOF" },
  { code: "BF", name: "Burkina Faso", currency: "XOF" },
  { code: "ML", name: "Mali", currency: "XOF" },
  { code: "NE", name: "Niger", currency: "XOF" },
  { code: "GN", name: "Guinée", currency: "GNF" },
  { code: "FR", name: "France", currency: "EUR" },
];
```

### Payment Methods (`src/constants/paymentMethods.ts`)

Source of truth for Moneroo integration. Each method maps to a Moneroo `method` identifier.

| Provider | Countries | Moneroo Method |
|----------|-----------|----------------|
| MTN Mobile Money | BJ, CI, CM, GN | `mtn_bj`, `mtn_ci`, `mtn_cm`, `mtn_gn` |
| Orange Money | CI, CM, SN, ML, BF, GN | `orange_ci`, `orange_cm`, etc. |
| Wave | SN, CI, ML, BF | `wave_sn`, `wave_ci`, etc. |
| Moov/Flooz | BJ, TG, NE, CI | `moov_bj`, `moov_tg`, etc. |
| Wizall | SN | `wizall_sn` |

Methods are filtered by shipping country at checkout.

### Commission Rates (`convex/lib/constants.ts`)

```typescript
export const COMMISSION_RATES = {
  free: 500,      // 5%
  pro: 300,       // 3%
  business: 200,  // 2%
} as const;
```

### Subscription Plans (`src/constants/subscriptionPlans.ts`)

```typescript
export const SUBSCRIPTION_PLANS = {
  free: { name: "Free", price: 0, commission: 500 },
  pro: { name: "Pro", price: 2900, commission: 300 },      // €29/month
  business: { name: "Business", price: 9900, commission: 200 }, // €99/month
};
```

---

## Business Rules

### Financial Rules (Server-Enforced)

| Rule | Description |
|------|-------------|
| **F-01** | Every balance change MUST create a transaction record in the same mutation |
| **F-02** | Minimum payout: €1 (100 centimes). Fees deducted from amount |
| **F-03** | Balance credited only when `order.status = 'delivered'` AND `delivered_at > 48h` |
| **F-04** | `commission_amount = total_amount × commission_rate / 10000` |

### Commission Calculation

```
commission_amount = order.total_amount × store.commission_rate / 10000
net_vendor_amount = order.total_amount - commission_amount
```

Rate changes: **immediately on upgrade**, end-of-period on downgrade.

### Transaction Ledger on Payment Confirmation

When `confirmPayment` runs:
1. **Sale transaction** (credit): `net_amount` credited to store
2. **Fee transaction** (debit): `commission_amount` recorded
3. Store `pending_balance` incremented by `net_amount`
4. Store `total_orders` incremented

---

## Order State Machine

### Status Transitions (STRICT)

```
pending ──→ paid              (webhook: payment confirmed)
paid ──→ processing           (vendor: confirms order)
processing ──→ shipped        (vendor: adds tracking)
shipped ──→ delivered         (confirmation or auto +7 days)

pending ──→ cancelled         (customer: within 2h)
paid ──→ cancelled            (customer: within 2h → auto refund)
processing ──→ cancelled      (vendor only → auto refund)
paid/delivered ──→ refunded   (admin or vendor)
```

### FORBIDDEN Transitions

```
delivered → cancelled
shipped → paid
refunded → any
cancelled → any
```

### Payment Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting payment |
| `paid` | Payment confirmed |
| `failed` | Payment failed or cancelled |
| `refunded` | Refund processed |

---

## Payment Flow (Moneroo)

### Full Flow Diagram

```
1. Client: Checkout page
   └─→ createOrder (mutation) → order status: "pending"

2. Client: After order creation
   └─→ initializePayment (action) → calls Moneroo POST /v1/payments/initialize
   └─→ Returns { checkout_url, paymentId }
   └─→ setPaymentReference (mutation) → stores Moneroo ID on order

3. Client: Redirect to Moneroo
   └─→ window.location.href = checkout_url
   └─→ Customer completes payment on Moneroo page

4a. Moneroo: Redirect (client-side)
    └─→ return_url: /checkout/payment-callback?orderId=xxx
    └─→ Page calls verifyPayment (action) → GET /v1/payments/{id}/verify
    └─→ If success: mark paid, process next store in queue
    └─→ If all done: redirect to confirmation page

4b. Moneroo: Webhook (server-side, authoritative)
    └─→ POST /webhooks/moneroo on convex.site
    └─→ HMAC-SHA256 signature verification
    └─→ success → confirmPayment (mutation)
    └─→ failed/cancelled → failPayment (mutation)
```

### Multi-Store Payment Queue

When cart has items from multiple stores, each creates a separate order. Payments are sequential:

```
Queue: [orderId1, orderId2, orderId3]
  → Pay order 1 → Moneroo → callback → verify → mark paid
  → Pay order 2 → Moneroo → callback → verify → mark paid
  → Pay order 3 → Moneroo → callback → verify → mark paid
  → All done → redirect to confirmation
```

Queue state managed in localStorage (`payment-queue.ts`).

### Moneroo Amount Conversion

```typescript
// DB stores centimes (1/100). XOF has no subunits.
// Moneroo expects the major unit.
// 500000 centimes → 5000 XOF → send 5000 to Moneroo
function centimesToMonerooAmount(centimes: number): number {
  return Math.round(centimes / 100);
}
```

### Webhook Security

- Header: `x-moneroo-signature`
- Algorithm: HMAC-SHA256
- Secret: `MONEROO_WEBHOOK_SECRET` env var
- Timing-safe comparison to prevent timing attacks
- Idempotent: duplicate webhooks are safe (checks `payment_status === "paid"`)

---

## Email System

### Architecture

```
Mutation (order status change)
  └─→ ctx.scheduler.runAfter(0, internal.emails.send.sendXxx)
        └─→ Action (Node.js runtime)
              └─→ render() from @react-email/render
              └─→ resend.emails.send()
```

### Email Templates

| Template | Trigger | Recipient | Content |
|----------|---------|-----------|---------|
| `VerifyEmail` | Registration | Client | Verification link |
| `ResetPassword` | Password reset | Client | Reset link |
| `OrderConfirmation` | Payment confirmed | Client | Items, prices, address |
| `NewOrder` | Payment confirmed | Vendor | Items, commission, net revenue |
| `OrderShipped` | Vendor ships | Client | Tracking number, carrier |
| `OrderDelivered` | Delivery confirmed | Client | Success + review prompt |
| `OrderCancelled` | Cancellation | Client | Reason + refund status |

### Design System

All emails use shared `Layout.tsx` with consistent theme tokens:

```typescript
emailTheme = {
  colors: {
    primary: "#d4831a",      // Orange Pixel-Mart
    secondary: "#3a7bd5",    // Blue
    background: "#f7f7f7",
    card: "#ffffff",
    foreground: "#1a1a1a",
    muted: "#737373",
    border: "#e5e5e5",
  },
  fonts: {
    heading: "'Montserrat', sans-serif",
    body: "'Poppins', sans-serif",
  },
};
```

---

## Authentication Flow

### Provider: Convex + Better Auth

```
Client → Better Auth (email/password or Google OAuth)
  → Convex auth component validates session
  → convex/auth.ts triggers.afterCreateUser → creates user doc in users table
  → Frontend: useCurrentUser() hook reads from Convex
```

### Role System

| Role | Access | Assignment |
|------|--------|------------|
| `customer` | Storefront, orders, profile | Default on registration |
| `vendor` | Customer + vendor dashboard, products, store | Via `becomeVendor` mutation |
| `admin` | Everything | Manual DB assignment |

### Auth Guard

```tsx
<AuthGuard roles={["vendor", "admin"]}>
  <VendorDashboard />
</AuthGuard>
```

---

## Development Phases

### Phase 0 — Foundation (COMPLETED)

| Step | Scope | Status |
|------|-------|--------|
| 0.1 | Project Bootstrap (Next.js + Convex + shadcn) | ✅ |
| 0.2 | Database Schema (12 tables) | ✅ |
| 0.3 | Auth (Better Auth + Convex + email verification) | ✅ |
| 0.4 | User System (RBAC + profile page) | ✅ |
| 0.5 | Store CRUD (onboarding + settings) | ✅ |
| 0.6 | Categories & Tags (CRUD admin + seed) | ✅ |
| 0.7 | Product CRUD (form, images, variants) | ✅ |
| 0.8 | Inventory Management (stock tracking, auto out_of_stock) | ✅ |
| 0.9a | Storefront Backend (public queries, search) | ✅ |
| 0.9b | Storefront Frontend (6 pages: catalog, detail, categories, store, search) | ✅ |
| 0.10 | Cart & Checkout (CartProvider, address, coupons, multi-store) | ✅ |
| 0.11 | Payment Integration (Moneroo init, webhook, F-01 transactions) | ✅ |
| 0.12 | Order Management (client orders, vendor orders, dashboard KPIs) | ✅ |
| 0.13 | Profile & Store Settings (user profile, store settings pages) | ✅ |
| 0.14 | Transactional Emails (5 templates via Resend) | ✅ |

### Phase 1 — Vendor Empowerment (NEXT)

- Advanced product management (CSV import, duplication, templates)
- Order tracking & logistics
- Customer notifications (email, SMS, push)
- Returns & refunds workflow
- Analytics dashboard
- Financial tools (invoices, expenses)
- Storefront customization (themes)

---

## Known TypeScript Gotchas

### Multiline Generics Break on Copy-Paste

TypeScript multiline generics get corrupted when copy-pasted into certain editors. The `<` is interpreted as a comparison operator.

```typescript
// ❌ BREAKS — multiline generic
const [state, setState] = useState<
  Record<string, StoreCoupon>
>({});

// ✅ WORKS — extract type + single-line generic
type StoreCouponMap = Record<string, StoreCoupon>;
const [state, setState] = useState<StoreCouponMap>({});
```

**Rule:** Always use type aliases for complex generics and keep `useState<Type>(value)` on a single line.

### Convex Cannot Import from `src/`

Convex functions run in their own runtime and cannot import from `src/`. Shared constants must live in `convex/lib/`.

```typescript
// ❌ FAILS
import { COMMISSION_RATES } from "@/constants/plans"; // in a Convex mutation

// ✅ WORKS
import { COMMISSION_RATES } from "../lib/constants"; // from convex/lib/
```

### Id Types in Convex

Always use `v.id("tableName")` for foreign keys, never `v.string()`.

```typescript
// ❌ Wrong
store_id: v.string(),

// ✅ Correct
store_id: v.id("stores"),
```

---

## Quick Start

```bash
# 1. Clone & install
git clone <repo>
cd pixelmart
npm install

# 2. Setup Convex
npx convex dev  # creates .env.local with CONVEX_DEPLOYMENT

# 3. Set environment variables
npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
npx convex env set SITE_URL=http://localhost:3000
npx convex env set RESEND_API_KEY=re_xxx
npx convex env set GOOGLE_CLIENT_ID=xxx
npx convex env set GOOGLE_CLIENT_SECRET=xxx
npx convex env set MONEROO_SECRET_KEY=sk_xxx
npx convex env set MONEROO_WEBHOOK_SECRET=whsec_xxx

# 4. Run dev
npm run dev          # Next.js on :3000
npx convex dev       # Convex backend (separate terminal)
npm run email:dev    # Email preview on :3001 (optional)

# 5. Seed categories
# Call the seed function from Convex dashboard or CLI
```

---

## Moneroo Webhook URL

Configure in Moneroo dashboard:

```
https://<deployment-name>.convex.site/webhooks/moneroo
```

Get your deployment name from `.env.local` → `CONVEX_DEPLOYMENT`.

---

*Last updated: February 2026 — Phase 0 complete.*
