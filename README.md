# PIXEL-MART — Technical Documentation (Phase 0 + Phase 1)

> Multi-vendor e-commerce marketplace for West African markets. Built with Next.js 14, Convex, TypeScript, shadcn/ui.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Environment Variables](#environment-variables)
4. [Repository Structure](#repository-structure)
5. [Database Schema](#database-schema)
6. [Backend — Convex Functions Reference](#backend--convex-functions-reference)
7. [Frontend — Pages & Routes](#frontend--pages--routes)
8. [Component Architecture (Atomic Design)](#component-architecture-atomic-design)
9. [Constants & Sources of Truth](#constants--sources-of-truth)
10. [Business Rules](#business-rules)
11. [Order State Machine](#order-state-machine)
12. [Payment Flow (Moneroo)](#payment-flow-moneroo)
13. [Ad Space System](#ad-space-system)
14. [Review System](#review-system)
15. [Storefront Theme System](#storefront-theme-system)
16. [Notification System](#notification-system)
17. [Returns & Refunds](#returns--refunds)
18. [Analytics System](#analytics-system)
19. [Financial Tools](#financial-tools)
20. [Email System](#email-system)
21. [Cron Jobs](#cron-jobs)
22. [Authentication Flow](#authentication-flow)
23. [Development Phases](#development-phases)
24. [Known TypeScript Gotchas](#known-typescript-gotchas)

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
│  ┌─────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │  HTTP   │  │   Cron   │  │   File Storage     │  │
│  │ Actions │  │   Jobs   │  │ (images, PDFs)     │  │
│  └────┬────┘  └──────────┘  └────────────────────┘  │
└───────┼──────────────────────────────────────────────┘
        │
   ┌────▼─────────────────────────────────┐
   │         EXTERNAL SERVICES            │
   │                                      │
   │  Moneroo (payments + payouts + ads)  │
   │  Resend (transactional email)        │
   │  Google OAuth                        │
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
| PDF | @react-pdf/renderer | Invoice generation |
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
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Repository Structure

```
pixelmart/
├── convex/                           # ← BACKEND (Convex)
│   ├── schema.ts                     # Database schema (14 tables)
│   ├── http.ts                       # HTTP router (auth + webhooks)
│   ├── auth.ts                       # Better Auth configuration
│   ├── auth.config.ts                # Auth provider config
│   ├── crons.ts                      # Cron job definitions
│   ├── crons_handlers.ts             # Cron handler implementations
│   │
│   ├── lib/
│   │   └── constants.ts              # Commission rates, shared constants
│   │
│   ├── users/
│   │   ├── queries.ts                # getMe, getById
│   │   ├── mutations.ts              # updateProfile, becomeVendor
│   │   └── helpers.ts                # requireAuth, requireVendor, requireAdmin
│   │
│   ├── stores/
│   │   ├── queries.ts                # getMyStore, getBySlug, getByOwner, listActive,
│   │   │                             #   getFeaturedStores, getMarketplaceStats
│   │   ├── mutations.ts              # updateStore, updateStoreTheme
│   │   └── themes.ts                 # Theme constants + CSS variable builder
│   │
│   ├── categories/
│   │   ├── queries.ts                # listCategories, listActive, getBySlug
│   │   ├── mutations.ts              # createCategory, updateCategory (admin)
│   │   └── seed.ts                   # Seed 8 default categories
│   │
│   ├── products/
│   │   ├── queries.ts                # listByStore, getBySlug, search, listLatest, listPublic
│   │   ├── mutations.ts              # create, update, remove, adjustStock, duplicate,
│   │   │                             #   bulkUpdateStatus, bulkDelete
│   │   ├── csvImport.ts              # CSV bulk import action
│   │   └── helpers.ts                # Product helpers
│   │
│   ├── variants/
│   │   ├── queries.ts                # listByProduct
│   │   └── mutations.ts              # create, update, remove
│   │
│   ├── orders/
│   │   ├── queries.ts                # listByCustomer, listByStore, getById, getStoreOrderStats
│   │   ├── mutations.ts              # createOrder, updateStatus, cancelOrder
│   │   ├── helpers.ts                # assertValidTransition, restoreInventory
│   │   └── events.ts                 # Order event dispatchers
│   │
│   ├── payments/
│   │   ├── moneroo.ts                # initializePayment, verifyPayment (actions)
│   │   ├── mutations.ts              # confirmPayment, failPayment, setPaymentReference
│   │   ├── queries.ts                # getOrderForPayment (internal)
│   │   ├── webhooks.ts               # handleMonerooWebhook (unified: orders + payouts + ads)
│   │   └── helpers.ts                # centimesToMonerooAmount, verifyMonerooSignature
│   │
│   ├── coupons/
│   │   ├── queries.ts                # validateCoupon
│   │   ├── mutations.ts              # createCoupon, updateCoupon
│   │   └── helpers.ts                # Coupon validation logic
│   │
│   ├── returns/
│   │   ├── queries.ts                # listByCustomer, listByStore, getById
│   │   ├── mutations.ts              # createReturn, approveReturn, rejectReturn, completeReturn
│   │   ├── actions.ts                # External integrations for returns
│   │   └── helpers.ts                # Return eligibility, refund calculation
│   │
│   ├── reviews/
│   │   ├── queries.ts                # listByProduct, getProductStats, listByStore, canReview
│   │   ├── mutations.ts              # create, reply, flag, remove, setPublished
│   │   └── helpers.ts                # validateReviewEligibility, recalculateRatings
│   │
│   ├── notifications/
│   │   ├── queries.ts                # getNotifications, unreadCount
│   │   ├── mutations.ts              # markRead, markAllRead
│   │   ├── send.ts                   # Notification dispatch (in-app + email)
│   │   └── helpers.ts                # createInAppNotification helper
│   │
│   ├── analytics/
│   │   ├── queries.ts                # getSalesOverview, getTopProducts, getCustomerInsights,
│   │   │                             #   getRevenueByCategoryChart, getSalesChart
│   │   └── helpers.ts                # Period calculation, comparison helpers
│   │
│   ├── finance/
│   │   ├── queries.ts                # getFinanceDashboard, getTransactions, getInvoiceData,
│   │   │                             #   getMarginAnalysis
│   │   └── helpers.ts                # Financial calculation helpers
│   │
│   ├── payouts/
│   │   ├── queries.ts                # listByStore, getBalance
│   │   ├── mutations.ts              # createPayoutRequest, processAdminPayout
│   │   ├── actions.ts                # Moneroo payout initialization
│   │   └── helpers.ts                # 2FA check, balance validation, cooldown
│   │
│   ├── ads/
│   │   ├── constants.ts              # AD_SLOT_DEFINITIONS (8 slots), AD_PRIORITY levels
│   │   ├── queries.ts                # getActiveAdsForSlot, listAvailableSpaces, listAllBookings,
│   │   │                             #   listMyBookings, previewPrice, getBookingById
│   │   ├── mutations.ts              # createBooking, adminCreateBooking, confirmBooking,
│   │   │                             #   cancelBooking, trackInteraction, updateDemandMultiplier,
│   │   │                             #   addPeakPeriod, setPaymentReference
│   │   ├── actions.ts                # initiateAdPayment (Moneroo Standard Integration)
│   │   ├── helpers.ts                # calculateBookingPrice, getActiveBookingsForSlot,
│   │   │                             #   promoteQueuedBookings
│   │   └── seed.ts                   # Seed 8 ad spaces
│   │
│   ├── dashboard/
│   │   └── queries.ts                # getVendorDashboard (KPIs)
│   │
│   ├── emails/
│   │   └── send.ts                   # Email dispatch actions (Resend)
│   │
│   ├── files/
│   │   └── mutations.ts              # generateUploadUrl, deleteFile
│   │
│   └── transactions/                 # (Empty — transactions created inline in other mutations)
│
├── emails/                           # ← EMAIL TEMPLATES (react-email)
│   ├── components/
│   │   ├── Layout.tsx                # Shared email layout + theme tokens
│   │   └── CTAButton.tsx             # Reusable CTA button
│   ├── VerifyEmail.tsx
│   ├── ResetPassword.tsx
│   ├── OrderConfirmation.tsx
│   ├── NewOrder.tsx
│   ├── OrderShipped.tsx
│   ├── OrderDelivered.tsx
│   ├── OrderCancelled.tsx
│   ├── OrderStatusUpdate.tsx
│   ├── OrderItemsTable.tsx           # Shared items table component
│   ├── LowStockAlert.tsx
│   ├── PayoutCompleted.tsx
│   ├── ReturnStatusUpdate.tsx
│   └── NewReview.tsx
│
├── src/                              # ← FRONTEND (Next.js)
│   ├── app/
│   │   ├── layout.tsx                # Root layout (ConvexProvider, CartProvider)
│   │   ├── ConvexClientProvider.tsx   # Convex + Better Auth provider
│   │   ├── globals.css               # Tailwind base + CSS variables
│   │   │
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   ├── (storefront)/
│   │   │   ├── layout.tsx            # HeaderNav + FooterFull
│   │   │   ├── page.tsx              # Homepage (HomepageTemplate)
│   │   │   ├── products/
│   │   │   │   ├── page.tsx          # Product catalog
│   │   │   │   └── [slug]/page.tsx   # Product detail + reviews
│   │   │   ├── categories/
│   │   │   │   └── [slug]/page.tsx   # Category products
│   │   │   ├── stores/
│   │   │   │   ├── page.tsx          # Store discovery
│   │   │   │   └── [slug]/page.tsx   # Store vitrine (themed)
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/
│   │   │   │   ├── page.tsx          # Checkout flow
│   │   │   │   ├── payment-callback/page.tsx
│   │   │   │   └── confirmation/page.tsx
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx          # Customer order history
│   │   │   │   └── [id]/page.tsx     # Order detail + review form
│   │   │   └── notifications/page.tsx
│   │   │
│   │   ├── (customers)/
│   │   │   ├── orders/[id]/return/page.tsx  # Return request form
│   │   │   └── returns/page.tsx             # Customer returns list
│   │   │
│   │   ├── (vendor)/
│   │   │   ├── layout.tsx            # Sidebar + header (AuthGuard vendor)
│   │   │   └── vendor/
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── products/
│   │   │       │   ├── page.tsx      # Product list (bulk actions, CSV import)
│   │   │       │   ├── new/page.tsx
│   │   │       │   └── [id]/edit/page.tsx
│   │   │       ├── orders/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── [id]/page.tsx
│   │   │       │   └── returns/page.tsx
│   │   │       ├── analytics/page.tsx
│   │   │       ├── finance/
│   │   │       │   ├── page.tsx      # Balance, transactions, margin
│   │   │       │   ├── invoices/page.tsx
│   │   │       │   └── payouts/page.tsx
│   │   │       ├── notifications/page.tsx
│   │   │       ├── reviews/page.tsx
│   │   │       ├── ads/
│   │   │       │   ├── page.tsx      # Ad space booking
│   │   │       │   └── payment-callback/page.tsx
│   │   │       ├── settings/page.tsx
│   │   │       └── store/
│   │   │           ├── settings/page.tsx
│   │   │           └── theme/page.tsx
│   │   │
│   │   ├── (admin)/
│   │   │   ├── layout.tsx
│   │   │   └── admin/
│   │   │       ├── categories/
│   │   │       ├── dashboard/
│   │   │       ├── payouts/
│   │   │       ├── stores/
│   │   │       ├── users/
│   │   │       └── ads/page.tsx      # Ad booking management
│   │   │
│   │   ├── onboarding/vendor/page.tsx
│   │   └── dashboard/page.tsx        # Role-based redirect
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui (~60 components)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx            # Legacy (replaced by HeaderNav for storefront)
│   │   │   ├── Footer.tsx            # Legacy (replaced by FooterFull for storefront)
│   │   │   ├── MobileNav.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── VendorSidebar.tsx
│   │   ├── auth/
│   │   │   └── AuthGuard.tsx
│   │   │
│   │   ├── storefront/              # ← NEW: Redesigned storefront (Atomic Design)
│   │   │   ├── atoms/
│   │   │   │   ├── PriceTag.tsx
│   │   │   │   ├── DiscountBadge.tsx
│   │   │   │   ├── CountdownTimer.tsx
│   │   │   │   ├── TrendingTag.tsx
│   │   │   │   ├── AdSlotWrapper.tsx  # Impression/click tracking wrapper
│   │   │   │   └── index.ts
│   │   │   ├── molecules/
│   │   │   │   ├── ProductCard.tsx    # Refactored with ratings, sponsored badge
│   │   │   │   ├── CategoryIcon.tsx
│   │   │   │   ├── AdBannerCard.tsx   # Generic ad card with overlay
│   │   │   │   └── index.ts
│   │   │   ├── organisms/
│   │   │   │   ├── TopPromoBanner.tsx    # [AD: top_banner]
│   │   │   │   ├── HeaderNav.tsx         # Mega menu, search, user dropdown
│   │   │   │   ├── CategoryBar.tsx       # Scrollable category icons
│   │   │   │   ├── HeroSection.tsx       # [AD: hero_main + hero_side]
│   │   │   │   ├── SubHeroCards.tsx      # [AD: hero_sub]
│   │   │   │   ├── WeeklyDeals.tsx       # [AD: deals_featured] + countdown
│   │   │   │   ├── TrendingSearch.tsx    # Tag cloud
│   │   │   │   ├── MidBanner.tsx         # [AD: mid_banner]
│   │   │   │   ├── BestSeller.tsx        # Tabbed category grid
│   │   │   │   ├── PopularBrands.tsx     # [AD: brands_row]
│   │   │   │   ├── SuggestToday.tsx      # Tabbed recommendations
│   │   │   │   ├── ProductSpotlight.tsx  # [AD: product_spotlight]
│   │   │   │   ├── JustLanding.tsx       # Newest products
│   │   │   │   ├── NewsletterBar.tsx     # Email subscribe + 10% off
│   │   │   │   ├── FooterFull.tsx        # 5-column footer + payment methods
│   │   │   │   └── index.ts
│   │   │   └── templates/
│   │   │       ├── HomepageTemplate.tsx  # Composes all 16 sections
│   │   │       └── index.ts
│   │   │
│   │   ├── analytics/               # Atomic Design
│   │   │   ├── atoms/ (EmptyState, MetricValue, TrendBadge)
│   │   │   ├── molecules/ (PeriodSelector, StatCard)
│   │   │   ├── organisms/ (SalesChart, TopProductsTable, CustomerInsightsPanel,
│   │   │   │               RevenueByCategoryChart, SalesOverviewCards)
│   │   │   └── templates/ (AnalyticsTemplate)
│   │   │
│   │   ├── finances/                # Atomic Design
│   │   │   ├── atoms/ (BalanceCard, TransactionBadge, TrendIndicator)
│   │   │   ├── molecules/ (FinancialKpiGrid, MarginBar, TransactionRow,
│   │   │   │               InvoiceVendorInfoForm)
│   │   │   ├── organisms/ (InvoicePdf, RevenueChart, TransactionTable)
│   │   │   └── templates/ (FinanceDashboardTemplate, InvoiceListTemplate)
│   │   │
│   │   ├── notifications/           # Atomic Design
│   │   │   ├── atoms/ (NotificationBadge, NotificationIcon)
│   │   │   ├── molecules/ (NotificationItem, NotificationEmptyState)
│   │   │   └── organisms/ (NotificationDropdown, NotificationList)
│   │   │
│   │   ├── orders/                  # Atomic Design
│   │   │   ├── atoms/ (OrderStatusBadge, TimelineStep, TrackingLink)
│   │   │   ├── molecules/ (OrderDetailPanel, OrderStatusActions, OrderSummaryCard,
│   │   │   │               OrderTimeline, TrackingForm)
│   │   │   ├── organisms/ (OrderDetailPanel, VendorOrdersTable)
│   │   │   └── templates/ (OrderDetailTemplate, VendorOrdersTemplate)
│   │   │
│   │   ├── products/                # Atomic Design
│   │   │   ├── atoms/ (BulkCounter, ProductStatusBadge)
│   │   │   ├── molecules/ (BulkActionBar, CsvDropzone, ProductRowActions)
│   │   │   ├── organisms/ (CsvImportDialog, DuplicateDialog, ProductListTable)
│   │   │   ├── templates/ (ProductListTemplate)
│   │   │   ├── ProductForm.tsx, ProductCard.tsx, ProductGrid.tsx,
│   │   │   │   FilterSidebar.tsx, ProductGallery.tsx, ProductImageUpload.tsx,
│   │   │   │   VariantEditor.tsx, PriceInput.tsx, StatusBadge.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── payouts/
│   │   │   ├── atoms/ (PayoutMethodIcon, PayoutStatusBadge)
│   │   │   ├── molecules/ (PayoutBalanceCard, PayoutHistoryItem)
│   │   │   └── organisms/ (PayoutHistoryList, PayoutRequestDialog)
│   │   │
│   │   ├── returns/
│   │   │   ├── CustomerReturnCard.tsx, ReturnDetailSheet.tsx,
│   │   │   │   ReturnReasonBadge.tsx, ReturnRequestForm.tsx,
│   │   │   │   ReturnStatusBadge.tsx, VendorReturnTable.tsx
│   │   │
│   │   ├── reviews/                 # Atomic Design
│   │   │   ├── atoms/ (StarRating, ReviewStatusBadge)
│   │   │   ├── molecules/ (ReviewCard, ReviewForm, ReviewStats)
│   │   │   ├── organisms/ (ProductReviewList, VendorReviewsTable)
│   │   │   └── index.ts
│   │   │
│   │   ├── store/
│   │   │   ├── CategoryCard.tsx, StoreCard.tsx
│   │   │   ├── StoreThemeProvider.tsx   # CSS variable injection
│   │   │   └── ThemePreview.tsx         # Visual theme selector
│   │   │
│   │   ├── checkout/
│   │   │   ├── AddressForm.tsx
│   │   │   └── CouponInput.tsx
│   │   └── icons/
│   │       └── GoogleIcon.tsx
│   │
│   ├── hooks/
│   │   ├── useCurrentUser.ts
│   │   ├── useCart.ts
│   │   ├── useBulkSelection.ts
│   │   ├── useNotifications.ts
│   │   ├── usePayouts.ts
│   │   ├── useInvoiceDownload.tsx
│   │   └── use-mobile.ts
│   │
│   ├── lib/
│   │   ├── auth-client.ts
│   │   ├── auth-server.ts
│   │   ├── utils.ts
│   │   ├── format.ts                # formatPrice, formatDate, formatRelative
│   │   ├── csv-export.ts            # CSV export utility
│   │   ├── payment-queue.ts         # Multi-store payment queue (localStorage)
│   │   ├── order-helpers.ts         # Status configs, timeline, date formatting
│   │   ├── themes.ts                # THEME_PRESETS for frontend
│   │   └── validations/
│   │       └── vendor.ts            # Zod schemas for vendor forms
│   │
│   ├── constants/
│   │   ├── routes.ts                # All app routes (source of truth)
│   │   ├── countries.ts             # SUPPORTED_COUNTRIES array
│   │   ├── paymentMethods.ts        # Moneroo payment methods config
│   │   ├── subscriptionPlans.ts     # Free/Pro/Business plans
│   │   ├── orderStatuses.ts         # Order status config
│   │   └── vendor-nav.ts            # Vendor sidebar navigation items
│   │
│   ├── providers/
│   │   └── CartProvider.tsx          # React Context + localStorage cart
│   │
│   ├── middleware.ts                 # Auth middleware for protected routes
│   │
│   └── types/
│       ├── index.ts
│       └── cart.ts
│
├── e2e/fixtures/                     # Playwright E2E test fixtures
└── scripts/                          # Build/deploy scripts
```

---

## Database Schema

### 14 Tables — Phase 0 + Phase 1

| # | Table | Purpose | Key Indexes |
|---|-------|---------|-------------|
| 1 | `users` | All users (customer, vendor, admin) | `by_email`, `by_role` |
| 2 | `stores` | Vendor shops | `by_slug`, `by_owner`, `by_status`, `by_subscription` |
| 3 | `categories` | Product categories (2-level hierarchy) | `by_slug`, `by_parent`, `by_sort` |
| 4 | `products` | Product catalog | `by_store`, `by_slug`, `by_category`, `by_status`, `by_store_active` + full-text `search_title` |
| 5 | `product_variants` | Size/color variants | `by_product`, `by_store` |
| 6 | `orders` | Orders with embedded items | `by_store`, `by_customer`, `by_order_number`, `by_status`, `by_payment_status` |
| 7 | `transactions` | Financial ledger (IMMUTABLE) | `by_store`, `by_type`, `by_order` |
| 8 | `reviews` | Product reviews | `by_product`, `by_store`, `by_customer` |
| 9 | `coupons` | Promo codes per store | `by_store`, `by_code` |
| 10 | `messages` | Vendor-customer messaging | `by_thread`, `by_receiver` |
| 11 | `notifications` | In-app + email notifications | `by_user_unread` |
| 12 | `payouts` | Vendor withdrawal requests | `by_store`, `by_status` |
| 13 | `return_requests` | Customer return/refund requests | `by_customer`, `by_store`, `by_order`, `by_status` |
| **14** | **`ad_spaces`** | **Ad slot definitions (8 types)** | **`by_slot_id`, `by_active`** |
| **15** | **`ad_bookings`** | **Ad reservations with queue system** | **`by_slot`, `by_store`, `by_status`, `by_active_slot`, `by_period`** |

### Key Data Rules

- All amounts in **centimes** (integers). XOF: 5000 XOF = 500000 centimes
- All timestamps in **Unix milliseconds** (`Date.now()`)
- Commission rates in **basis points** (500 = 5%)
- Slugs are **unique** and auto-generated with collision resolution
- Transactions are **IMMUTABLE** — never update, create reversals instead
- Order items are **embedded** (snapshot at time of order)
- Ad booking priority: Admin (100) > Vendor paid (50) > Queued (10) > Fallback (0)

### New Tables Detail — Phase 1

#### return_requests

```
return_requests {
  order_id: Id<"orders">
  customer_id: Id<"users">
  store_id: Id<"stores">
  reason: "defective" | "wrong_item" | "not_as_described" | "changed_mind" | "other"
  description: string
  images: string[]
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled"
  refund_amount?: number        # centimes
  admin_notes?: string
  resolved_at?: number
  updated_at: number
}
```

#### ad_spaces

```
ad_spaces {
  slot_id: string               # "hero_main", "mid_banner", etc.
  name: string                  # "Héro Principal (Carrousel)"
  format: string                # "banner" | "card" | "logo" | "spotlight"
  width: number                 # px
  height: number                # px
  max_slots: number             # concurrent ads (rotation)
  base_price_daily: number      # centimes/day
  base_price_weekly: number
  base_price_monthly: number
  demand_multiplier: number     # 1.0 = normal, up to 5.0
  peak_periods?: [{name, starts_at, ends_at, multiplier}]
  is_active: boolean
  sort_order: number
  updated_at: number
}
```

#### ad_bookings

```
ad_bookings {
  ad_space_id: Id<"ad_spaces">
  slot_id: string               # denormalized
  store_id: Id<"stores">
  booked_by: Id<"users">
  content_type: "product" | "store" | "banner" | "promotion"
  product_id?: Id<"products">
  image_url?: string
  title?: string
  subtitle?: string
  cta_text?: string
  cta_link?: string
  background_color?: string
  starts_at: number
  ends_at: number
  total_price: number           # centimes, calculated at booking
  currency: string
  source: "vendor" | "admin"
  priority: number              # 100=admin, 50=paid, 10=queued, 0=fallback
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled" | "queued"
  payment_status: "unpaid" | "paid" | "refunded" | "waived"
  transaction_id?: Id<"transactions">
  impressions: number
  clicks: number
  admin_notes?: string
  updated_at: number
}
```

---

## Backend — Convex Functions Reference

### HTTP Actions (`convex/http.ts`)

| Path | Method | Handler | Purpose |
|------|--------|---------|---------|
| `/api/auth/*` | ALL | Better Auth | Authentication routes |
| `/webhooks/moneroo` | POST | `handleMonerooWebhook` | Unified: order + payout + ad payments |

### New Functions — Phase 1

#### Ads (`convex/ads/`)

| Type | Function | Description |
|------|----------|-------------|
| Query | `getActiveAdsForSlot` | Active ads for a slot (public, by priority) |
| Query | `listAvailableSpaces` | All spaces with availability info |
| Query | `listAllBookings` | Admin: all bookings with filters |
| Query | `listMyBookings` | Vendor: own bookings with stats |
| Query | `previewPrice` | Calculate price preview for dates |
| Query | `getBookingById` | Single booking lookup |
| Mutation | `createBooking` | Vendor books a slot (auto-queue if full) |
| Mutation | `adminCreateBooking` | Admin override (priority 100, skip queue) |
| Mutation | `confirmBooking` | Admin confirms after payment |
| Mutation | `cancelBooking` | Admin cancels (auto-refund if paid) |
| Mutation | `trackInteraction` | Increment impressions or clicks |
| Mutation | `updateDemandMultiplier` | Admin adjusts pricing multiplier |
| Mutation | `addPeakPeriod` | Admin adds seasonal pricing |
| Mutation | `setPaymentReference` | Store Moneroo reference |
| Mutation | `seedAdSpaces` | Initialize 8 ad slots |
| Action | `initiateAdPayment` | Moneroo payment for ad booking |

#### Reviews (`convex/reviews/`)

| Type | Function | Description |
|------|----------|-------------|
| Query | `listByProduct` | Published reviews for a product (public) |
| Query | `getProductStats` | Average rating + distribution |
| Query | `listByStore` | All reviews for vendor dashboard |
| Query | `canReview` | Check eligibility (delivered order, no duplicate) |
| Mutation | `create` | Customer posts review (auto-publish after 24h) |
| Mutation | `reply` | Vendor replies to review |
| Mutation | `flag` | Any user flags review (unpublishes) |
| Mutation | `remove` | Admin deletes review |
| Mutation | `setPublished` | Admin/vendor toggle publish |

#### Analytics (`convex/analytics/`)

| Type | Function | Description |
|------|----------|-------------|
| Query | `getSalesOverview` | KPIs with period comparison (revenue, orders, AOV, conversion) |
| Query | `getTopProducts` | Top sellers by revenue or quantity |
| Query | `getCustomerInsights` | New vs returning, top buyers |
| Query | `getRevenueByCategoryChart` | Revenue breakdown by category |
| Query | `getSalesChart` | Time-series chart data |

#### Finance (`convex/finance/`)

| Type | Function | Description |
|------|----------|-------------|
| Query | `getFinanceDashboard` | Balance, revenue, pending, KPIs |
| Query | `getTransactions` | Paginated transaction history |
| Query | `getInvoiceData` | Invoice data for PDF generation |
| Query | `getMarginAnalysis` | Product margin analysis |

#### Returns (`convex/returns/`)

| Type | Function | Description |
|------|----------|-------------|
| Query | `listByCustomer` | Customer's return requests |
| Query | `listByStore` | Vendor's return requests |
| Mutation | `createReturn` | Customer requests return (delivered orders only) |
| Mutation | `approveReturn` | Vendor approves |
| Mutation | `rejectReturn` | Vendor rejects with reason |
| Mutation | `completeReturn` | Vendor marks refund completed |

#### Notifications (`convex/notifications/`)

| Type | Function | Description |
|------|----------|-------------|
| Query | `getNotifications` | User's notifications (paginated) |
| Query | `unreadCount` | Badge count |
| Mutation | `markRead` | Mark single notification read |
| Mutation | `markAllRead` | Mark all as read |

Notification types: `order_new`, `order_status`, `low_stock`, `payment`, `payout`, `return_status`, `new_review`, `system`, `promo`

#### Stores — New Functions

| Type | Function | Description |
|------|----------|-------------|
| Query | `getFeaturedStores` | Top stores by rating + orders |
| Query | `getMarketplaceStats` | Total stores, products, orders, countries |
| Mutation | `updateStoreTheme` | Set theme_id + primary_color |

---

## Ad Space System

### 8 Slot Types (Homepage Layout)

| Slot ID | Position | Format | Max Slots | Base Price/Day (XOF) |
|---------|----------|--------|-----------|---------------------|
| `top_banner` | Promo bar at top | 1200×40 | 1 | 5,000 |
| `hero_main` | Main carousel | 760×400 | 3 (rotate) | 15,000 |
| `hero_side` | Right of hero | 400×400 | 2 (rotate) | 10,000 |
| `hero_sub` | 4 cards under hero | 280×180 | 4 | 3,000 |
| `deals_featured` | Sponsored in deals grid | card | 6 | 2,000 |
| `mid_banner` | Full-width mid-page | 1200×200 | 1 | 8,000 |
| `brands_row` | Popular brands logos | 150×80 | 8 | 1,000 |
| `product_spotlight` | Full-width product feature | 1200×300 | 1 | 12,000 |

### Priority Queue System

```
Admin Override (100) → Always displayed, skip queue
Vendor Paid (50)     → Displayed if slot available
Queued (10)          → Waiting for slot to free up
Fallback (0)         → Organic content when no ads
```

Admin bookings go directly to `status: "active"` — no approval needed.

### Dynamic Pricing

`final_price = base_price × duration_factor × max(demand_multiplier, peak_multiplier)`

Peak periods (e.g., Black Friday, holidays) have their own multipliers set by admin.

### Booking Lifecycle

```
Vendor books → "pending" → pays via Moneroo → "confirmed"
                                                    ↓
Cron (15min) checks starts_at → "active" (displaying)
                                                    ↓
Cron checks ends_at → "completed" → promote queued bookings
```

### Tracking

Every ad-enabled component wraps content in `<AdSlotWrapper>` which tracks impressions (on mount) and clicks (on interaction). CTR calculated as `clicks / impressions × 100`.

---

## Review System

### Rules

- Only customers with `status: "delivered"` orders can post reviews
- One review per product per order (no duplicates)
- `is_published = false` on creation → auto-published after 24h if not flagged
- Vendor can reply (max 1000 chars, visible publicly)
- Any user can flag (removes from public view)
- Admin can delete or toggle publish

### Rating Aggregation

On every review create/delete/flag/publish:
1. Recalculate product `avg_rating` and `review_count`
2. Recalculate store `avg_rating`
3. Only count `is_published = true && flagged = false` reviews

---

## Storefront Theme System

### 3 Presets

| Theme ID | Name | Primary Color | Style |
|----------|------|---------------|-------|
| `default` | Classique | #2563EB (blue) | Shadow cards, 0.5rem radius |
| `modern` | Minimal | #18181B (black) | Border cards, 0.25rem radius |
| `classic` | Vibrant | #EA580C (orange) | Shadow cards, 0.75rem radius |

### Implementation

- `StoreThemeProvider` wraps store public pages
- Injects CSS variables (`--store-primary`, `--store-background`, etc.)
- Vendor can override primary color with custom hex
- Stored in `stores.theme_id` + `stores.primary_color`

---

## Notification System

### Channels

Phase 1 uses **in-app + email** only (no push/SMS).

### Dispatch Pattern

```typescript
// In any mutation that triggers a notification:
await dispatchNotification(ctx, {
  recipientId: user._id,
  recipientEmail: user.email,
  type: "new_review",
  data: { vendorName, customerName, productTitle, rating },
});
```

This creates an in-app notification AND sends an email via Resend.

### In-App UI

`NotificationDropdown` in navbar shows unread count badge + dropdown list. Full notification page at `/notifications` (customer) and `/vendor/notifications` (vendor).

---

## Returns & Refunds

### Eligibility

Only orders with `status: "delivered"` can have return requests.

### Flow

```
Customer requests → "pending"
Vendor approves → "approved" (with refund_amount)
Vendor rejects → "rejected" (with reason)
Vendor completes → "completed" (refund processed)
Customer cancels → "cancelled"
```

### Refund

When return is completed, the system creates a `refund` transaction and adjusts the store balance.

---

## Analytics System

### Vendor Dashboard (`/vendor/analytics`)

Organized with Atomic Design pattern:

- **PeriodSelector**: 7d, 30d, 90d, 12m with comparison to previous period
- **SalesOverviewCards**: Revenue, orders, AOV, conversion rate with trend indicators
- **SalesChart**: Time-series line/bar chart (recharts)
- **TopProductsTable**: Top 10 products by revenue or quantity
- **RevenueByCategoryChart**: Pie/bar breakdown by category
- **CustomerInsightsPanel**: New vs returning customers, top buyers

---

## Financial Tools

### Dashboard (`/vendor/finance`)

- **BalanceCard**: Available balance, pending balance, total revenue
- **FinancialKpiGrid**: Revenue, fees, net income, payout total
- **RevenueChart**: Monthly revenue trend (recharts)
- **TransactionTable**: Paginated, filterable transaction history
- **MarginBar**: Per-product margin analysis (cost_price vs selling price)

### Invoice Generation (`/vendor/finance/invoices`)

- PDF generation via `@react-pdf/renderer`
- Vendor info form (tax ID, address) collected via UI
- Invoice contains: items, prices, commission, net amount, dates

### CSV Export

`csv-export.ts` utility generates downloadable CSV files for transactions, products, and orders.

---

## Email System

### 13 Templates

| Template | Trigger | Recipient |
|----------|---------|-----------|
| `VerifyEmail` | Registration | Client |
| `ResetPassword` | Password reset | Client |
| `OrderConfirmation` | Payment confirmed | Client |
| `NewOrder` | Payment confirmed | Vendor |
| `OrderShipped` | Vendor ships | Client |
| `OrderDelivered` | Delivery confirmed | Client |
| `OrderCancelled` | Cancellation | Client |
| `OrderStatusUpdate` | Any status change | Client |
| `LowStockAlert` | Stock < threshold | Vendor |
| `PayoutCompleted` | Payout processed | Vendor |
| `ReturnStatusUpdate` | Return status change | Client |
| `NewReview` | New review posted | Vendor |
| `OrderItemsTable` | Shared component | (reused in other templates) |

---

## Cron Jobs

| Name | Interval | Handler | Purpose |
|------|----------|---------|---------|
| `auto-deliver-orders` | 24h | `autoDeliverOrders` | Auto-confirm delivery after 7 days shipped |
| `release-pending-balance` | 1h | `releasePendingBalance` | Credit store balance 48h after delivery |
| `check-low-stock` | 4h | `checkLowStock` | Send alerts for products below threshold |
| `auto-publish-reviews` | 1h | `autoPublishReviews` | Publish reviews after 24h if not flagged |
| `process-ad-bookings` | 15min | `processAdBookings` | Activate/complete/promote ad bookings |

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
| `customer` | Storefront, orders, profile, returns | Default on registration |
| `vendor` | Customer + dashboard, products, store, analytics, finance, ads | Via `becomeVendor` mutation |
| `admin` | Everything + user management, category CRUD, ad management, payouts | Manual DB assignment |

---

## Development Phases

### Phase 0 — Foundation ✅ COMPLETED

| Step | Scope | Status |
|------|-------|--------|
| 0.1 | Project Bootstrap | ✅ |
| 0.2 | Database Schema (12 tables) | ✅ |
| 0.3 | Auth (Better Auth + Google OAuth) | ✅ |
| 0.4 | User System (RBAC, AuthGuard) | ✅ |
| 0.5 | Store CRUD (onboarding + settings) | ✅ |
| 0.6 | Categories & Tags | ✅ |
| 0.7 | Product CRUD (form, images, variants) | ✅ |
| 0.8 | Inventory Management | ✅ |
| 0.9 | Storefront (backend + 6 pages) | ✅ |
| 0.10 | Cart & Checkout | ✅ |
| 0.11 | Payment Integration (Moneroo) | ✅ |
| 0.12 | Order Management | ✅ |
| 0.13 | Profile & Store Settings | ✅ |
| 0.14 | Transactional Emails (6 templates) | ✅ |

### Phase 1 — Vendor Empowerment ✅ COMPLETED

| Step | Scope | Status |
|------|-------|--------|
| 1.1 | Advanced Products (CSV import, duplication, bulk actions) | ✅ |
| 1.2 | Order Tracking & Logistics (timeline, auto-delivery +7d) | ✅ |
| 1.3 | Returns & Refunds (full workflow) | ✅ |
| 1.4 | Notifications (in-app + email, 4 templates) | ✅ |
| 1.5 | Analytics Dashboard (period comparison, charts) | ✅ |
| 1.6 | Financial Tools (invoices, margin, CSV export) | ✅ |
| 1.7 | Payouts (Moneroo withdrawal, vendor UI) | ✅ |
| 1.8 | Infrastructure (unified webhooks, cron jobs) | ✅ |
| 1.9 | Storefront Themes (3 presets, CSS variables, vendor settings) | ✅ |
| 1.10 | Reviews & Ratings (CRUD, auto-publish, vendor reply) | ✅ |

### Storefront Refactor — Ad System + Homepage Redesign ✅ COMPLETED

| Part | Scope | Status |
|------|-------|--------|
| A | Ad Space System (schema, 8 slots, queue, dynamic pricing, cron) | ✅ |
| B | Homepage Redesign (16 sections, Atomic Design, ad integration) | ✅ |
| C | Vendor Ads Page, Moneroo Ad Payment, Header/Footer/SuggestToday, Admin Ads | ✅ |

### Phase 2 — AI Layer 1 (NEXT)

- Content optimization (product descriptions, SEO)
- Stock predictions
- AI chatbot (customer support)
- Semantic caching for API cost reduction

---

## Known TypeScript Gotchas

### Multiline Generics Break on Copy-Paste

```typescript
// ❌ BREAKS — multiline generic
const [state, setState] = useState<
  Record<string, StoreCoupon>
>({});

// ✅ WORKS — extract type + single-line generic
type StoreCouponMap = Record<string, StoreCoupon>;
const [state, setState] = useState<StoreCouponMap>({});
```

### Convex Cannot Import from `src/`

```typescript
// ❌ FAILS
import { COMMISSION_RATES } from "@/constants/plans";

// ✅ WORKS
import { COMMISSION_RATES } from "../lib/constants";
```

### Id Types in Convex

Always use `v.id("tableName")` for foreign keys, never `v.string()`.

### date-fns Locale Import

```typescript
// ❌ WRONG (breaks tree-shaking)
import { fr } from "date-fns/locale";

// ✅ CORRECT
import { fr } from "date-fns/locale/fr";
```

---

## Quick Start

```bash
# 1. Clone & install
git clone <repo>
cd pixelmart
pnpm install

# 2. Setup Convex
npx convex dev

# 3. Set environment variables
npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
npx convex env set SITE_URL=http://localhost:3000
npx convex env set RESEND_API_KEY=re_xxx
npx convex env set GOOGLE_CLIENT_ID=xxx
npx convex env set GOOGLE_CLIENT_SECRET=xxx
npx convex env set MONEROO_SECRET_KEY=sk_xxx
npx convex env set MONEROO_WEBHOOK_SECRET=whsec_xxx

# 4. Run dev
pnpm dev             # Next.js on :3000
npx convex dev       # Convex backend (separate terminal)
pnpm email:dev       # Email preview on :3001 (optional)

# 5. Seed data
# From Convex dashboard:
# - Run categories.seed.seedCategories()
# - Run ads.seed.seedAdSpaces()
```

---

## Moneroo Webhook URL

Configure in Moneroo dashboard:

```
https://<deployment-name>.convex.site/webhooks/moneroo
```

Handles three payment types via `metadata.type`:
- `order_payment` — standard checkout
- `payout` — vendor withdrawal
- `ad_payment` — ad space booking

---

## Stats (as of Phase 1 completion)

- **~350+ files** across ~140 directories
- **14 Convex domain modules** (users, stores, products, orders, payments, payouts, categories, coupons, returns, reviews, notifications, analytics, finance, ads)
- **13 email templates** (react-email)
- **5 cron jobs** (auto-delivery, balance release, low stock, review publish, ad lifecycle)
- **8 ad slot types** with dynamic pricing
- **3 storefront themes** with CSS variable injection
- **16 homepage sections** (Atomic Design organisms)

---

*Last updated: March 2026 — Phase 0 + Phase 1 + Storefront Refactor complete.*
