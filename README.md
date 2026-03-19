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

# PIXEL-MART — Technical Documentation (Part 2)

> Suite du document principal — Système de Livraison + TODO

---

## Table of Contents (Part 2)

25. [Delivery System](#delivery-system)
26. [Feature Flags](#feature-flags)
27. [Geocoding (OpenStreetMap)](#geocoding-openstreetmap)
28. [Delivery Pricing Rules](#delivery-pricing-rules)
29. [Delivery Batch Workflow](#delivery-batch-workflow)
30. [Cash on Delivery (COD) Flow](#cash-on-delivery-cod-flow)
31. [New Components — Delivery](#new-components--delivery)
32. [New Hooks](#new-hooks)
33. [Updated Schema Fields](#updated-schema-fields)
34. [PDF Generation](#pdf-generation)
35. [TODO — Pending Implementation](#todo--pending-implementation)
36. [Complete File Index](#complete-file-index)

---

## Delivery System

### Overview

Pixel-Mart uses **OpenStreetMap Nominatim** for address geocoding (no static zones). Distance is calculated client-side using the **Haversine formula**, and delivery fees are computed based on distance tiers, delivery type, and weight.

**Key Architecture Decisions:**
- **NO static delivery zones** — replaced by GPS-based distance calculation
- **Nominatim API** restricted to Benin (`countrycode=bj`), rate-limited 1 req/sec
- **Distance calculation happens client-side** — never call Nominatim in Convex mutations
- **Default collection point**: Centre de Cotonou (`lat: 6.3654, lon: 2.4183`)
- All fees in **centimes** (1 XOF = 100 centimes)

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                       CHECKOUT FLOW                               │
│                                                                   │
│  AddressAutocomplete ──► Nominatim API ──► GeocodingResult       │
│        (debounced 400ms)                    {lat, lon, city}     │
│                               │                                   │
│                               ▼                                   │
│  DeliveryDistanceCalculator ──► Haversine ──► distanceKm         │
│        (vs collection point)                                      │
│                               │                                   │
│                               ▼                                   │
│  calculateDeliveryFee() ──► fee (centimes)                       │
│        (type + distance + weight + night)                        │
│                               │                                   │
│                               ▼                                   │
│  DeliverySection ──► DeliveryConfig ──► createOrder()            │
│        {lat, lon, distanceKm, fee, type, paymentMode}            │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    VENDOR DELIVERY WORKFLOW                       │
│                                                                   │
│  Order "processing" ──► markReadyForDelivery() ──► "ready"       │
│                               │                                   │
│                               ▼                                   │
│  Select orders ──► createBatch() ──► LOT-YYYY-XXXX               │
│                               │                                   │
│                               ▼                                   │
│  Download PDF ──► transmitBatch() ──► status: "transmitted"      │
│                               │                                   │
│                               ▼                                   │
│  Admin assigns ──► Delivery ──► Client confirmDelivery()         │
│                               │                                   │
│                               ▼                                   │
│  48h later ──► Cron releases pending_balance ──► store.balance   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Feature Flags

```typescript
// filepath: src/constants/features.ts

export const FEATURES = {
  /**
   * Paiement à la livraison (Cash on Delivery)
   * Désactivé en attendant l'implémentation du flux financier COD.
   */
  COD_ENABLED: false,

  /**
   * Système de livraison par lots
   * Activé — gestion des lots de livraison pour les vendeurs.
   */
  DELIVERY_BATCHES_ENABLED: true,

  /**
   * Calcul de distance OpenStreetMap
   * Activé — remplace les zones statiques par le calcul GPS.
   */
  OSM_DELIVERY_ENABLED: true,
} as const;

export type FeatureFlag = keyof typeof FEATURES;
```

### Usage Pattern

```tsx
import { FEATURES } from "@/constants/features";

// Conditional rendering
{FEATURES.COD_ENABLED && (
  <PaymentModeSelector ... />
)}

// Force default value when disabled
useEffect(() => {
  if (!FEATURES.COD_ENABLED && value.paymentMode === "cod") {
    onChange({ ...value, paymentMode: "online" });
  }
}, [value, onChange]);
```

---

## Geocoding (OpenStreetMap)

### Library: `src/lib/geocoding.ts`

```typescript
// ─── Types ───────────────────────────────────────────────────

export interface GeocodingResult {
  placeId: string;
  displayName: string;
  lat: number;
  lon: number;
  city?: string;
  country?: string;
}

// ─── Constants ───────────────────────────────────────────────

export const DEFAULT_COLLECTION_POINT = {
  lat: 6.3654,  // Centre de Cotonou
  lon: 2.4183,
};

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

// ─── Functions ───────────────────────────────────────────────

/** Search addresses via Nominatim (rate limit: 1 req/sec) */
export async function searchAddress(
  query: string,
  countryCode: string = "bj",
  signal?: AbortSignal
): Promise<GeocodingResult[]>

/** Reverse geocode coordinates to address */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<GeocodingResult | null>

/** Calculate distance between two points (Haversine formula) */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number  // Returns km

/** Calculate distance from collection point */
export function calculateDeliveryDistance(
  deliveryLat: number,
  deliveryLon: number
): number  // Returns km
```

### Rate Limiting Rules

| Constraint | Value | Implementation |
|------------|-------|----------------|
| Max requests | 1/second | Debounce 400ms in `useAddressAutocomplete` |
| User-Agent | Required | `Pixel-Mart/1.0 (contact@pixelmart.bj)` |
| Country restriction | Benin only | `countrycode=bj` parameter |
| Abort on new search | Yes | `AbortController` in hook |

---

## Delivery Pricing Rules

### Tariff Grid (All amounts in XOF, stored as centimes)

```typescript
// filepath: convex/delivery/constants.ts

// ─── Tarifs en centimes ───────────────────────────────────────

export const DELIVERY_PRICING = {
  // Standard delivery
  STANDARD: {
    BASE_FEE_1_5KM: 60000,        // 600 FCFA fixed for 1-5 km
    RATE_PER_KM_6PLUS: 17000,     // 170 FCFA/km for 6+ km
  },

  // Urgent / Fragile delivery
  URGENT_FRAGILE: {
    BASE_FEE_1_5KM: 70000,        // 700 FCFA fixed for 1-5 km
    RATE_PER_KM_6_10: 20000,      // 200 FCFA/km for 6-10 km
    RATE_PER_KM_11PLUS: 15000,    // 150 FCFA/km for 11+ km
  },

  // Night delivery (21h - 06h)
  NIGHT: {
    RATE_PER_KM: 25000,           // 250 FCFA/km all tiers
    START_HOUR: 21,
    END_HOUR: 6,
  },

  // Weight surcharge (over 20kg)
  WEIGHT: {
    FREE_KG: 20,
    RATE_PER_KG: 5000,            // 50 FCFA per additional kg
  },
} as const;
```

### Calculation Formula

```typescript
export function calculateDeliveryFee(
  distanceKm: number,
  deliveryType: "standard" | "urgent" | "fragile",
  weightKg: number = 0,
  isNight: boolean = false
): number {
  let baseFee = 0;

  // 1. Night rate override
  if (isNight) {
    baseFee = Math.ceil(distanceKm) * DELIVERY_PRICING.NIGHT.RATE_PER_KM;
  }
  // 2. Standard pricing
  else if (deliveryType === "standard") {
    if (distanceKm <= 5) {
      baseFee = DELIVERY_PRICING.STANDARD.BASE_FEE_1_5KM;
    } else {
      baseFee = Math.ceil(distanceKm) * DELIVERY_PRICING.STANDARD.RATE_PER_KM_6PLUS;
    }
  }
  // 3. Urgent/Fragile pricing
  else {
    if (distanceKm <= 5) {
      baseFee = DELIVERY_PRICING.URGENT_FRAGILE.BASE_FEE_1_5KM;
    } else if (distanceKm <= 10) {
      baseFee = Math.ceil(distanceKm) * DELIVERY_PRICING.URGENT_FRAGILE.RATE_PER_KM_6_10;
    } else {
      baseFee = Math.ceil(distanceKm) * DELIVERY_PRICING.URGENT_FRAGILE.RATE_PER_KM_11PLUS;
    }
  }

  // 4. Weight surcharge
  const extraWeight = Math.max(0, weightKg - DELIVERY_PRICING.WEIGHT.FREE_KG);
  const weightSurcharge = Math.ceil(extraWeight) * DELIVERY_PRICING.WEIGHT.RATE_PER_KG;

  return baseFee + weightSurcharge;
}
```

### Price Examples

| Distance | Type | Weight | Night | Fee (XOF) |
|----------|------|--------|-------|-----------|
| 3 km | Standard | 5 kg | No | 600 |
| 3 km | Urgent | 5 kg | No | 700 |
| 8 km | Standard | 10 kg | No | 1,360 (8×170) |
| 8 km | Urgent | 10 kg | No | 1,600 (8×200) |
| 15 km | Standard | 10 kg | No | 2,550 (15×170) |
| 15 km | Urgent | 10 kg | No | 2,250 (15×150) |
| 10 km | Standard | 25 kg | No | 1,950 (10×170 + 5×50) |
| 10 km | Standard | 10 kg | Yes | 2,500 (10×250) |

---

## Delivery Batch Workflow

### Batch Number Format

`LOT-YYYY-XXXX` where:
- `YYYY` = current year
- `XXXX` = auto-incremented counter (reset yearly)

Example: `LOT-2026-0001`, `LOT-2026-0042`

### Status Flow

```
pending ──► transmitted ──► assigned ──► in_progress ──► completed
   │                                                        │
   └────────────────────► cancelled ◄───────────────────────┘
```

| Status | Meaning | Actions |
|--------|---------|---------|
| `pending` | Lot created, not yet transmitted | Transmit, Cancel, Add/Remove orders |
| `transmitted` | PDF sent to delivery partner | Assign |
| `assigned` | Assigned to delivery person | Start delivery |
| `in_progress` | Deliveries in progress | Mark individual orders delivered |
| `completed` | All orders delivered | Archive |
| `cancelled` | Lot cancelled | — |

### Backend Functions

```typescript
// convex/delivery/mutations.ts

/** Mark order ready for delivery */
export const markReadyForDelivery = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    // Updates order.status to "ready_for_delivery"
    // Sets order.ready_for_delivery = true
    // Sets order.ready_at = Date.now()
  },
});

/** Create a delivery batch from selected orders */
export const createBatch = mutation({
  args: {
    orderIds: v.array(v.id("orders")),
    groupingType: v.optional(v.union(v.literal("zone"), v.literal("manual"))),
  },
  handler: async (ctx, { orderIds, groupingType }) => {
    // Validates all orders belong to vendor
    // Validates all orders are "ready_for_delivery"
    // Generates batch_number (LOT-YYYY-XXXX)
    // Creates delivery_batch record
    // Updates all orders with batch_id
    // Returns batchId
  },
});

/** Transmit batch to delivery partner */
export const transmitBatch = mutation({
  args: { batchId: v.id("delivery_batches") },
  handler: async (ctx, { batchId }) => {
    // Updates batch status to "transmitted"
    // Sets transmitted_at = Date.now()
  },
});

/** Cancel a batch */
export const cancelBatch = mutation({
  args: { batchId: v.id("delivery_batches") },
  handler: async (ctx, { batchId }) => {
    // Updates batch status to "cancelled"
    // Removes batch_id from all orders
    // Reverts orders to "processing" status
  },
});
```

---

## Cash on Delivery (COD) Flow

> **⚠️ STATUS: DESIGNED BUT NOT IMPLEMENTED**
> 
> COD is disabled via `FEATURES.COD_ENABLED = false` pending financial flow implementation.

### Designed Flow

```
1. CHECKOUT (COD selected)
   └─► createOrder()
       ├─► payment_status: "pending"
       ├─► status: "paid" (immediately, no Moneroo)
       └─► payment_method: "cod"

2. DELIVERY
   └─► Delivery person collects cash from customer
       └─► total_amount + delivery_fee

3. CLIENT CONFIRMATION
   └─► confirmDelivery()
       ├─► status: "delivered"
       ├─► payment_status: "paid"
       ├─► delivered_at: Date.now()
       └─► createSaleTransaction()
           └─► Credits vendor pending_balance (net amount)

4. BALANCE RELEASE (Cron, every hour)
   └─► processBalanceRelease()
       └─► After 48h: pending_balance → store.balance
```

### Pending Files to Create

| File | Purpose |
|------|---------|
| `convex/finance/mutations.ts` | `createSaleTransaction`, `releasePendingBalance` |
| `convex/finance/crons.ts` | `processBalanceRelease` handler |
| `convex/crons.ts` | Add hourly cron for balance release |

### Modified `confirmDelivery` Logic

```typescript
// convex/orders/mutations.ts — confirmDelivery (modified)

export const confirmDelivery = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);
    
    // Update order status
    await ctx.db.patch(orderId, {
      status: "delivered",
      delivered_at: Date.now(),
    });

    // If COD, mark payment as paid and create transaction
    if (order.payment_mode === "cod") {
      await ctx.db.patch(orderId, {
        payment_status: "paid",
      });
      
      // Create sale transaction (credits pending_balance)
      await ctx.runMutation(internal.finance.mutations.createSaleTransaction, {
        orderId,
        storeId: order.store_id,
        amount: order.total_amount - order.commission_amount,
      });
    }
  },
});
```

---

## New Components — Delivery

### Atomic Design Structure

```
src/components/
├── checkout/
│   ├── AddressAutocomplete.tsx      # OSM address search
│   ├── DeliveryDistanceCalculator.tsx # Distance + fee display
│   ├── DeliveryTypeSelector.tsx      # standard/urgent/fragile
│   ├── PaymentModeSelector.tsx       # online/cod (disabled via flag)
│   ├── DeliverySection.tsx           # Orchestrates all above
│   └── index.ts
│
├── delivery/
│   ├── atoms/
│   │   ├── BatchStatusBadge.tsx      # Badge with status color
│   │   ├── DeliveryTypeBadge.tsx     # standard/urgent/fragile badge
│   │   ├── PaymentModeBadge.tsx      # online/cod badge
│   │   └── index.ts
│   │
│   ├── molecules/
│   │   ├── ReadyOrderCard.tsx        # Order card in ready list
│   │   ├── ZoneGroupHeader.tsx       # Group header by zone/city
│   │   └── index.ts
│   │
│   ├── organisms/
│   │   ├── ReadyOrdersList.tsx       # Selectable list of ready orders
│   │   ├── BatchList.tsx             # List of batches
│   │   ├── BatchPDFDownloadButton.tsx # PDF download button
│   │   └── index.ts
│   │
│   └── pdf/
│       ├── DeliveryBatchPDF.tsx      # react-pdf template
│       └── index.ts
```

### Key Component Interfaces

```typescript
// DeliverySection — Main orchestrator
interface DeliveryConfig {
  deliveryLat?: number;
  deliveryLon?: number;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryDistanceKm?: number;
  deliveryFee?: number;  // centimes
  deliveryType: "standard" | "urgent" | "fragile";
  paymentMode: "online" | "cod";
  estimatedWeightKg?: number;
}

interface DeliverySectionProps {
  estimatedWeightKg?: number;
  value: DeliveryConfig;
  onChange: (config: DeliveryConfig) => void;
  addressError?: string;
}

// AddressAutocomplete — OSM search
interface AddressAutocompleteProps {
  label: string;
  placeholder?: string;
  countryCode?: string;  // default: "bj"
  value?: string;
  onSelect: (result: GeocodingResult) => void;
  error?: string;
  required?: boolean;
}

// DeliveryDistanceCalculator — Fee display
interface DeliveryDistanceCalculatorProps {
  selectedAddress: GeocodingResult | null;
  deliveryType: DeliveryType;
  weightKg?: number;
  onDistanceCalculated: (distanceKm: number, fee: number) => void;
}
```

---

## New Hooks

### `useAddressAutocomplete`

```typescript
// filepath: src/hooks/useAddressAutocomplete.ts

interface UseAddressAutocompleteOptions {
  countryCode?: string;
  debounceMs?: number;
}

interface UseAddressAutocompleteReturn {
  query: string;
  setQuery: (value: string) => void;
  results: GeocodingResult[];
  isLoading: boolean;
  error: string | null;
  selectResult: (result: GeocodingResult) => void;
  selectedResult: GeocodingResult | null;
  clearSelection: () => void;
}

export function useAddressAutocomplete(
  options?: UseAddressAutocompleteOptions
): UseAddressAutocompleteReturn
```

### `useDeliveryBatchPDF`

```typescript
// filepath: src/hooks/useDeliveryBatchPDF.tsx  (Note: .tsx for JSX)

interface UseDeliveryBatchPDFReturn {
  isGenerating: boolean;
  error: string | null;
  generatePDF: () => Promise<void>;
}

export function useDeliveryBatchPDF(
  batchId: Id<"delivery_batches">
): UseDeliveryBatchPDFReturn
```

---

## Updated Schema Fields

### `orders` Table — New Fields

```typescript
// Add after commission_amount in convex/schema.ts

// ─── Delivery Fields (OpenStreetMap) ─────────────────────────
delivery_lat: v.optional(v.number()),           // GPS latitude
delivery_lon: v.optional(v.number()),           // GPS longitude
delivery_distance_km: v.optional(v.number()),   // Calculated distance
delivery_type: v.optional(v.union(
  v.literal("standard"),
  v.literal("urgent"),
  v.literal("fragile")
)),
payment_mode: v.optional(v.union(
  v.literal("online"),
  v.literal("cod")
)),
delivery_fee: v.optional(v.number()),           // Fee in centimes
estimated_weight_kg: v.optional(v.number()),

// ─── Batch Fields ────────────────────────────────────────────
batch_id: v.optional(v.id("delivery_batches")),
ready_for_delivery: v.optional(v.boolean()),
ready_at: v.optional(v.number()),               // Unix ms

// ─── COD Balance Release ─────────────────────────────────────
balance_released: v.optional(v.boolean()),      // For 48h cron

// ─── New Indexes ─────────────────────────────────────────────
// .index("by_batch", ["batch_id"])
// .index("by_ready_for_delivery", ["store_id", "ready_for_delivery"])
```

### `delivery_batches` Table — New Table

```typescript
// convex/schema.ts — Add new table

delivery_batches: defineTable({
  batch_number: v.string(),                     // LOT-YYYY-XXXX
  store_id: v.id("stores"),
  created_by: v.id("users"),
  order_ids: v.array(v.id("orders")),
  order_count: v.number(),
  grouping_type: v.union(
    v.literal("zone"),
    v.literal("manual")
  ),
  status: v.union(
    v.literal("pending"),
    v.literal("transmitted"),
    v.literal("assigned"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  total_delivery_fee: v.number(),               // centimes
  currency: v.string(),                         // "XOF"
  pdf_url: v.optional(v.string()),
  
  // Timestamps
  created_at: v.number(),
  transmitted_at: v.optional(v.number()),
  assigned_at: v.optional(v.number()),
  started_at: v.optional(v.number()),
  completed_at: v.optional(v.number()),
  cancelled_at: v.optional(v.number()),
  updated_at: v.number(),
})
  .index("by_store", ["store_id"])
  .index("by_status", ["status"])
  .index("by_store_status", ["store_id", "status"])
  .index("by_batch_number", ["batch_number"]),
```

### Order Status Updates

```typescript
// src/constants/orderStatuses.ts — Add new statuses

export const ORDER_STATUSES = {
  // ... existing statuses ...
  ready_for_delivery: {
    label: "Prêt pour livraison",
    color: "cyan",
    icon: "Package",
    description: "Commande prête à être livrée",
  },
  delivery_failed: {
    label: "Échec livraison",
    color: "orange",
    icon: "AlertTriangle",
    description: "La livraison a échoué",
  },
} as const;
```

---

## PDF Generation

### DeliveryBatchPDF Template

```typescript
// filepath: src/components/delivery/pdf/DeliveryBatchPDF.tsx

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

interface DeliveryBatchPDFProps {
  batch: {
    batch_number: string;
    created_at: number;
    order_count: number;
    total_delivery_fee: number;
    store_name: string;
    store_phone?: string;
    store_address?: string;
  };
  orders: Array<{
    order_number: string;
    customer_name: string;
    customer_phone?: string;
    delivery_address: string;
    delivery_city?: string;
    delivery_type: string;
    payment_mode: string;
    total_amount: number;
    delivery_fee: number;
  }>;
  totalToCollect: number;  // For COD orders
}

// A4 format, professional styling
// Sections: Header, Store Info, Orders Table, Totals, Signatures
```

### PDF Contents

1. **Header**: Logo, batch number, date
2. **Store Info**: Name, phone, address
3. **Orders Table**: Order#, Customer, Address, Type, Payment, Amount
4. **Summary**: Total orders, total delivery fees, total to collect (COD)
5. **Signatures**: Delivery partner, vendor, spaces for signatures

---

## TODO — Pending Implementation

### 🔴 Critical (Block COD Activation)

| Priority | Task | Files | Notes |
|----------|------|-------|-------|
| P0 | **COD Financial Flow** | `convex/finance/mutations.ts` | `createSaleTransaction()`, `releasePendingBalance()` |
| P0 | **Balance Release Cron** | `convex/crons.ts`, `convex/crons_handlers.ts` | Process orders 48h after delivery |
| P0 | **Modify confirmDelivery** | `convex/orders/mutations.ts` | Call `createSaleTransaction` for COD |
| P0 | **Add balance_released field** | `convex/schema.ts` | Track which orders have been processed |

### 🟡 Important (Before Production)

| Priority | Task | Files | Notes |
|----------|------|-------|-------|
| P1 | **Deploy Schema** | — | `npx convex deploy` |
| P1 | **Checkout page wiring** | `src/app/(storefront)/checkout/page.tsx` | Verify `DeliverySection` integration |
| P1 | **Admin delivery dashboard** | `src/app/(admin)/admin/delivery/page.tsx` | View all batches, assign to delivery |
| P1 | **Handle delivery_failed** | `convex/delivery/mutations.ts` | Admin mutation to mark delivery failed |
| P1 | **Notifications** | `convex/notifications/send.ts` | Email/in-app when lot transmitted, assigned |

### 🟢 Nice to Have (Post-Launch)

| Priority | Task | Files | Notes |
|----------|------|-------|-------|
| P2 | **Delivery tracking page** | `src/app/(storefront)/track/[id]/page.tsx` | Public tracking with map |
| P2 | **SMS notifications** | — | Twilio/Africa's Talking integration |
| P2 | **Delivery person app** | — | Mobile app for delivery partners |
| P2 | **Route optimization** | — | OSRM or GraphHopper integration |
| P2 | **Multiple collection points** | `convex/schema.ts` | Per-store pickup locations |

### ⬜ Technical Debt

| Task | Files | Notes |
|------|-------|-------|
| Type sync pattern | All frontend components | Use `Doc<"table">["field"]` everywhere |
| Remove legacy AddressForm | `src/components/checkout/AddressForm.tsx` | Replaced by `AddressAutocomplete` |
| Test coverage | `e2e/delivery/` | Playwright tests for delivery flow |

---

## Complete File Index

### New Files Created (Delivery System)

```
convex/
├── delivery/
│   ├── constants.ts           # DELIVERY_PRICING, calculateDeliveryFee
│   ├── helpers.ts             # getNextBatchNumber, validateOrdersOwnership
│   ├── queries.ts             # listReadyForDelivery, listBatches, getBatchDetail
│   └── mutations.ts           # markReadyForDelivery, createBatch, transmitBatch

src/
├── constants/
│   ├── features.ts            # Feature flags (COD_ENABLED, etc.)
│   └── deliveryTypes.ts       # DELIVERY_TYPES, PAYMENT_MODES, BATCH_STATUSES
│
├── lib/
│   └── geocoding.ts           # Nominatim API, Haversine, DEFAULT_COLLECTION_POINT
│
├── hooks/
│   ├── useAddressAutocomplete.ts
│   └── useDeliveryBatchPDF.tsx
│
├── components/
│   ├── checkout/
│   │   ├── AddressAutocomplete.tsx
│   │   ├── DeliveryDistanceCalculator.tsx
│   │   ├── DeliveryTypeSelector.tsx
│   │   ├── PaymentModeSelector.tsx
│   │   ├── DeliverySection.tsx
│   │   └── index.ts
│   │
│   └── delivery/
│       ├── atoms/
│       │   ├── BatchStatusBadge.tsx
│       │   ├── DeliveryTypeBadge.tsx
│       │   ├── PaymentModeBadge.tsx
│       │   └── index.ts
│       ├── molecules/
│       │   ├── ReadyOrderCard.tsx
│       │   ├── ZoneGroupHeader.tsx
│       │   └── index.ts
│       ├── organisms/
│       │   ├── ReadyOrdersList.tsx
│       │   ├── BatchList.tsx
│       │   ├── BatchPDFDownloadButton.tsx
│       │   └── index.ts
│       └── pdf/
│           ├── DeliveryBatchPDF.tsx
│           └── index.ts
│
└── app/
    ├── (storefront)/
    │   ├── checkout/
    │   │   └── page.tsx                    # Updated with DeliverySection
    │   └── orders/
    │       └── [id]/
    │           └── page.tsx                # Updated with delivery confirmation
    │
    └── (vendor)/
        └── vendor/
            └── delivery/
                ├── page.tsx                # Delivery dashboard
                ├── [id]/
                │   ├── page.tsx            # Batch detail
                │   └── loading.tsx
                └── loading.tsx
```

### Modified Files

| File | Changes |
|------|---------|
| `convex/schema.ts` | Add `delivery_batches` table, update `orders` fields |
| `convex/orders/mutations.ts` | `createOrder` accepts delivery fields |
| `convex/orders/helpers.ts` | `assertValidTransition` with new statuses |
| `src/constants/orderStatuses.ts` | Add `ready_for_delivery`, `delivery_failed` |
| `src/lib/order-helpers.ts` | Update ORDER_STATUS_MAP |
| `src/components/orders/atoms/OrderStatusBadge.tsx` | Use `Doc<"orders">["status"]` |
| `src/components/orders/molecules/OrderStatusActions.tsx` | Handle new statuses |
| `src/components/orders/organisms/OrderDetailPanel.tsx` | Delivery info section |

---

## Architecture Reminders

- **All amounts in centimes** (700 FCFA = 70000 centimes)
- **All timestamps in Unix milliseconds** (`Date.now()`)
- **NEVER call Nominatim inside a Convex mutation** — calculate client-side
- **Type sync pattern**: `type OrderStatus = Doc<"orders">["status"]`
- **`useDeliveryBatchPDF` must be `.tsx`** (contains JSX for react-pdf)
- **Atomic Design**: atoms → molecules → organisms → templates
- **Rule F-01**: Every balance change MUST create a transaction in the same mutation
- **Transactions are IMMUTABLE** — never UPDATE, create a reversal instead
- **Commission formula**: `commission_amount = total_amount × commission_rate / 10000`
- **COD disabled via** `FEATURES.COD_ENABLED = false`

---

*Last updated: March 19, 2026 — Delivery System implementation complete, COD pending.*
