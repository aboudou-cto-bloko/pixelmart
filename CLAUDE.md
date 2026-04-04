# PIXEL-MART — Claude Code Context

## Pour Claude — Comment travailler sur ce projet

Avant de toucher au code, consulte la documentation dans `/docs/` :

| Besoin | Fichier |
|--------|---------|
| Comprendre l'architecture globale | `docs/ARCHITECTURE.md` |
| Tracer un flux bout en bout (commande, paiement, stockage…) | `docs/FLOWS.md` |
| Trouver une fonction Convex (query/mutation/action) | `docs/API_REFERENCE.md` |
| Règles de code, naming, patterns Convex | `docs/CODE_STYLE_GUIDE.md` + `docs/CONVEX_PATTERNS.md` |
| Règles de commit, branches, PR | `docs/CONTRIBUTING.md` |
| Schéma DB complet | `docs/DATA_MODEL.md` |
| Dashboard admin | `docs/ADMIN_DASHBOARD_GUIDE.md` |

### Skills à utiliser

- **`/commit`** — pour créer un commit (applique automatiquement le format conventionnel)
- **Plan agent** (`subagent_type: "Plan"`) — avant d'implémenter une fonctionnalité non triviale, utilise l'agent Plan pour concevoir l'approche
- **Explore agent** (`subagent_type: "Explore"`) — pour explorer le codebase avant de modifier un module inconnu

### Règles de workflow

1. Lire les fichiers avant de les modifier
2. Créer une branche `feat/` ou `fix/` (jamais pousser sur `main`)
3. Commit avec le format `type(scope): description` — voir `docs/CONTRIBUTING.md` §4
4. Ouvrir une PR → squash merge → supprimer la branche

---

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

**Commission source of truth**: `platform_config` table (keys `commission_free`, `commission_pro`, `commission_business` in basis points). Read via `getEffectiveCommissionRates(ctx)` + `getCommissionRate(tier, rates)` in `convex/orders/helpers.ts`. The `store.commission_rate` field is a legacy default (500 bp) — **never use it for calculations or display**. Use `api.stores.queries.getPublicCommissionRates` on the frontend.

### F-05: Storage Debt Priority
On payout request, outstanding `storage_debt` is deducted **first**, before fee calculation.

### F-06: Storage Blocking
A vendor with `fee_status: "unpaid"` on any invoice older than 30 days cannot withdraw products.

### F-07: COD Order Payment Status
COD orders (`payment_mode = "cod"`) are created with `payment_status = "paid"` (not "pending"). The `confirmPayment` mutation is never called for COD — F-01 transactions (sale + fee) and vendor/customer notifications are generated **inline in `createOrder`**.

### F-08: Refund Flow
When `cancelOrder` is called on a `payment_status = "paid"` order, it schedules `internal.payments.moneroo.requestRefund`. That action calls Moneroo's refund endpoint and then calls `markRefunded` mutation (F-01: debit pending_balance, create "refund" transaction). For COD orders with no `payment_reference`, the refund is marked directly without API call.

### F-09: Balance Release Guard
`releaseBalances` cron uses `releasableAmount = Math.min(netAmount, store.pending_balance)` to prevent over-crediting if `pending_balance` was already depleted. If `releasableAmount <= 0`, the order is skipped.

### F-10: Expired Orders — Verify Before Cancel
`expirePendingOrders` cron: if an order has a `payment_reference`, it schedules `verifyPayment` (Moneroo check) instead of cancelling immediately. If no `payment_reference`, the order is cancelled directly (user never initiated payment).

### Order Status Transitions (STRICT)
```
pending → paid              (Moneroo webhook: payment.success OR COD inline in createOrder)
paid → processing           (vendor action)
processing → shipped        (vendor adds tracking)
processing → ready_for_delivery  (vendor action)
shipped → delivered         (customer confirmation OR auto +7 days cron)
shipped → delivery_failed   (vendor action — notifies vendor + customer)
delivery_failed → shipped   (vendor retry)
pending → cancelled         (customer, within 2h)
paid → cancelled            (customer, within 2h — triggers requestRefund action)
processing → cancelled      (vendor only — triggers requestRefund action)
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
| `guest` | `/`, `/shop/*`, `/cart` | none — public | — |
| `customer` | `/account`, `/orders` | `AuthGuard roles={["customer","vendor","admin"]}` | — |
| `vendor` | `/vendor/*` | `AuthGuard roles={["vendor","admin"]}` | `VendorSidebar` |
| `agent` | `/agent/*` | `AuthGuard roles={["agent","admin"]}` | `AgentSidebar` |
| `admin` | `/admin/*` | `AuthGuard roles={["admin"]}` | — |

Middleware enforces session at the edge. `AuthGuard` is a second layer.

**Guest cart**: `/cart` is in `AUTH_PUBLIC` — unauthenticated users can browse, add to cart (localStorage), and view the cart. Auth is enforced at `createOrder` (checkout). Cart mutations `validateCart` and `validateProductForCart` accept unauthenticated callers; the "own product" check is skipped for guests.

---

## Authentication

- **Provider**: Better Auth (email/password only — Google OAuth removed)
- **Session cookie**: `pm.session_token` — `httpOnly: true`, `secure: true`, `sameSite: "strict"` — durée **2 jours** (réduit de 7)
- **Logout**: `authClient.signOut()` + `window.location.href = "/login"` (full reload to clear Convex cache)
- **Multi-store**: After login, vendor with multiple stores sees `/vendor/select-store` to pick active store. `active_store_id` stored on `users` table.
- **Guest checkout**: Un client peut commander sans compte depuis le shop vendeur (`QuickOrderSheet`). L'email est collecté au checkout. Si l'email est inconnu → compte provisoire (`better_auth_user_id = null`) + email de setup (token 7j). Si l'email existe → commande associée. À l'inscription (Better Auth `onCreate`), les comptes provisoires sont automatiquement liés.

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
| `GuestAccountSetup` | Guest order created (provisional account) | Guest customer |

---

## Vendor Dashboard Pages

| Route | Purpose | Status |
|-------|---------|--------|
| `/vendor/select-store` | Multi-store picker | ✅ |
| `/vendor/dashboard` | KPI overview + dismissible WhatsApp community banner | ✅ |
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
| `/admin/users` | User management list | ✅ |
| `/admin/users/[id]` | User profile + order history | ✅ |
| `/admin/stores` | Store verification | ✅ |
| `/admin/categories` | Category management | ✅ |
| `/admin/payouts` | Payout approvals | ✅ |
| `/admin/orders` | Order management list | ✅ |
| `/admin/orders/[id]` | Order detail + customer card | ✅ |
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
- Payout methods: `GET /v1/utils/payout/methods` via `api.payouts.actions.listPayoutMethods` (public action, filtered by store country with static fallback)

### Nominatim (Geocoding)
- Rate limit: 1 req/sec — always debounce in `useAddressAutocomplete`
- Country restriction: `countrycodes=bj`

### Resend (Email)
- Templates: `/emails/*.tsx` (React Email, Apple-style spacing)
- From: `Pixel-Mart <noreply@pixel-mart-bj.com>`
- All sends via `convex/notifications/send.ts` dispatchers

### Better Auth
- Email/password only (Google OAuth removed)
- Session cookie: `pm.session_token` — `httpOnly`, `secure`, `sameSite: "strict"` — expires 2 days

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

## Analytics

Vendor analytics supports periods: `"1d"` | `"7d"` | `"30d"` | `"90d"` | `"12m"`.
- `"1d"` uses `"hour"` granularity (buckets labeled `"14h"`)
- Other periods use `"day"`, `"week"`, or `"month"` granularity
- Admin dashboard has separate `"7d"` | `"30d"` | `"90d"` period selector

## RichTextEditor (Product Description)

`src/components/products/RichTextEditor.tsx` — TipTap-based editor with image upload.

Key behaviours:
- **Async sync**: `useEffect` syncs the `value` prop into the editor **once** (on first non-empty value) via `editor.commands.setContent(value, { emitUpdate: false })`. Prevents overwriting user edits on re-renders.
- **Image deletion**: Tracks uploaded images (`storageId → src` Map ref). On every `onUpdate`, images removed from editor content trigger `api.files.mutations.deleteFile` automatically.
- **Upload flow**: `generateUploadUrl` → POST → `getUrl` → `editor.setImage` → tracked in `uploadedImages` ref.
- **Image NodeView**: Custom `ReactNodeViewRenderer` (`ImageNodeView`) wraps each image with a hover-visible delete button (×). Clicking it calls `deleteNode()` which removes the node and triggers the cleanup above. Uses `@tiptap/react` `NodeViewWrapper` + `NodeViewProps`.

## VendorSidebar

`src/components/layout/VendorSidebar.tsx` — shadcn Sidebar with collapsible icon mode.

Footer order (bottom to top when collapsed):
1. `UserFooter` — profile dropdown
2. `WhatsAppCommunity` — vendor WhatsApp group link (hidden when collapsed)
3. `SetupProgress` — onboarding progress bar (hidden when collapsed or complete)

## Security (OWASP Top 10 Measures)

Configured in `next.config.ts` via `headers()`:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' [convex/nominatim/moneroo/facebook]; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests` | XSS, clickjacking, injection |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS (HSTS) |
| `X-Frame-Options` | `DENY` | Clickjacking (legacy support alongside CSP) |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `X-XSS-Protection` | `0` | Disabled — modern browsers use CSP instead |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Privacy |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Feature restriction |

**Session hardening** (`convex/auth.ts`):
- Duration: **2 days** (down from 7), refresh window: **4 hours**
- Cookie: `httpOnly: true`, `secure: true`, `sameSite: "strict"`, prefix: `pm`

**Input validation**: Zod at all system boundaries (forms, webhooks). Webhook signatures verified via HMAC-SHA256 before any DB write.

**Rate limiting**: Convex rate limits on mutations (see `convex/lib/ratelimits.ts`).

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

---

## UX — Backlog (session 2026-04-04)

### Fait (mergé sur main)

| PR | Branche | Description |
|----|---------|-------------|
| #169 | `fix/cart-error-toast` | Toast d'erreur sonner quand `addItem()` échoue (ProductCard + ShopProductCard) |
| #170 | `feat/ux-storefront` | A11y : skip link, focus-visible ring, `aria-live` badge panier, `ScrollToTop` FAB, badge filtres count, stepper checkout 3 étapes, swipe galerie mobile |
| #171 | `feat/shop-storefront-parity` | Shop vendeur : skip link, validation warnings panier, bouton `-` disabled à qty=1, tri produits client-side |

### Prêt à merger (branches locales, push bloqué — pas de réseau)

| Branche | Description |
|---------|-------------|
| `feat/newsletter` | Table `newsletter_subscribers`, mutation `subscribe` (dedup), `NewsletterBar` wired |
| `feat/wishlist` | Table `wishlists`, mutation `toggle`, query `listByUser`, `WishlistButton` atom sur `ProductCard` ; + `aria-live` filtres + keyboard lightbox |

### Reste à faire

#### Priorité moyenne

- **Homepage SuggestToday** — section "Suggestions du jour" marquée "à implémenter dans un second temps" dans `HomepageTemplate.tsx`.
  Idée : produits les plus consultés dans les 24h (nouveau champ `view_count` sur `products` incrémenté via action) ou sélection manuelle admin.
  Fichier : `src/components/storefront/templates/HomepageTemplate.tsx`
