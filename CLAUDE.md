# PIXEL-MART — Claude Code Context

## Project Overview

**Pixel-Mart** is a multi-vendor e-commerce marketplace targeting West African markets (primarily Benin/Cotonou).

- **Currency**: XOF (Franc CFA) — all amounts stored in **centimes** (1 XOF = 100 centimes, but for XOF raw centimes = FCFA value — see Money section)
- **Users**: Customers, Vendors, Admins, Agents with full RBAC
- **Phase**: Phase 1 in progress (Phase 0 complete)
- **Locale**: French (fr-FR / fr-BJ), UTC timestamps, Cotonou timezone
- **Production**: `https://www.pixel-mart-bj.com`

---

## Tech Stack

| Layer      | Technology                           |
| ---------- | ------------------------------------ |
| Framework  | Next.js 15 (App Router, React 19)    |
| Database   | Convex (reactive, serverless)        |
| Auth       | Better Auth via Convex component     |
| Payments   | Moneroo (Mobile Money — West Africa) |
| UI         | shadcn/ui + Tailwind CSS v4          |
| Email      | Resend + react-email                 |
| PDF        | @react-pdf/renderer                  |
| Animation  | motion/react (Framer Motion v12)     |
| Push       | Web Push API + VAPID (sw.js)         |
| Testing    | Playwright + Vitest                  |
| Package    | pnpm                                 |

---

## Key Commands

```bash
# Development
pnpm dev                    # Start Next.js + Convex dev servers
pnpm convex dev             # Start Convex backend only

# Code Quality
pnpm lint                   # ESLint check
pnpm lint:fix               # Fix linting issues
pnpm format                 # Prettier format
pnpm typecheck              # TypeScript strict check

# Convex
npx convex codegen          # Regenerate _generated/api.d.ts (run after adding new module dirs)
npx convex run migrations/ensureCentimes:run '{"dry_run": true}'
npx convex run migrations/ensureCentimes:run '{"dry_run": false}'

# Testing
pnpm test                   # Run Vitest unit tests
pnpm test:e2e               # Run Playwright E2E tests

# Build & Deploy
pnpm build                  # Production build
pnpm convex deploy          # Deploy Convex to production
```

---

## Project Structure

```
pixelmart/
├── convex/                    # Backend (Convex functions)
│   ├── schema.ts             # Database schema (SINGLE SOURCE OF TRUTH)
│   ├── auth.ts               # Auth + Better Auth config
│   ├── http.ts               # HTTP routes (webhooks only)
│   ├── crons.ts              # Scheduled jobs
│   ├── lib/
│   │   ├── constants.ts      # Commission rates, delays, storage fee tiers
│   │   └── ratelimits.ts     # Rate limiting rules
│   ├── migrations/           # One-off data migration scripts
│   ├── [domain]/
│   │   ├── queries.ts        # Read-only, reactive
│   │   ├── mutations.ts      # Writes (transactional)
│   │   ├── actions.ts        # External API calls (non-transactional)
│   │   └── helpers.ts        # Domain utilities (pure functions)
│   ├── push/
│   │   ├── actions.ts        # "use node" — sendToUser via web-push
│   │   ├── mutations.ts      # subscribe, unsubscribe, setEnabled
│   │   └── queries.ts        # listMine, getStatus
│   ├── emails/
│   │   └── send.ts           # Internal email actions (Resend)
│   └── notifications/
│       ├── send.ts           # Dual-channel dispatchers (email + in-app + push)
│       ├── mutations.ts      # Mark read/unread
│       ├── queries.ts        # List, count unread
│       └── helpers.ts        # NOTIFICATION_TYPES, status labels
├── emails/                    # React Email templates (rendered server-side)
│   ├── components/
│   │   ├── Layout.tsx        # emailTheme (Apple-style spacing), shared wrappers
│   │   └── CTAButton.tsx     # Shared CTA button
│   ├── OrderConfirmation.tsx
│   ├── NewOrder.tsx
│   ├── OrderShipped.tsx
│   ├── OrderDelivered.tsx
│   ├── OrderCancelled.tsx
│   ├── OrderStatusUpdate.tsx
│   ├── LowStockAlert.tsx
│   ├── PayoutCompleted.tsx
│   ├── ReturnStatusUpdate.tsx
│   ├── NewReview.tsx
│   ├── StorageRequestReceived.tsx
│   ├── StorageValidated.tsx
│   ├── StorageRejected.tsx
│   ├── StorageInvoiceCreated.tsx
│   ├── StorageDebtDeducted.tsx
│   ├── VerifyEmail.tsx       # Handled by Better Auth
│   └── ResetPassword.tsx     # Handled by Better Auth
├── public/
│   └── sw.js                 # Service Worker for Web Push
├── src/
│   ├── app/
│   │   ├── (auth)/           # /login, /register, /forgot-password
│   │   ├── (marketing)/      # /landing (public, no auth required)
│   │   ├── (storefront)/     # Homepage, /products, /categories, /stores
│   │   ├── (customer)/       # /orders, /orders/[id]/return
│   │   ├── (vendor)/         # /vendor/* (role: vendor | admin)
│   │   ├── (agent)/          # /agent/* (role: agent | admin)
│   │   └── (admin)/          # /admin/* (role: admin) — structure in place, pages pending
│   ├── components/
│   │   ├── ui/               # shadcn/ui base components (DO NOT modify)
│   │   ├── atoms/            # Stateless primitives (no business logic)
│   │   ├── molecules/        # Composed atoms
│   │   ├── organisms/        # Feature-complete sections with data fetching
│   │   ├── templates/        # Page layouts with slots
│   │   ├── storage/templates/ # VendorStorageTemplate, VendorBillingTemplate
│   │   ├── agent/templates/   # AgentStorageTemplate
│   │   ├── notifications/     # NotificationList, PushNotificationsSettings
│   │   ├── layout/
│   │   │   ├── HeaderNav.tsx
│   │   │   ├── VendorSidebar.tsx
│   │   │   └── AgentSidebar.tsx
│   │   ├── marketing/        # Landing page components
│   │   └── emails/           # Email sub-components (OrderItemsTable, etc.)
│   ├── constants/
│   │   ├── routes.ts         # ROUTES + SHOP_ROUTES constants
│   │   └── vendor-nav.ts     # VENDOR_NAV_MAIN, VENDOR_NAV_SETTINGS
│   ├── hooks/
│   │   ├── useAddressAutocomplete.ts  # Nominatim geocoding + debounce
│   │   ├── useBulkSelection.ts
│   │   ├── useCart.ts
│   │   ├── useCurrentUser.ts
│   │   ├── useDeliveryBatchPDF.tsx
│   │   ├── useInvoiceDownload.tsx
│   │   ├── use-mobile.ts
│   │   ├── useNotifications.ts
│   │   ├── usePayouts.ts
│   │   └── usePushNotifications.ts   # SW registration, subscribe/unsubscribe
│   ├── lib/
│   │   ├── format.ts         # formatPrice(), formatDate(), formatRelativeTime()
│   │   └── utils.ts          # cn() and other generic utils
│   ├── types/
│   └── providers/
├── docs/
│   ├── ATOMIC_DESIGN_GUIDE.md
│   ├── CODE_STYLE_GUIDE.md
│   ├── CONTRIBUTING.md
│   ├── CONVEX_PATTERNS.md
│   └── ADMIN_DASHBOARD_GUIDE.md
└── e2e/                       # Playwright E2E tests
```

---

## Coding Conventions

### TypeScript

- Strict mode always on — NO `any`, use `unknown` + type guards
- Types derived from schema: `type OrderStatus = Doc<"orders">["status"]`
- Zod for runtime validation at system boundaries (forms, webhooks)
- `_i` prefix for intentionally unused array index params

### Convex Functions

- **Queries** — read-only, reactive, auto-cached. Never mutate state.
- **Mutations** — transactional writes. Never call external APIs.
- **Actions** — external API calls (Moneroo, Resend, Nominatim). NOT transactional.
- **Internal** — prefix `internal.` to restrict to backend-only calls.
- ⚠️ **NEVER** call external APIs inside mutations — always action → `ctx.runMutation`
- ⚠️ **NEVER** use `ctx.db` inside `httpAction` — call via `ctx.runMutation` / `ctx.runQuery`
- ⚠️ **NEVER** use `await import(...)` inside mutations or queries — edge runtime does not support dynamic imports. Use static imports at the top of the file.
- ⚠️ **Node.js built-ins** (crypto, https, url, net) require `"use node"` as first line of the file. Without it, Convex bundles for edge runtime. Example: `convex/push/actions.ts`.
- Background jobs: `ctx.scheduler.runAfter(0, internal.domain.actions.foo, args)`
- After adding a new `convex/[domain]/` directory: run `npx convex codegen` and commit `_generated/api.d.ts`

### Components (Atomic Design)

- **Atoms** — `Button`, `Input`, `Badge` — no business logic, no Convex calls
- **Molecules** — `SearchBar`, `CartItem` — compose atoms, may accept callbacks
- **Organisms** — `ProductGrid`, `OrderTimeline` — self-contained sections with data fetching
- **Templates** — full page layouts, delegate all data to organisms
- **Pages** (`app/**/page.tsx`) — minimal: pass searchParams/params to templates only

### Page Pattern

```tsx
// page.tsx — Client Component, owns state + queries
"use client";
export default function StoragePage() {
  const data = useQuery(api.storage.queries.getByStore, {});
  return <VendorStorageTemplate data={data ?? []} />;
}
```

### Naming

| Entity | Convention | Example |
|--------|-----------|---------|
| Components | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase + `use` prefix | `useNotifications.ts` |
| Convex tables | snake_case | `product_variants` |
| Convex functions | camelCase | `getProducts` |
| Routes/folders | kebab-case | `vendor/finance/invoices` |
| Constants | SCREAMING_SNAKE | `MIN_CENTIMES` |

---

## Money — The Only Rule That Matters

```
DB / Convex      → centimes (integer)
Moneroo send     → centimesToMonerooAmount(centimes, currency)   // XOF: no conversion; EUR: ÷100
Moneroo receive  → monerooAmountToCentimes(amount, currency)     // XOF: no conversion; EUR: ×100
Display          → formatPrice(centimes, "XOF") → "1 500 FCFA"  (NO division for XOF)
Email templates  → import { formatPrice } from "@/lib/format" — format inside template
Commission       → (subtotal - discount) × commission_rate / 10_000  // excludes delivery fee
```

**XOF special case**: `formatPrice` does NOT divide by 100 for XOF/XAF/GNF/CDF. The raw centimes value IS the FCFA display value (5000 centimes = 5 000 FCFA, not 50 FCFA).

```typescript
// convex/payments/helpers.ts
const NO_SUBUNIT_CURRENCIES = ["XOF", "XAF", "GNF", "CDF"];
export function centimesToMonerooAmount(centimes: number, currency: string): number {
  return NO_SUBUNIT_CURRENCIES.includes(currency) ? centimes : Math.round(centimes / 100);
}
export function monerooAmountToCentimes(amount: number, currency: string): number {
  return NO_SUBUNIT_CURRENCIES.includes(currency) ? amount : amount * 100;
}

// src/lib/format.ts
export function formatPrice(centimes: number, currency = "XOF"): string {
  const NO_DECIMAL = ["XOF", "XAF", "GNF", "CDF"];
  const amount = NO_DECIMAL.includes(currency) ? centimes : centimes / 100;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
```

---

## Notification Architecture

Every user-facing event triggers a **dual-channel dispatch** from `convex/notifications/send.ts`:

```typescript
// Pattern: internalAction → in-app mutation + Resend email + optional push
export const notifyXxx = internalAction({
  args: { ... },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.notifications.mutations.create, { ... }); // in-app
    const html = await render(XxxTemplate({ ...props }));
    await resend.emails.send({ from: EMAIL_FROM, to, subject, html });       // email
    await ctx.runAction(internal.push.actions.sendToUser, { ... });          // push (optional)
  }
});
```

**Notification types** (schema `notifications.type` field):

| Type | Audience | Email | Push | Trigger / Dispatcher |
|------|----------|-------|------|---------------------|
| `order_new` | Vendor | ✅ | ✅ | `payment.success` → `notifyNewOrderInApp` |
| `order_status` | Customer | ✅ | ✅ | payment confirmed, shipped, delivered, cancelled, expired → `notifyOrderStatusInApp` / `createInAppNotification` |
| `low_stock` | Vendor | ✅ | ✅ | `checkLowStock` cron → `notifyLowStock` |
| `payment` | Vendor | ✅ | ✅ | payout completed → `notifyPayoutCompleted` ; payout requested/failed → `createInAppNotification` |
| `new_review` | Vendor | ✅ | ✅ | review created + `autoPublishReviews` cron → `notifyNewReview` |
| `return_status` | Vendor + Customer | ✅ | ✅ | return status change → `notifyReturnStatus` |
| `question` | Vendor | ❌ | ✅ | question asked → `notifyNewQuestion` |
| `question_answered` | Customer | ❌ | ✅ | question answered → `notifyQuestionAnswered` |
| `review_replied` | Customer | ❌ | ✅ | vendor reply → `notifyReviewReplied` |
| `system` | Any | ❌ | ❌ | `createInAppNotification` |
| `promo` | Any | ❌ | ❌ | `createInAppNotification` |
| `storage_received` | Vendor + Admin | ❌ | ❌ | agent scan (`receiveRequest`) → `createInAppNotification` (both) |
| `storage_received` | Vendor | ✅ | ✅ | request created → `notifyStorageRequestReceived` |
| `storage_validated` | Vendor | ✅ | ✅ | admin validates → `notifyStorageValidated` |
| `storage_rejected` | Vendor | ✅ | ✅ | admin rejects / stale expiry → `notifyStorageRejected` / `createInAppNotification` |
| `storage_invoice` | Vendor | ✅ | ✅ | invoice created → `notifyStorageInvoiceCreated` ; invoice paid → `notifyStorageInvoicePaid` ; overdue → `createInAppNotification` |
| `storage_debt_deducted` | Vendor | ✅ | ✅ | debt deducted on payout → `notifyStorageDebtDeducted` |

**Web Push settings**:
- `push_notifications_enabled` field on `users` table (default: true)
- `push_subscriptions` table — endpoint, p256dh, auth keys per device
- User can disable in `/vendor/notifications` via `PushNotificationsSettings` component

---

## Webhook Architecture (`convex/http.ts` → `convex/payments/webhooks.ts`)

| `event.type` | Handler | Status |
|---|---|---|
| `payment.success` | `confirmPayment` | ✅ |
| `payment.failed` | `failPayment` | ✅ |
| `ad_payment.success` | `confirmAdPayment` | ✅ |
| `ad_payment.failed` | `failAdPayment` | ✅ |
| `payout.completed` | `confirmPayout` | ✅ |
| `payout.failed` | `failPayout` | ✅ |
| `storage_payment.success` | `confirmStoragePayment` | ✅ |
| `storage_payment.failed` | `failStoragePayment` | ✅ |

Always verify signature: `verifyMonerooSignature(rawBody, signature, secret)` before any processing.

---

## Critical Business Rules

### F-01: Transaction Logging
Every balance change **MUST** create a `transactions` record **in the same mutation**, before the balance patch.

### F-02: Minimum Payout
655 XOF minimum (stored as 65500 centimes). Fees deducted from gross. Net must remain > 0.

### F-03: Balance Release
Balance credited only when `order.status === "delivered"` AND `delivered_at` older than 48h. Enforced by cron.

### F-04: Commission Calculation
```typescript
// Base = subtotal minus coupon discount — delivery fee is NOT included
commission_amount = Math.round((subtotal - discount_amount) * commission_rate / 10_000)
```

### F-05: Storage Debt Priority
On payout request, outstanding `storage_debt` is deducted **first**, before fee calculation.

### F-06: Storage Blocking
A vendor with `fee_status: "unpaid"` on any invoice older than 30 days cannot withdraw products.

### Order Status Transitions (STRICT)
```
pending → paid              (Moneroo webhook: payment.success)
paid → processing           (vendor action)
processing → shipped        (vendor adds tracking)
shipped → delivered         (customer confirmation OR auto +7 days cron)
pending → cancelled         (customer, within 2h)
paid → cancelled            (customer, within 2h — triggers auto-refund)
processing → cancelled      (vendor only — triggers auto-refund)
paid/delivered → refunded   (admin or vendor)

FORBIDDEN: delivered→cancelled, shipped→paid, refunded→any, cancelled→any
```

### Storage Request Transitions
```
pending_drop_off → received     (agent: scans code + enters measurements)
received → in_stock             (admin: validates + generates invoice)
received → rejected             (admin: rejects with reason)
```

---

## Roles & Access Control

| Role | Space | Guard | Sidebar |
|------|-------|-------|---------|
| `customer` | `/account`, `/orders`, `/cart` | `AuthGuard roles={["customer","vendor","admin"]}` | — |
| `vendor` | `/vendor/*` | `AuthGuard roles={["vendor","admin"]}` | `VendorSidebar` |
| `agent` | `/agent/*` | `AuthGuard roles={["agent","admin"]}` | `AgentSidebar` |
| `admin` | `/admin/*` | `AuthGuard roles={["admin"]}` | — |

Middleware enforces session at the edge. `AuthGuard` is a second layer.

---

## Authentication

- **Provider**: Better Auth (email/password only — Google OAuth removed)
- **Session cookie**: `better-auth.session_token` (HTTP-only)
- **Logout**: `authClient.signOut()` + `window.location.href = "/login"` (full reload to clear Convex cache)
- **Multi-store**: After login, vendor with multiple stores sees `/vendor/select-store` to pick active store. `active_store_id` stored on `users` table.

---

## Email Templates

Sender: `Pixel-Mart <noreply@pixel-mart-bj.com>` — defined as `EMAIL_FROM` in `convex/notifications/send.ts`.

| Template | Trigger | Recipient |
|----------|---------|-----------|
| `OrderConfirmation` | `payment.success` | Customer |
| `NewOrder` | `payment.success` | Vendor |
| `OrderShipped` | Vendor marks shipped | Customer |
| `OrderDelivered` | Status → delivered | Customer |
| `OrderCancelled` | Any cancellation | Customer |
| `OrderStatusUpdate` | Status → processing | Customer |
| `LowStockAlert` | Stock < threshold | Vendor |
| `PayoutCompleted` | `payout.completed` webhook | Vendor |
| `ReturnStatusUpdate` | Return status change | Vendor + Customer |
| `NewReview` | Review published | Vendor |
| `StorageRequestReceived` | Request created | Vendor |
| `StorageValidated` | Admin validates | Vendor |
| `StorageRejected` | Admin rejects | Vendor |
| `StorageInvoiceCreated` | Invoice generated | Vendor |
| `StorageDebtDeducted` | Debt deducted on payout | Vendor |

---

## Vendor Dashboard Pages

| Route | Purpose | Status |
|-------|---------|--------|
| `/vendor/select-store` | Multi-store picker | ✅ |
| `/vendor/dashboard` | KPI overview | ✅ |
| `/vendor/orders` | Order list | ✅ |
| `/vendor/orders/[id]` | Order detail | ✅ |
| `/vendor/orders/returns` | Return requests | ✅ |
| `/vendor/products` | Product catalog | ✅ |
| `/vendor/products/new` | Create product | ✅ |
| `/vendor/products/[id]/edit` | Edit product | ✅ |
| `/vendor/delivery` | Delivery batches | ✅ |
| `/vendor/delivery/[id]` | Batch detail | ✅ |
| `/vendor/storage` | Storage requests + stock | ✅ |
| `/vendor/billing` | Storage billing & invoices | ✅ |
| `/vendor/finance` | Finance overview | ✅ |
| `/vendor/finance/payouts` | Payout management | ✅ |
| `/vendor/finance/invoices` | Invoice history | ✅ |
| `/vendor/ads` | Ad space booking | ✅ |
| `/vendor/analytics` | Revenue & order analytics | ✅ |
| `/vendor/coupons` | Coupon management | ✅ |
| `/vendor/reviews` | Customer reviews + replies | ✅ |
| `/vendor/store/settings` | Store settings | ✅ |
| `/vendor/store/theme` | Store theme | ✅ |
| `/vendor/store/meta` | Meta Pixel config | ✅ |
| `/vendor/settings` | Account settings | ✅ |
| `/vendor/notifications` | Notification center + push settings | ✅ |

## Admin Dashboard Pages

| Route | Purpose | Status |
|-------|---------|--------|
| `/admin/dashboard` | Platform overview | ✅ |
| `/admin/users` | User management | ✅ |
| `/admin/stores` | Store verification | ✅ |
| `/admin/categories` | Category management | ✅ |
| `/admin/payouts` | Payout approvals | ✅ |
| `/admin/orders` | Order management | ✅ |
| `/admin/storage` | Storage management | ✅ |
| `/admin/delivery` | Delivery batches | ✅ |

See `docs/ADMIN_DASHBOARD_GUIDE.md` for full specification.

## Agent Pages

| Route | Purpose | Status |
|-------|---------|--------|
| `/agent` | Warehouse reception — scan code + measurements | ✅ |

---

## Storage Module (Phases A–D ✅)

### Fee Tiers (XOF — 1 centime = 1 FCFA for XOF)
```typescript
// convex/lib/constants.ts — raw XOF values (no ×100 for XOF)
STORAGE_FEES.PER_UNIT          = 100    // 100 XOF/unit (≤50 units)
STORAGE_FEES.PER_UNIT_BULK     = 60     // 60 XOF/unit (>50 units)
STORAGE_FEES.BULK_THRESHOLD    = 50     // units threshold
STORAGE_FEES.MEDIUM_KG_FLAT    = 5_000  // 5 000 XOF flat (5–25 kg)
STORAGE_FEES.HEAVY_BASE        = 5_000  // 5 000 XOF base (>25 kg)
STORAGE_FEES.HEAVY_PER_KG      = 250    // 250 XOF per kg above 25
```

### Storage Code Format
`PM-{3-digit-sequential}` e.g. `PM-102`. Generated on request creation.

---

## Commit Convention

```
type(scope): description (imperative, lowercase, no period)

Types:   feat | fix | refactor | ui | schema | api | config | docs | test | chore
Scopes:  auth | users | stores | products | orders | payments | transactions |
         payouts | reviews | coupons | checkout | dashboard | admin | ads |
         storage | agent | billing | notifications | emails | storefront
```

---

## Git Workflow

```
main                    ← production (protected, auto-deploys to Vercel)
  └── feat/xxx          ← feature branches (max 3 days)
  └── fix/xxx           ← bugfix branches
  └── hotfix/xxx        ← emergency fixes
  └── schema/xxx        ← schema-only changes
```

1. Direct push to `main` BLOCKED — branch protection enabled
2. feature branch → PR → squash merge → delete branch
3. PR title = final commit message (validated by CI commitlint)

---

## External Integrations

### Moneroo (Payments)
- Webhook: `POST /webhooks/moneroo` (Convex HTTP route)
- Signature: `verifyMonerooSignature` (HMAC-SHA256) before any processing
- Amount conversion: `centimesToMonerooAmount(centimes, currency)` / `monerooAmountToCentimes(amount, currency)`
- Payment types: `payment.*` | `ad_payment.*` | `payout.*` | `storage_payment.*`

### Nominatim (Geocoding)
- Rate limit: 1 req/sec — always debounce in `useAddressAutocomplete`
- Country restriction: `countrycodes=bj`

### Resend (Email)
- Templates: `/emails/*.tsx` (React Email, Apple-style spacing)
- From: `Pixel-Mart <noreply@pixel-mart-bj.com>`
- All sends via `convex/notifications/send.ts` dispatchers

### Better Auth
- Email/password only (Google OAuth removed)
- Session cookie: `better-auth.session_token` (HTTP-only)

### Web Push
- VAPID keys in env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT`
- Service worker: `public/sw.js` — handles `push` and `notificationclick` events
- `convex/push/actions.ts` uses `"use node"` + `web-push` library

---

## Key Files

| File | Purpose |
|------|---------|
| `convex/schema.ts` | All DB tables — single source of truth |
| `convex/http.ts` | Webhook routing (Moneroo + Better Auth) |
| `convex/payments/webhooks.ts` | Moneroo event handlers |
| `convex/payments/helpers.ts` | `centimesToMonerooAmount`, `monerooAmountToCentimes` |
| `convex/notifications/send.ts` | Dual-channel + push notification dispatchers |
| `convex/push/actions.ts` | Web Push send (requires `"use node"`) |
| `convex/lib/constants.ts` | All backend constants |
| `convex/lib/format.ts` | `formatAmountText(centimes, currency)` — Convex-side amount formatting |
| `src/lib/format.ts` | `formatPrice()`, `formatDate()`, `formatRelativeTime()` — frontend canonical |
| `src/middleware.ts` | Preview gate + session auth gate |
| `src/constants/routes.ts` | All app routes as constants |
| `src/components/auth/AuthGuard.tsx` | Role-based access guard (client-side) |
| `src/hooks/usePushNotifications.ts` | Push subscription management |
| `public/sw.js` | Service Worker for Web Push |

---

## Do NOT

- ❌ Build Phase 2+ features (AI recommendations, ML pricing) in Phase 1
- ❌ Store sensitive data client-side (tokens, secrets)
- ❌ Call external APIs inside Convex mutations — use actions
- ❌ Use `ctx.db` inside `httpAction` — use `ctx.runMutation`/`ctx.runQuery`
- ❌ Use `await import(...)` inside mutations or queries — edge runtime doesn't support it
- ❌ Use Node.js built-ins (crypto, https, net) in files without `"use node"` as first line
- ❌ Skip signature verification on webhooks
- ❌ Skip input validation on any financial operation
- ❌ Hardcode credentials or API keys — always use env vars
- ❌ Build custom UI components when shadcn/ui provides one
- ❌ Use inline CSS — Tailwind utilities only
- ❌ Create local type aliases for schema-derived types — use `Doc<"table">["field"]`
- ❌ Divide centimes by 100 for XOF display — raw centimes = FCFA value
- ❌ Send XOF amounts to Moneroo ÷ 100 — use `centimesToMonerooAmount(amount, currency)`
- ❌ Push directly to `main`
- ❌ Forget `npx convex codegen` after adding a new convex module directory
